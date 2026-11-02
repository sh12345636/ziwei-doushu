/**
 * /renji — 人纪（中医五课）
 */
import NihaiModuleList from '@/components/nihai/NihaiModuleList';
import { RENJI_MODULES } from '@/lib/nihai';

export const metadata = {
  title: '人纪 · 倪海厦中医五课 · 针灸 / 内经 / 本草 / 伤寒 / 金匮',
  description:
    '倪海厦人纪中医五课完整脉络：针灸大成、黄帝内经、神农本草经、伤寒论、金匮要略。含针灸经验穴 120 条、汉唐方剂与经典经方。',
};

export default function RenjiPage() {
  return <NihaiModuleList category="renji" modules={RENJI_MODULES} />;
}
