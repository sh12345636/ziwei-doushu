/**
 * /diji — 地纪（倪师未竟之业 · 后辈补注）
 */
import NihaiModuleList from '@/components/nihai/NihaiModuleList';
import { DIJI_MODULES } from '@/lib/nihai';

export const metadata = {
  title: '地纪 · 倪海厦未竟之业 · 堪舆与地理',
  description:
    '倪海厦原计划 60 岁后著述地纪，2012 年辞世时仅留下构想与《天纪》中堪舆学的理论基础。本板块为遗稿整理与后辈补注。',
};

export default function DijiPage() {
  return <NihaiModuleList category="diji" modules={DIJI_MODULES} />;
}
