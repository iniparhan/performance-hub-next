import { NextResponse } from "next/server";
import {
  ApiError,
  submitCurrentDepartmentEvaluation,
} from "@/services/departmentEvaluationService";

function getErrorResponse(error) {
  const status = error instanceof ApiError ? error.status : 500;

  return NextResponse.json(
    {
      message: error.message || "Terjadi kesalahan pada server.",
    },
    {
      status,
    },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    const data = await submitCurrentDepartmentEvaluation(
      body.evaluatorId,
      body.scores,
    );

    return NextResponse.json(data);
  } catch (error) {
    return getErrorResponse(error);
  }
}
