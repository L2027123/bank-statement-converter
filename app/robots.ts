import type { MetadataRoute } from "next";

/**
 * 生成 robots.txt
 * 允许所有爬虫抓取，并指向 sitemap.xml
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://bank-statement-converter-lemon.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
