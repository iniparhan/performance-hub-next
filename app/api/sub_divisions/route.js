import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/sub_divisions
 * Get all sub_divisions
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const subDivisions = await prisma.subDivision.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subDivisions);
  } catch (error) {
    console.error("Error fetching sub_divisions:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
