import { NextResponse } from "next/server";
import {
  ApiError,
  getCurrentDepartmentEvaluation,
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const evaluatorId = searchParams.get("evaluatorId");

    const data = await getCurrentDepartmentEvaluation(evaluatorId);

    return NextResponse.json(data);
  } catch (error) {
    return getErrorResponse(error);
  }
}
