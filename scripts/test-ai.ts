/**
 * 端到端测试：用真实命盘打本地 /api/interpret，验证 AI 解读链路。
 * 跑：npx tsx scripts/test-ai.ts
 */
import { generateChart } from '../lib/ziwei/algorithm';

const BASE = process.env.AI_TEST_BASE ?? 'http://127.0.0.1:3001';

async function ask(chart: unknown, question: string): Promise<void> {
  console.log('\n提问：' + question);
  const t0 = Date.now();

  const res = await fetch(`${BASE}/api/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chart, messages: [{ role: 'user', content: question }] }),
  });

  console.log(`HTTP ${res.status}  (${Date.now() - t0}ms)`);
  if (!res.body) {
    console.log('无响应体');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = '';
  let firstTokenMs = 0;
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const j = JSON.parse(data) as { delta?: { text?: string }; error?: string };
        if (j.error) console.log('\n[服务端错误] ' + j.error);
        if (j.delta?.text) {
          if (!firstTokenMs) firstTokenMs = Date.now() - t0;
          chunkCount++;
          out += j.delta.text;
        }
      } catch {
        /* 跳过坏事件 */
      }
    }
  }

  console.log(`首 token ${firstTokenMs}ms · 共 ${chunkCount} 个分片 · 全文 ${out.length} 字 · 总耗时 ${Date.now() - t0}ms`);
  console.log('─'.repeat(70));
  console.log(out);
  console.log('─'.repeat(70));
}

async function askHeming(a: unknown, b: unknown, question: string): Promise<void> {
  console.log('\n[合盘] ' + question);
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/heming`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chartA: a, chartB: b, question }),
  });
  console.log(`HTTP ${res.status}  (${Date.now() - t0}ms)`);
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const j = JSON.parse(data) as { delta?: { text?: string }; error?: string };
        if (j.error) console.log('\n[服务端错误] ' + j.error);
        if (j.delta?.text) out += j.delta.text;
      } catch {
        /* skip */
      }
    }
  }
  console.log(`全文 ${out.length} 字 · 总耗时 ${Date.now() - t0}ms`);
  console.log('─'.repeat(70));
  console.log(out);
  console.log('─'.repeat(70));
}

async function main() {
  const chart = generateChart({ year: 1990, month: 1, day: 1, hour: 0, gender: 'male' });
  console.log(
    `测试命盘：1990-01-01 子时 男 · 命宫${chart.wuxingJuName} · 命主${chart.mingZhu ?? '-'}`,
  );
  await ask(chart, '我的命格如何？请结合命宫天府一星说明性格与一生格局，200 字以内。');

  // ── 合盘 ──
  const chartB = generateChart({ year: 1995, month: 6, day: 15, hour: 6, gender: 'female' });
  console.log(`\n合盘对象：1995-06-15 午时 女 · 命宫${chartB.wuxingJuName}`);
  await askHeming(chart, chartB, '我们两个合不合？婚姻方面要注意什么？300 字以内。');
}

main().catch((e) => {
  console.error('测试失败：', e);
  process.exit(1);
});
