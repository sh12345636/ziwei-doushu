/**
 * lib/ai/client —— 浏览器端 AI 客户端（纯静态 APP 专用）
 *
 * 与 provider.ts（服务端版）的区别：
 *   · 配置不存在服务器，存在用户自己的 localStorage 里，用户自己填 key
 *   · 请求由浏览器直发模型供应商，不经过任何中间服务器
 *   · 排盘永远不需要 key；只有「AI 解读」需要
 *
 * 注意：浏览器直连要求供应商开放 CORS。DeepSeek / OpenAI / 多数中转站已开放；
 * 若某端点不支持，可改用支持 CORS 的中转服务，或用 Capacitor 原生 HTTP 插件绕过。
 */

export interface UserAiConfig {
  /** 例如 https://api.deepseek.com/v1 */
  baseURL: string;
  apiKey: string;
  model: string;
}

export interface ClientChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'ziwei.ai.config.v1';

export const DEFAULT_AI_CONFIG: UserAiConfig = {
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
};

/** 常见供应商预设，设置面板里给用户一键选 */
export const AI_PRESETS: { name: string; baseURL: string; model: string }[] = [
  { name: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { name: 'DeepSeek（强推理）', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-v4-pro' },
  { name: 'Kimi 月之暗面', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { name: '阿里通义千问', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { name: '智谱 GLM', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { name: '本地 Ollama', baseURL: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b' },
];

export function loadAiConfig(): UserAiConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserAiConfig>;
    if (!parsed.apiKey || !parsed.baseURL || !parsed.model) return null;
    return {
      baseURL: parsed.baseURL,
      apiKey: parsed.apiKey,
      model: parsed.model,
    };
  } catch {
    return null;
  }
}

export function saveAiConfig(cfg: UserAiConfig): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearAiConfig(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isAiConfigured(): boolean {
  return loadAiConfig() !== null;
}

/** 配置缺失时给用户看的说明 */
export const AI_NOT_CONFIGURED_HINT =
  '还没有配置 AI 模型。点右上角「⚙ 模型设置」，填入你自己的 API 密钥即可。\n' +
  '排盘、看盘、古籍这些功能完全不需要密钥。';

/**
 * 浏览器直连模型，逐段吐出文本。
 * 抛出的错误信息会直接显示给用户，所以文案要能看懂。
 */
export async function* streamChatClient(
  cfg: UserAiConfig,
  messages: ClientChatMessage[],
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): AsyncGenerator<string, void, unknown> {
  const url = cfg.baseURL.replace(/\/+$/, '') + '/chat/completions';

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        stream: true,
        temperature: opts.temperature ?? 0.75,
        ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      }),
      signal: opts.signal,
    });
  } catch (err) {
    // 网络层错误：CORS 被拦 / 断网 / 地址写错，表现都是一样的
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    if (isAbort) throw new Error('已取消');
    throw new Error(
      `无法连接模型接口：${url}\n` +
        `常见原因：① 接口地址写错 ② 该服务未开放浏览器跨域(CORS) ③ 网络不通。\n` +
        `可尝试换成支持 CORS 的中转地址。`,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new Error('密钥无效（401）。请到「⚙ 模型设置」检查 API Key 是否填对、是否已过期。');
    }
    if (res.status === 402) throw new Error('账户余额不足（402）。请到供应商后台充值。');
    if (res.status === 404) throw new Error(`接口或模型名不存在（404）。请检查模型名「${cfg.model}」是否正确。`);
    if (res.status === 429) throw new Error('请求太频繁（429），稍等一下再试。');
    throw new Error(`模型接口返回 ${res.status}${detail ? `：${detail.slice(0, 200)}` : ''}`);
  }

  if (!res.body) throw new Error('模型没有返回内容流');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.search(/\r?\n\r?\n/)) !== -1) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx).replace(/^\r?\n\r?\n/, '');

      for (const line of rawEvent.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
            error?: { message?: string };
          };
          if (json.error?.message) throw new Error(json.error.message);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch (e) {
          if (e instanceof Error && e.message && !e.message.startsWith('Unexpected')) {
            // 服务端在流里塞了错误
            if (/error/i.test(e.message)) throw e;
          }
        }
      }
    }
  }
}
