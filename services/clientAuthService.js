// Types removed for JavaScript version

const SESSION_CACHE_KEY = "sxc-user-session-cache";
const SESSION_CACHE_TTL_MS = 30_000;

function readSessionCache() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.expiresAt !== "number") return null;

    if (Date.now() > parsed.expiresAt) {
      window.sessionStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    return null;
  }
}

function writeSessionCache(user) {
  if (typeof window === "undefined") return;

  const payload = {
    user,
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
  };

  window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
}

function clearSessionCache() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_CACHE_KEY);
}

/**
 * Login user with email and password
 * Sets HTTP-only cookie and returns user session
 */
export async function login(credentials) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Login failed" }));
    throw {
      message: error.message || "Login failed",
      status: res.status,
    };
  }

  const data = await res.json();
  const user = data?.data?.user ?? data?.user ?? null;
  writeSessionCache(user);
  return {
    ...data,
    user,
    redirectTo: data?.data?.redirectTo ?? data?.redirectTo ?? "/dashboard",
  };
}

/**
 * Logout user and clear session cookie
 */
export async function logout() {
  clearSessionCache();
  await fetch("/api/auth/logout", { method: "POST" });
}

/**
 * Get current user session
 * Returns null if not authenticated
 */
export async function getCurrentUser(options) {
  const shouldForceRefresh = options?.forceRefresh === true;

  if (!shouldForceRefresh) {
    const cached = readSessionCache();
    if (cached) return cached;
  }

  try {
    const res = await fetch("/api/auth/me", {
      cache: "no-store",
    });

    if (!res.ok) {
      clearSessionCache();
      return null;
    }

    const data = await res.json();
    const user = data?.data?.user ?? data?.user ?? null;

    writeSessionCache(user);
    return user;
  } catch {
    return null;
  }
}
