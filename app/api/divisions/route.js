import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/divisions
 * Get all divisions
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const divisions = await prisma.division.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(divisions);
  } catch (error) {
    console.error("Error fetching divisions:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
