import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeAdmin } from "@/services/authService";

const REPORT_TYPES = new Set(["depart", "officer"]);

function serializeDate(value) {
  return value ? value.toISOString() : null;
}

function getReportType(request) {
  const { searchParams } = new URL(request.url);
  const requestedType = searchParams.get("type") || "depart";

  return REPORT_TYPES.has(requestedType) ? requestedType : "depart";
}

async function getDepartReportRows() {
  const evaluations = await prisma.departEvaluation.findMany({
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      submittedAt: true,
      evaluator: {
        select: {
          id: true,
          name: true,
        },
      },
      period: {
        select: {
          id: true,
          quartal: true,
        },
      },
      division: {
        select: {
          id: true,
          name: true,
        },
      },
      scores: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          score: true,
          notes: true,
          departKpi: {
            select: {
              id: true,
              indicatorName: true,
            },
          },
        },
      },
    },
  });

  return evaluations.flatMap((evaluation) =>
    evaluation.scores.map((score) => ({
      id: `depart-${evaluation.id}-${score.id}`,
      evaluation_id: evaluation.id,
      score_id: score.id,
      evaluator: evaluation.evaluator?.name ?? "-",
      evaluator_id: evaluation.evaluator?.id ?? null,
      period: evaluation.period?.quartal ?? "-",
      period_id: evaluation.period?.id ?? null,
      divisions: evaluation.division?.name ?? "-",
      division_id: evaluation.division?.id ?? null,
      depart_kpi: score.departKpi?.indicatorName ?? "-",
      depart_kpi_id: score.departKpi?.id ?? null,
      score: score.score,
      notes: score.notes,
      submitted_at: serializeDate(evaluation.submittedAt),
    })),
  );
}

async function getOfficerReportRows() {
  const evaluations = await prisma.evaluation.findMany({
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      submittedAt: true,
      evaluator: {
        select: {
          id: true,
          name: true,
        },
      },
      evaluatee: {
        select: {
          id: true,
          name: true,
          division: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      period: {
        select: {
          id: true,
          quartal: true,
        },
      },
      scores: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          score: true,
          notes: true,
          kpi: {
            select: {
              id: true,
              indicatorName: true,
            },
          },
        },
      },
    },
  });

  return evaluations.flatMap((evaluation) =>
    evaluation.scores.map((score) => ({
      id: `officer-${evaluation.id}-${score.id}`,
      evaluation_id: evaluation.id,
      score_id: score.id,
      evaluator: evaluation.evaluator?.name ?? "-",
      evaluator_id: evaluation.evaluator?.id ?? null,
      evaluatee: evaluation.evaluatee?.name ?? "-",
      evaluatee_id: evaluation.evaluatee?.id ?? null,
      period: evaluation.period?.quartal ?? "-",
      period_id: evaluation.period?.id ?? null,
      divisions: evaluation.evaluatee?.division?.name ?? "-",
      division_id: evaluation.evaluatee?.division?.id ?? null,
      kpi: score.kpi?.indicatorName ?? "-",
      kpi_id: score.kpi?.id ?? null,
      score: score.score,
      notes: score.notes,
      submitted_at: serializeDate(evaluation.submittedAt),
    })),
  );
}

export async function GET(request) {
  const authorization = await authorizeAdmin(request);

  if (!authorization.ok) {
    return NextResponse.json(
      {
        message: authorization.message,
      },
      {
        status: authorization.status,
      },
    );
  }

  const type = getReportType(request);
  const rows =
    type === "officer" ? await getOfficerReportRows() : await getDepartReportRows();

  return NextResponse.json({
    message: "Success",
    type,
    data: rows,
  });
}

export async function POST(request) {
  const authorization = await authorizeAdmin(request);

  if (!authorization.ok) {
    return NextResponse.json(
      {
        message: authorization.message,
      },
      {
        status: authorization.status,
      },
    );
  }

  const body = await request.json();

  // TODO ADMIN REPORT SERVICE:
  // Jalankan proses report khusus admin di sini.

  return NextResponse.json({
    message: "Report created",
    data: body,
  });
}
