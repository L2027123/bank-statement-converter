import type { MetadataRoute } from "next";
import { BANKS } from "@/lib/banks";

/**
 * 生成 sitemap.xml
 * 包含主页、上传页、登录页、定价页、隐私政策、服务条款 + 所有银行着陆页
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://bank-statement-converter-lemon.vercel.app";
  const now = new Date();

  // 静态页面
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/upload?demo=true`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 50 个银行着陆页
  const bankRoutes: MetadataRoute.Sitemap = BANKS.map((bank) => ({
    url: `${baseUrl}/bank/${bank.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...bankRoutes];
}
