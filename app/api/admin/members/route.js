import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/services/authService";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/members
 * Get all members with their roles and divisions
 */
// app/api/admin/members/route.js

export async function GET(request) {
  const authorization = await authorizeAdmin(request);

  if (!authorization.ok) {
    return NextResponse.json(
      {
        message: authorization.message,
      },
      {
        status: authorization.status,
      },
    );
  }

  // User pada titik ini sudah dipastikan sebagai admin.
  const members = await prisma.member.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return NextResponse.json({
    message: "Success",
    data: members,
  });
}
