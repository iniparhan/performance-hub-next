import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/admin/stats
 * Get dashboard statistics for admin
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (roleId: 1=Super Admin, 2=Admin)
    if (!session.role_id || session.role_id > 2) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const totalMembers = await prisma.member.count();

    const totalEvaluations = await prisma.evaluation.count();

    const submittedEvaluations = await prisma.evaluation.count({
      where: {
        submittedAt: {
          not: null,
        },
      },
    });

    const pendingEvaluations = totalEvaluations - submittedEvaluations;

    return NextResponse.json({
      totalMembers,
      totalEvaluations,
      submittedEvaluations,
      pendingEvaluations,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
