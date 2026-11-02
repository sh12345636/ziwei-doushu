/**
 * lib/ai/provider —— 统一的 OpenAI 兼容流式客户端。
 *
 * 只依赖 fetch，不引第三方 SDK，换供应商只改环境变量：
 *
 *   # DeepSeek（默认）
 *   AI_PROVIDER=deepseek
 *   DEEPSEEK_API_KEY=sk-xxx
 *
 *   # 任意 OpenAI 兼容端点（kimi / 通义 / 本地 ollama / vllm …）
 *   AI_PROVIDER=openai-compatible
 *   AI_BASE_URL=https://your-endpoint/v1
 *   AI_API_KEY=sk-xxx
 *   AI_MODEL=your-model
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiConfig {
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

function firstNonEmpty(...vals: (string | undefined)[]): string {
  for (const v of vals) if (v && v.trim()) return v.trim();
  return '';
}

/**
 * 从环境变量解析配置；缺 key 或缺 baseURL 返回 null（路由据此返回 501）。
 */
export function getAiConfig(): AiConfig | null {
  const provider = firstNonEmpty(process.env.AI_PROVIDER) || 'deepseek';

  if (provider === 'mimo') {
    const baseURL = firstNonEmpty(process.env.MIMO_BASE_URL);
    const apiKey = firstNonEmpty(process.env.MIMO_API_KEY);
    const model = firstNonEmpty(process.env.MIMO_MODEL) || 'mimo-v2';
    return baseURL && apiKey ? { provider, baseURL, apiKey, model } : null;
  }

  if (provider === 'deepseek') {
    const apiKey = firstNonEmpty(process.env.DEEPSEEK_API_KEY, process.env.AI_API_KEY);
    const baseURL = firstNonEmpty(process.env.DEEPSEEK_BASE_URL, process.env.AI_BASE_URL) || 'https://api.deepseek.com/v1';
    const model = firstNonEmpty(process.env.DEEPSEEK_MODEL, process.env.AI_MODEL) || 'deepseek-chat';
    return apiKey ? { provider, baseURL, apiKey, model } : null;
  }

  // openai-compatible / 其他
  const baseURL = firstNonEmpty(process.env.AI_BASE_URL, process.env.OPENAI_BASE_URL);
  const apiKey = firstNonEmpty(process.env.AI_API_KEY, process.env.OPENAI_API_KEY);
  const model = firstNonEmpty(process.env.AI_MODEL, process.env.OPENAI_MODEL);
  return baseURL && apiKey && model ? { provider, baseURL, apiKey, model } : null;
}

/** 配置缺失时，给用户看的可执行说明 */
export function missingConfigHint(): string {
  return (
    '尚未配置 AI 模型。请在项目根目录创建 .env.local（可复制 .env.example），至少填：\n' +
    '  AI_PROVIDER=deepseek\n' +
    '  DEEPSEEK_API_KEY=你的密钥\n' +
    '改完需重启 dev server 才会生效。注意：排盘本身不需要密钥，只有 AI 解读需要。'
  );
}

/** 把 OpenAI 兼容接口的 SSE 流转成纯文本 delta 序列 */
export async function* streamChatCompletion(
  cfg: AiConfig,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): AsyncGenerator<string, void, unknown> {
  const url = cfg.baseURL.replace(/\/+$/, '') + '/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      stream: true,
      temperature: opts.temperature ?? 0.7,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`模型接口返回 ${res.status}${detail ? `：${detail.slice(0, 300)}` : ''}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 事件以空行分隔；兼容 \r\n
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
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // 单个坏事件不影响后续
        }
      }
    }
  }
}

/**
 * 把 delta 序列包成前端要的 SSE 响应：
 *   data: {"delta":{"text":"…"}}\n\n  …  data: [DONE]\n\n
 */
export function toSseResponse(source: AsyncGenerator<string, void, unknown>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const delta of source) {
          if (delta) send({ delta: { text: delta } });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '生成中断';
        send({ error: msg });
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
