import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/authService";
import {
  getActivePeriod,
  getEvaluateesForUser,
} from "@/services/evaluationService";

/**
 * GET /api/evaluations/status?evaluator_id={id}
 *
 * Get completion status for all evaluatees
 */
export async function GET(req) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const evaluatees = await getEvaluateesForUser(user);
    const totalEvaluatees = evaluatees.length;

    // Get active period
    const activePeriod = await getActivePeriod();

    // Count submitted evaluations
    const submittedCount = await prisma.evaluation.count({
      where: {
        evaluatorId: user.id,
        evaluateeId: { in: evaluatees.map((evaluatee) => evaluatee.id) },
        periodId: activePeriod?.id || undefined,
        submittedAt: { not: null },
      },
    });

    const pending = totalEvaluatees - submittedCount;

    return NextResponse.json({
      message: "Success",
      data: {
        total_evaluatees: totalEvaluatees,
        completed: submittedCount,
        pending,
        is_all_complete: pending === 0 && totalEvaluatees > 0,
      },
      total_evaluatees: totalEvaluatees,
      completed: submittedCount,
      pending,
      is_all_complete: pending === 0 && totalEvaluatees > 0,
    });
  } catch (error) {
    console.error("Error fetching status:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
