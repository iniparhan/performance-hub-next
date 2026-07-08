import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/authService";
import {
  canAccessEvaluation,
  canEvaluate,
  getActivePeriod,
  getEvaluationPolicyForPair,
} from "@/services/evaluationService";

/**
 * POST /api/evaluations
 * Get or create an evaluation record for the current session user.
 *
 * Body: { evaluatee_id, period_id? }
 */
export async function POST(req) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const evaluatee_id = body.evaluatee_id;
    const period_id = body.period_id;

    if (!evaluatee_id) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const evaluatee = await prisma.member.findUnique({
      where: { id: evaluatee_id },
    });

    if (!evaluatee || !evaluatee.roleId) {
      return NextResponse.json(
        { message: "Evaluatee not found or has invalid role" },
        { status: 404 },
      );
    }

    const isAuthorized = await canEvaluate({
      evaluatorId: user.id,
      evaluateeId: evaluatee_id,
      user,
    });

    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Unauthorized to evaluate this user" },
        { status: 403 },
      );
    }

    // Get active period if not provided
    const periodId = period_id || (await getActivePeriod())?.id;

    // Try to find existing evaluation
    let evaluation = await prisma.evaluation.findFirst({
      where: {
        evaluatorId: user.id,
        evaluateeId: evaluatee_id,
        periodId: periodId || null,
      },
    });

    // Return if exists
    if (evaluation) {
      return NextResponse.json({
        message: "Success",
        data: { evaluation },
        evaluation,
      });
    }

    // Create with upsert to handle race conditions
    try {
      evaluation = await prisma.evaluation.create({
        data: {
          evaluatorId: user.id,
          evaluateeId: evaluatee_id,
          periodId: periodId || undefined,
        },
      });
    } catch (error) {
      // If unique constraint violation, fetch the existing record
      if (error.code === "P2002") {
        evaluation = await prisma.evaluation.findFirst({
          where: {
            evaluatorId: user.id,
            evaluateeId: evaluatee_id,
            periodId: periodId || null,
          },
        });

        if (!evaluation) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    return NextResponse.json(
      {
        message: "Success",
        data: { evaluation },
        evaluation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating evaluation:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/evaluations?id={evaluationId}&evaluatee_id={evaluateeId}
 *
 * Get evaluation detail with scores and KPIs
 */
export async function GET(req) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const evaluationId = parseInt(searchParams.get("id") || "0");
    const evaluateeId = parseInt(searchParams.get("evaluatee_id") || "0");

    if (!evaluationId) {
      const page = Math.max(Number(searchParams.get("page") || 1), 1);
      const limit = Math.min(
        Math.max(Number(searchParams.get("limit") || 10), 1),
        50,
      );
      const skip = (page - 1) * limit;

      const where = {
        OR: [{ evaluatorId: user.id }, { evaluateeId: user.id }],
      };

      const [evaluations, total] = await Promise.all([
        prisma.evaluation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            evaluatorId: true,
            evaluateeId: true,
            periodId: true,
            submittedAt: true,
            createdAt: true,
            evaluator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            evaluatee: {
              select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                divisionId: true,
                subDivisionId: true,
              },
            },
            _count: {
              select: {
                scores: true,
              },
            },
          },
        }),
        prisma.evaluation.count({ where }),
      ]);

      return NextResponse.json({
        message: "Success",
        data: {
          evaluations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    }

    const hasAccess = await canAccessEvaluation({ user, evaluationId });

    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get evaluation
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        scores: {
          include: {
            evaluation: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { message: "Evaluation not found" },
        { status: 404 },
      );
    }

    if (evaluateeId && evaluateeId !== evaluation.evaluateeId) {
      return NextResponse.json(
        { message: "Invalid evaluatee_id for this evaluation" },
        { status: 400 },
      );
    }

    // Get evaluatee info to determine KPIs
    const evaluatee = await prisma.member.findUnique({
      where: { id: evaluation.evaluateeId },
    });

    if (!evaluatee) {
      return NextResponse.json(
        { message: "Evaluatee not found" },
        { status: 404 },
      );
    }

    const evaluator = await prisma.member.findUnique({
      where: { id: evaluation.evaluatorId },
    });
    const evaluatorRoleId = evaluator?.roleId;
    const evaluateeRoleId = evaluatee.roleId;

    if (!evaluatorRoleId || !evaluateeRoleId) {
      return NextResponse.json(
        { message: "Invalid role configuration" },
        { status: 400 },
      );
    }

    const policy = await getEvaluationPolicyForPair(
      evaluation.evaluatorId,
      evaluation.evaluateeId,
    );

    if (!policy) {
      return NextResponse.json(
        { message: "No active evaluation policy for this evaluator pair" },
        { status: 403 },
      );
    }

    const isUpwardPolicy = policy.evaluatorRoleId > policy.evaluateeRoleId;
    const kpis = await prisma.kpi.findMany({
      where: {
        type: isUpwardPolicy ? "UPWARD" : "DOWNWARD_GENERAL",
        isActive: true,
        ...(isUpwardPolicy
          ? { divisionId: null }
          : {
              OR: [
                { divisionId: null },
                { divisionId: evaluatee.divisionId || -1 },
              ],
            }),
      },
      orderBy: [{ divisionId: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({
      message: "Success",
      data: {
        evaluation,
        policy,
        scores: evaluation.scores,
        kpis,
      },
      evaluation,
      scores: evaluation.scores,
      kpis,
    });
  } catch (error) {
    console.error("Error fetching evaluation:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
