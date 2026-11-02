/**
 * /tianji — 倪海厦《天纪》学习模块
 */
import NihaiModuleList from '@/components/nihai/NihaiModuleList';
import { TIANJI_MODULES } from '@/lib/nihai';

export const metadata = {
  title: '天纪 · 倪海厦《天纪》紫微斗数 / 易经六十四卦 / 堪舆',
  description:
    '倪海厦《天纪》完整课程脉络：紫微斗数（三合派）、易经六十四卦（象数派）、堪舆学（九星派）、推命、面相、测字。含各模块章节要点与倪师原话。',
};

export default function TianjiPage() {
  return <NihaiModuleList category="tianji" modules={TIANJI_MODULES} />;
}
