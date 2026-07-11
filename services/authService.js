import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "token";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

const TOKEN_VERSION = "v1";
const ADMIN_ROLE_NAME = "Admin";
const ADMIN_ROLE_IDS = new Set([1, 2]);

export function isAdminUser(user) {
  const roleName = user?.role_name ?? user?.role?.name ?? "";
  const roleId = Number(user?.role_id ?? user?.roleId);

  return (
    ADMIN_ROLE_IDS.has(roleId) ||
    roleName.trim().toLowerCase() === ADMIN_ROLE_NAME.toLowerCase()
  );
}

function getSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "performance-hub-development-secret"
  );
}

function sign(payload) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

function toSafeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role_id: user.roleId,
    role_name: user.role?.name || null,
    division_id: user.divisionId,
    division_name: user.division?.name || null,
    sub_division_id: user.subDivisionId,
    sub_division_name: user.subDivision?.name || null,
  };
}

function createSessionToken(userId) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${TOKEN_VERSION}.${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export async function authorizeAdmin(request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      ok: false,
      status: 401,
      message: "Authentication required",
      user: null,
    };
  }

  if (!isAdminUser(user)) {
    return {
      ok: false,
      status: 403,
      message: "Admin access required",
      user: null,
    };
  }

  return {
    ok: true,
    status: 200,
    message: "Authorized",
    user,
  };
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    sameSite: "lax",
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    ...getSessionCookieOptions(),
    maxAge: 0,
  };
}

export async function verifySession(token) {
  if (!token || typeof token !== "string") return null;

  const legacyMatch = token.match(/^user-(\d+)$/);
  if (legacyMatch) {
    const legacyUserId = Number.parseInt(legacyMatch[1], 10);
    return Number.isInteger(legacyUserId) ? { userId: legacyUserId } : null;
  }

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return null;

  const [version, rawUserId, rawExpiresAt, signature] = parts;
  const payload = `${version}.${rawUserId}.${rawExpiresAt}`;
  const expectedSignature = sign(payload);

  try {
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const userId = Number.parseInt(rawUserId, 10);
  const expiresAt = Number.parseInt(rawExpiresAt, 10);

  if (!Number.isInteger(userId) || !Number.isInteger(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  return { userId, expiresAt };
}

export async function getCurrentUserFromServerCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return findCurrentUserByToken(token);
}

async function findCurrentUserByToken(token) {
  const session = await verifySession(token);

  if (!session) return null;

  const user = await prisma.member.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
      divisionId: true,
      subDivisionId: true,
      role: {
        select: {
          name: true,
        },
      },
      division: {
        select: {
          name: true,
        },
      },
      subDivision: {
        select: {
          name: true,
        },
      },
    },
  });

  return toSafeUser(user);
}

export async function getCurrentUser(request) {
  const token = request?.cookies?.get(SESSION_COOKIE_NAME)?.value;
  return findCurrentUserByToken(token);
}

export async function login({ email, password }) {
  if (!email || !password) {
    return {
      ok: false,
      status: 400,
      message: "Email and password are required",
    };
  }

  const user = await prisma.member.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      roleId: true,
      divisionId: true,
      subDivisionId: true,
      role: {
        select: {
          name: true,

          // TODO ROLE CONFIGURATION:
          // Tambahkan `code: true` apabila tabel role memiliki kolom code/slug.
        },
      },
      division: {
        select: {
          name: true,
        },
      },
      subDivision: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user || user.password !== password) {
    return {
      ok: false,
      status: 401,
      message: "Invalid credentials",
    };
  }

  const safeUser = toSafeUser(user);

  return {
    ok: true,
    token: createSessionToken(user.id),
    user: safeUser,

    // Redirect ditentukan oleh server berdasarkan role dari database.
    redirectTo: isAdminUser(user) ? "/admin_dashboard" : "/dashboard",
  };
}

export async function logout() {
  return { ok: true };
}
