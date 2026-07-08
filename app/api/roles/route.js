import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/roles
 * Get all roles
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
