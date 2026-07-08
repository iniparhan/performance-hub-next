import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/authService";
import {
  canSubmitEvaluation,
  isSubmitted,
} from "@/services/evaluationService";

export async function POST(req, { params }) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const evaluationId = parseInt(id);

    // Verify evaluation exists and belongs to this user
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json(
        { message: "Evaluation not found" },
        { status: 404 },
      );
    }

    const canSubmit = await canSubmitEvaluation({ user, evaluationId });

    if (!canSubmit) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (isSubmitted(evaluation)) {
      return NextResponse.json(
        { message: "Evaluation already submitted" },
        { status: 409 },
      );
    }

    const scoreCount = await prisma.evaluationScore.count({
      where: { evaluationId },
    });

    if (scoreCount === 0) {
      return NextResponse.json(
        { message: "Evaluation must have scores before submit" },
        { status: 400 },
      );
    }

    // Set submitted_at to current timestamp
    const updated = await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Evaluation submitted successfully",
      data: { evaluation: updated },
      evaluation: updated,
    });
  } catch (error) {
    console.error("Error submitting evaluation:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
