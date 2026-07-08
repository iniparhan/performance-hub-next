import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getExpiredSessionCookieOptions,
  logout,
} from "@/services/authService";

export async function POST() {
  await logout();

  const response = NextResponse.json({
    message: "Logged out successfully",
  });

  response.cookies.set(SESSION_COOKIE_NAME, "", getExpiredSessionCookieOptions());

  return response;
}
