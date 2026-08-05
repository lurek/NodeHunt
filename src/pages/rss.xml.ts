import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPublishedSummaries } from '@/utils/content';
import { siteConfig } from '@/config/site';
export const GET: APIRoute = async () => {
  const posts = await getPublishedSummaries();
  return rss({ title: siteConfig.name, description: siteConfig.description, site: siteConfig.url, items: posts.map((post) => ({ title: post.title, description: post.description, pubDate: post.publishedAt, link: post.url })) });
};
