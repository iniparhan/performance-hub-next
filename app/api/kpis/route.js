import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/kpis?evaluatee_id={id}&evaluator_role_id={roleId}
 *
 * Get KPI indicators based on evaluation context
 */
export async function GET(req) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const evaluateeId = parseInt(searchParams.get("evaluatee_id") || "0");
    const evaluatorRoleId = parseInt(
      searchParams.get("evaluator_role_id") || "0",
    );

    if (!evaluateeId) {
      return NextResponse.json(
        { message: "Missing evaluatee_id" },
        { status: 400 },
      );
    }

    // Get evaluatee info
    const evaluatee = await prisma.member.findUnique({
      where: { id: evaluateeId },
    });

    if (!evaluatee || !evaluatee.roleId) {
      return NextResponse.json(
        { message: "Evaluatee not found" },
        { status: 404 },
      );
    }

    const evaluateeRoleId = evaluatee.roleId;

    // Determine if evaluating superior or subordinate
    const isEvaluatingSuperior = evaluatorRoleId < evaluateeRoleId;

    let kpis;

    if (isEvaluatingSuperior) {
      // Only global KPIs
      kpis = await prisma.kpi.findMany({
        where: {
          divisionId: null,
          isActive: true,
        },
        orderBy: { id: "asc" },
        take: 5,
      });
    } else {
      // Parallel queries using Promise.all instead of sequential await
      const [globalKpis, divisionKpis] = await Promise.all([
        prisma.kpi.findMany({
          where: {
            divisionId: null,
            isActive: true,
          },
          orderBy: { id: "asc" },
          take: 5,
        }),
        evaluatee.divisionId !== null
          ? prisma.kpi.findMany({
              where: {
                divisionId: evaluatee.divisionId,
                isActive: true,
              },
              orderBy: { id: "asc" },
            })
          : Promise.resolve([]),
      ]);

      kpis = [...globalKpis, ...divisionKpis];
    }

    return NextResponse.json({ kpis });
  } catch (error) {
    console.error("Error fetching KPIs:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
