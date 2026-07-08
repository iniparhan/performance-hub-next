import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "token";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

const TOKEN_VERSION = "v1";

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

export async function getCurrentUser(request) {
  const token = request?.cookies?.get(SESSION_COOKIE_NAME)?.value;
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

export async function login({ email, password }) {
  if (!email || !password) {
    return {
      ok: false,
      status: 400,
      message: "Email and password are required",
    };
  }

  const user = await prisma.member.findUnique({
    where: { email },
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

  return {
    ok: true,
    token: createSessionToken(user.id),
    user: toSafeUser(user),
    redirectTo: "/dashboard",
  };
}

export async function logout() {
  return { ok: true };
}
