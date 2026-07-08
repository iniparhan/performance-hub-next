import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/authService";
import {
  canSubmitEvaluation,
  isSubmitted,
} from "@/services/evaluationService";

export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const evaluationId = parseInt(id);

    const body = await req.json();
    const { scores } = body;

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { message: "Scores array is required" },
        { status: 400 },
      );
    }

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

    const canModify = await canSubmitEvaluation({ user, evaluationId });

    if (!canModify) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (isSubmitted(evaluation)) {
      return NextResponse.json(
        { message: "Submitted evaluation cannot be changed" },
        { status: 409 },
      );
    }

    const invalidScore = scores.some((score) => {
      const value = Number(score.score);
      return (
        !Number.isInteger(value) ||
        value < 0 ||
        !Number.isInteger(Number(score.kpi_id ?? score.kpiId))
      );
    });

    if (invalidScore) {
      return NextResponse.json(
        { message: "Invalid score payload" },
        { status: 400 },
      );
    }

    const missingNotes = scores.some(
      (score) => !String(score.notes || "").trim(),
    );

    if (missingNotes) {
      return NextResponse.json(
        { message: "Notes are required for every score" },
        { status: 400 },
      );
    }

    // Delete existing scores and create new ones
    await prisma.evaluationScore.deleteMany({
      where: { evaluationId },
    });

    // Create new scores
    await prisma.evaluationScore.createMany({
      data: scores.map((s) => ({
        evaluationId,
        kpiId: Number(s.kpi_id ?? s.kpiId),
        score: Number(s.score),
        notes: String(s.notes).trim(),
      })),
    });

    return NextResponse.json({
      message: "Scores saved successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error saving scores:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
