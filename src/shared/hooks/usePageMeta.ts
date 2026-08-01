import { useEffect } from "react";

export interface PageMetaInput {
  title: string;
  description?: string;
  image?: string | null;
  url?: string;
}

const DEFAULT_TITLE = "UniClub — Kampüsün Kalbi";
const DEFAULT_DESCRIPTION =
  "UniClub — üniversite kulüplerini keşfet, etkinliklere katıl, topluluğunu bul.";

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`${selector}[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * SPA meta güncellemesi — tarayıcı sekmesi + Open Graph / Twitter kartları.
 * Sosyal botlar JS çalıştırmaz; bu yüzden paylaşım önizlemesi sınırlıdır (raporda).
 */
export function usePageMeta({ title, description, image, url }: PageMetaInput) {
  useEffect(() => {
    const desc = description ?? DEFAULT_DESCRIPTION;
    const pageUrl = url ?? window.location.href;
    const imageUrl = image?.startsWith("http")
      ? image
      : image
        ? `${window.location.origin}${image.startsWith("/") ? image : `/${image}`}`
        : `${window.location.origin}/favicon.svg`;

    document.title = title;
    upsertMeta("meta", "name", "description", desc);
    upsertMeta("meta", "property", "og:title", title);
    upsertMeta("meta", "property", "og:description", desc);
    upsertMeta("meta", "property", "og:type", "website");
    upsertMeta("meta", "property", "og:url", pageUrl);
    upsertMeta("meta", "property", "og:image", imageUrl);
    upsertMeta("meta", "property", "og:site_name", "UniClub");
    upsertMeta("meta", "name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("meta", "name", "twitter:title", title);
    upsertMeta("meta", "name", "twitter:description", desc);
    if (image) upsertMeta("meta", "name", "twitter:image", imageUrl);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta("meta", "name", "description", DEFAULT_DESCRIPTION);
    };
  }, [title, description, image, url]);
}
