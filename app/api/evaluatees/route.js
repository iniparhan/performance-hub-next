import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/authService";
import { getEvaluateesForUser } from "@/services/evaluationService";

/**
 * GET /api/evaluatees
 *
 * Returns list of users that the evaluator needs to evaluate
 * based on evaluation_policies (no hardcoding)
 */
export async function GET(req) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const evaluatees = await getEvaluateesForUser(user);

    return NextResponse.json({
      message: "Success",
      data: {
        evaluatees,
      },
    });
  } catch (error) {
    console.error("Error fetching evaluatees:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
