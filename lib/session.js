import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySession } from "@/services/authService";

/**
 * Get the current user session from the cookie
 * Returns null if no valid session
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  // Fetch user with role info
  const user = await prisma.member.findUnique({
    where: { id: session.userId },
    include: {
      role: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role_id: user.roleId,
    role_name: user.role?.name || null,
    division_id: user.divisionId,
    sub_division_id: user.subDivisionId,
  };
}

/**
 * Set the session cookie
 */
export async function setSession(userId) {
  const token = `user-${userId}`;
  const cookieStore = await cookies();

  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: "lax",
  });

  return token;
}

/**
 * Destroy the session cookie
 */
export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

/**
 * Get active evaluation period
 */
export async function getActivePeriod() {
  const period = await prisma.evaluationPeriod.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return period;
}
