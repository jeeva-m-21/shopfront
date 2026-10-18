import type { MetadataRoute } from 'next';
import { query } from '../db.js';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

  // 1. Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/for-merchants`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/developers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 2. Dynamic live shops
  try {
    const shopsRes = await query<{ slug: string; updated_at: Date }>(
      "SELECT slug, updated_at FROM shops WHERE status = 'live'"
    );

    const shopRoutes: MetadataRoute.Sitemap = shopsRes.rows.map((shop) => ({
      url: `${baseUrl}/shop/${shop.slug}`,
      lastModified: new Date(shop.updated_at),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    return [...staticRoutes, ...shopRoutes];
  } catch {
    return staticRoutes;
  }
}
