import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/authService";
import { canAccessEvaluation } from "@/services/evaluationService";
import { unstable_cache } from "next/cache";

/**
 * GET /api/evaluations/[id]?evaluatee_id={evaluateeId}
 *
 * Get evaluation detail with scores and KPIs based on kpi_type enum
 */

// Cache function for evaluation details
const getEvaluationDetailCached = unstable_cache(
  async (evaluationId, evaluateeId) => {
    // Get evaluation with scores in one query
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        scores: true,
        evaluatee: true,
        evaluator: true,
      },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (evaluateeId !== evaluation.evaluateeId) {
      throw new Error("Invalid evaluatee_id for this evaluation");
    }

    const evaluatee = evaluation.evaluatee;
    const evaluatorRoleId = evaluation.evaluator.roleId;
    const evaluateeRoleId = evaluatee.roleId;

    if (!evaluatorRoleId || !evaluateeRoleId) {
      throw new Error("Invalid role configuration");
    }

    // Determine if evaluating superior or subordinate
    const isEvaluatingSuperior = evaluatorRoleId > evaluateeRoleId;

    let kpis;

    if (isEvaluatingSuperior) {
      // UPWARD evaluation: Only UPWARD KPIs
      kpis = await prisma.kpi.findMany({
        where: {
          type: "UPWARD",
          isActive: true,
        },
        orderBy: { id: "asc" },
      });
    } else {
      // DOWNWARD evaluation:
      // DOWNWARD_GENERAL + DOWNWARD_DEPARTMENT if evaluatee has division
      const whereConditions = [{ type: "DOWNWARD_GENERAL" }];

      // Add division-specific KPIs if evaluatee has a division
      if (evaluatee.divisionId) {
        whereConditions.push({
          type: "DOWNWARD_DEPARTMENT",
          divisionId: evaluatee.divisionId,
        });
      }

      kpis = await prisma.kpi.findMany({
        where: {
          isActive: true,
          OR: whereConditions,
        },
        orderBy: [{ type: "asc" }, { id: "asc" }],
      });
    }

    const kpiIds = kpis.map((kpi) => kpi.id);
    const descriptionMap = new Map();

    if (kpiIds.length > 0) {
      try {
        const indicatorRows = await prisma.$queryRaw(
          Prisma.sql`
            SELECT kpi_id, description
            FROM kpis
            WHERE kpi_id IN (${Prisma.join(kpiIds)})
            ORDER BY id ASC
          `,
        );

        for (const row of indicatorRows) {
          const existing = descriptionMap.get(row.kpi_id) || [];
          existing.push(row.description);
          descriptionMap.set(row.kpi_id, existing);
        }
      } catch {
        // `kpi_indicators` may not exist in every deployed DB version.
      }
    }

    const normalizedKpis = kpis.map((kpi) => ({
      id: kpi.id,

      // Keep old keys for existing frontend compatibility
      name: kpi.indicatorName,
      indicator: kpi.definition,

      // New keys that match current DB schema
      indicator_name: kpi.indicatorName,
      definition: kpi.definition,
      type: kpi.type,
      division_id: kpi.divisionId,
      weight: kpi.weight,
      max_score: kpi.maxScore,
      is_active: kpi.isActive,
      descriptions: descriptionMap.get(kpi.id) || [],
    }));

    const globalFeedback =
      evaluation.scores.find((score) => score.notes?.trim())?.notes || null;

    return {
      evaluation,
      scores: evaluation.scores,
      kpis: normalizedKpis,
      global_feedback: globalFeedback,
    };
  },
  ["evaluation-detail"],
  {
    revalidate: 300,
    tags: ["evaluation-detail"],
  },
);

export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const evaluationId = Number.parseInt(id, 10);

    if (!Number.isInteger(evaluationId) || evaluationId <= 0) {
      return NextResponse.json(
        { message: "Invalid evaluation id" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const evaluateeIdFromQuery = Number.parseInt(
      searchParams.get("evaluatee_id") || "",
      10,
    );

    // Get evaluation to validate and get evaluatee_id
    const basicEvaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: {
        evaluateeId: true,
        evaluatorId: true,
      },
    });

    if (!basicEvaluation) {
      return NextResponse.json(
        { message: "Evaluation not found" },
        { status: 404 },
      );
    }

    const hasAccess = await canAccessEvaluation({ user, evaluationId });

    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const evaluateeId =
      Number.isInteger(evaluateeIdFromQuery) && evaluateeIdFromQuery > 0
        ? evaluateeIdFromQuery
        : basicEvaluation.evaluateeId;

    if (evaluateeId !== basicEvaluation.evaluateeId) {
      return NextResponse.json(
        { message: "Invalid evaluatee_id for this evaluation" },
        { status: 400 },
      );
    }

    // Use cached function for the heavy lifting
    const result = await getEvaluationDetailCached(evaluationId, evaluateeId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching evaluation:", error);

    if (error instanceof Error) {
      if (error.message === "Evaluation not found") {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }

      if (error.message === "Unauthorized") {
        return NextResponse.json({ message: error.message }, { status: 401 });
      }

      if (error.message === "Invalid evaluatee_id for this evaluation") {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      if (error.message === "Invalid role configuration") {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
