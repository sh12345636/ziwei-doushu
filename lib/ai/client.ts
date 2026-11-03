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

/**
 * 保存配置。返回是否真的写进去了 —— 失败时把原因带回界面，
 * 而不是静默吞掉（之前「点保存没反应」就是被吞在这里）。
 */
export function saveAiConfig(cfg: UserAiConfig): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { ok: false, error: '当前环境不支持本地存储' };
  }
  try {
    const payload = JSON.stringify(cfg);
    window.localStorage.setItem(STORAGE_KEY, payload);

    // 读回验证：某些 WebView 的 setItem 会静默失败
    const back = window.localStorage.getItem(STORAGE_KEY);
    if (!back) return { ok: false, error: '写入后读不到，浏览器可能禁用了本地存储' };
    const parsed = JSON.parse(back) as Partial<UserAiConfig>;
    if (parsed.apiKey !== cfg.apiKey) return { ok: false, error: '写入内容与预期不一致' };

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/quota/i.test(msg)) return { ok: false, error: '本地存储空间已满' };
    if (/security|denied|not allowed/i.test(msg)) {
      return { ok: false, error: '浏览器禁止了本地存储（隐私模式或安全策略）' };
    }
    return { ok: false, error: msg };
  }
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

  // 超时保护：接口挂住时不能让界面永久卡在「生成中」
  const ac = new AbortController();
  const TIMEOUT_MS = 90000;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = setTimeout(() => ac.abort(), TIMEOUT_MS);
  const clearTimer = () => {
    if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }
  };
  const onUserAbort = () => ac.abort();
  opts.signal?.addEventListener('abort', onUserAbort);

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
      signal: ac.signal,
    });
  } catch (err) {
    // 网络层错误：CORS 被拦 / 断网 / 地址写错，表现都是一样的
    clearTimer();
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    if (isAbort) {
      if (opts.signal?.aborted) throw new Error('已取消');
      throw new Error(`请求超时（${TIMEOUT_MS / 1000} 秒无响应）。请检查网络或接口地址。`);
    }
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

  /** SSE 事件里可能出现的字段 */
  type StreamEvent = {
    choices?: { delta?: { content?: string } }[];
    error?: { message?: string };
  };

  /** 解析一个 SSE 事件块，把 delta 逐条吐出去 */
  const parseEvent = (rawEvent: string): string[] => {
    const out: string[] = [];
    for (const line of rawEvent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      // JSON 解析失败 = 坏事件，跳过即可，绝不能当成致命错误
      let json: StreamEvent | null = null;
      try {
        json = JSON.parse(payload) as StreamEvent;
      } catch {
        continue;
      }
      if (!json) continue;

      // 服务端在流里塞了错误：务必抛出来，否则用户只会看到空回复
      if (json.error?.message) {
        throw new Error(`模型返回错误：${json.error.message}`);
      }

      const delta = json.choices?.[0]?.delta?.content;
      if (delta) out.push(delta);
    }
    return out;
  };

  let deltaCount = 0;
  let rawSample = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value, { stream: true });
      if (rawSample.length < 800) rawSample += chunkText.slice(0, 800 - rawSample.length);
      buffer += chunkText;

      let idx: number;
      while ((idx = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx).replace(/^\r?\n\r?\n/, '');
        for (const d of parseEvent(rawEvent)) { deltaCount++; yield d; }
      }
    }

    // 流结束时缓冲区可能残留最后一个事件（有些服务端末尾不带空行）
    buffer += decoder.decode();
    if (buffer.trim()) {
      for (const d of parseEvent(buffer)) { deltaCount++; yield d; }
    }
    // 一个 delta 都没收到：把原始响应当线索抛出来，别让用户对着空白猜
    if (deltaCount === 0) {
      const sample = rawSample.trim();
      if (!sample) {
        throw new Error('模型返回了空响应。请检查「⚙ 模型设置」里的接口地址与模型名。');
      }
      if (sample.startsWith('{')) {
        throw new Error(`模型返回的不是流式格式，原始内容：${sample.slice(0, 300)}`);
      }
      throw new Error(`模型没有返回可识别的内容，原始响应：${sample.slice(0, 300)}`);
    }
  } finally {
    clearTimer();
    opts.signal?.removeEventListener('abort', onUserAbort);
    // 提前退出（用户取消/抛错）时释放底层连接
    reader.cancel().catch(() => undefined);
  }
}
