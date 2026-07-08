import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/authService";

export async function GET(request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Success",
    data: {
      user,
    },
  });
}
