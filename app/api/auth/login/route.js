import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  login,
} from "@/services/authService";

export async function POST(request) {
  try {
    const body = await request.json();

    const result = await login(body);

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status },
      );
    }

    const response = NextResponse.json({
      message: "Success",
      data: {
        user: result.user,
        redirectTo: result.redirectTo,
      },
      user: result.user,
      redirectTo: result.redirectTo,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      result.token,
      getSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
