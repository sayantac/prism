import env from "@/config/env";

/**
 * Resolve a media path returned by the backend to a fully qualified URL.
 * Supports absolute URLs, data URIs, and relative paths served by the backend.
 */
export const resolveMediaUrl = (path?: string | null): string | undefined => {
  if (!path) {
    return undefined;
  }

  const trimmed = path.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `${window.location.protocol}${trimmed}`;
  }

  try {
    const base = env.apiBaseUrl.replace(/\/$/, "");
    const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${base}${normalizedPath}`;
  } catch (error) {
    console.error("Failed to resolve media URL", error);
    return trimmed;
  }
};

export const resolveProductImage = (
  images?: string[] | string | null,
  fallback: string = "/api/placeholder/300/200"
): string => {
  if (Array.isArray(images) && images.length > 0) {
    const resolved = resolveMediaUrl(images[0]);
    if (resolved) {
      return resolved;
    }
  }

  if (typeof images === "string" && images) {
    const parts = images.split("|").map((value) => value.trim()).filter(Boolean);
    for (const part of parts) {
      if (!part.includes("transparent-pixel")) {
        const resolved = resolveMediaUrl(part);
        if (resolved) {
          return resolved;
        }
      }
    }
  }

  return fallback;
};
