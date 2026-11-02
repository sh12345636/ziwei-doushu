import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// 纯静态导出（output: 'export'）要求元数据路由显式标记为静态
export const dynamic = 'force-static';

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/preview-versions/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
