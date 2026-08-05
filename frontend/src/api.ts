function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-type", "application/json");
  }

  if (!SAFE_METHODS.has(method)) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  return fetch(path, {
    ...options,
    method,
    credentials: "same-origin",
    headers,
  });
}
