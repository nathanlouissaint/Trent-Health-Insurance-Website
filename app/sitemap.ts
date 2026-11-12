import type { MetadataRoute } from "next";
import { getSiteUrlForPath } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/apply", "/services", "/about", "/resources", "/contact", "/book", "/privacy", "/terms"];
  return pages.flatMap((page) => {
    const url = getSiteUrlForPath(page || "/");
    return url ? [{ url, lastModified: new Date() }] : [];
  });
}
