import prisma from "@/lib/prisma";

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toInt(value, fieldName) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new ApiError(`${fieldName} tidak valid.`, 400);
  }

  return numberValue;
}

function mapDepartKpiToQuestion(kpi, score) {
  return {
    ...kpi,
    id: kpi.id,
    kpiId: kpi.id,
    departKpiId: kpi.id,
    questionId: kpi.id,

    title: kpi.indicatorName,
    question: kpi.indicatorName,
    text: kpi.indicatorName,

    description: kpi.definition || kpi.explanation || "",
    definition: kpi.definition || "",
    explanation: kpi.explanation || "",

    score: score?.score ?? "",
    notes: score?.notes ?? "",
  };
}

async function getActivePeriod(tx = prisma) {
  const period = await tx.evaluationPeriod.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!period) {
    throw new ApiError("Tidak ada evaluation period yang aktif.", 404);
  }

  return period;
}

async function getEvaluatorWithDivision(evaluatorId, tx = prisma) {
  const evaluator = await tx.member.findUnique({
    where: {
      id: evaluatorId,
    },
    include: {
      division: true,
    },
  });

  if (!evaluator) {
    throw new ApiError("Evaluator tidak ditemukan.", 404);
  }

  if (!evaluator.divisionId) {
    throw new ApiError("Evaluator belum memiliki department/division.", 400);
  }

  return evaluator;
}

function normalizeDepartmentScores(scores) {
  if (!Array.isArray(scores) || !scores.length) {
    throw new ApiError("Score department tidak boleh kosong.", 400);
  }

  return scores.map((item) => {
    const departKpiId = toInt(
      item.departKpiId ?? item.kpiId ?? item.questionId ?? item.id,
      "departKpiId",
    );

    const score = Number(item.score);

    if (!Number.isInteger(score)) {
      throw new ApiError("Score harus berupa angka.", 400);
    }

    return {
      departKpiId,
      score,
      notes: item.notes ?? null,
    };
  });
}

export async function getCurrentDepartmentEvaluation(evaluatorIdValue) {
  const evaluatorId = toInt(evaluatorIdValue, "evaluatorId");

  const evaluator = await getEvaluatorWithDivision(evaluatorId);
  const period = await getActivePeriod();

  const evaluation = await prisma.departEvaluation.findFirst({
    where: {
      evaluatorId,
      periodId: period.id,
      divisionId: evaluator.divisionId,
    },
    include: {
      scores: true,
      division: true,
      period: true,
    },
  });

  const kpis = await prisma.departKpi.findMany({
    orderBy: {
      id: "asc",
    },
  });

  const scoresByKpiId = new Map(
    (evaluation?.scores || []).map((score) => [
      String(score.departKpiId),
      score,
    ]),
  );

  const questions = kpis.map((kpi) =>
    mapDepartKpiToQuestion(kpi, scoresByKpiId.get(String(kpi.id))),
  );

  return {
    evaluation: evaluation
      ? {
          id: evaluation.id,
          evaluatorId: evaluation.evaluatorId,
          periodId: evaluation.periodId,
          divisionId: evaluation.divisionId,
          submittedAt: evaluation.submittedAt,
        }
      : null,
    period: {
      id: period.id,
      name: period.name,
      quartal: period.quartal,
    },
    department: {
      id: evaluator.divisionId,
      name: evaluator.division?.name ?? null,
    },
    isSubmitted: Boolean(evaluation?.submittedAt),
    questions,
  };
}

export async function submitCurrentDepartmentEvaluation(
  evaluatorIdValue,
  scoresValue,
) {
  const evaluatorId = toInt(evaluatorIdValue, "evaluatorId");
  const normalizedScores = normalizeDepartmentScores(scoresValue);

  return prisma.$transaction(async (tx) => {
    const evaluator = await getEvaluatorWithDivision(evaluatorId, tx);
    const period = await getActivePeriod(tx);

    let evaluation = await tx.departEvaluation.findFirst({
      where: {
        evaluatorId,
        periodId: period.id,
        divisionId: evaluator.divisionId,
      },
      include: {
        scores: true,
      },
    });

    if (evaluation?.submittedAt) {
      throw new ApiError(
        "Department evaluation sudah disubmit dan tidak bisa diubah lagi.",
        409,
      );
    }

    if (!evaluation) {
      evaluation = await tx.departEvaluation.create({
        data: {
          evaluatorId,
          periodId: period.id,
          divisionId: evaluator.divisionId,
        },
        include: {
          scores: true,
        },
      });
    }

    const kpiIds = normalizedScores.map((item) => item.departKpiId);

    const validKpis = await tx.departKpi.findMany({
      where: {
        id: {
          in: kpiIds,
        },
      },
      select: {
        id: true,
      },
    });

    const validKpiIds = new Set(validKpis.map((kpi) => kpi.id));

    const hasInvalidKpi = normalizedScores.some(
      (item) => !validKpiIds.has(item.departKpiId),
    );

    if (hasInvalidKpi) {
      throw new ApiError("Ada indikator department yang tidak valid.", 400);
    }

    await tx.departScore.deleteMany({
      where: {
        departEvaluationId: evaluation.id,
      },
    });

    await tx.departScore.createMany({
      data: normalizedScores.map((item) => ({
        departEvaluationId: evaluation.id,
        departKpiId: item.departKpiId,
        score: item.score,
        notes: item.notes,
        createdAt: new Date(),
      })),
    });

    const submittedEvaluation = await tx.departEvaluation.update({
      where: {
        id: evaluation.id,
      },
      data: {
        submittedAt: new Date(),
      },
      include: {
        scores: true,
        division: true,
        period: true,
      },
    });

    return {
      evaluation: {
        id: submittedEvaluation.id,
        evaluatorId: submittedEvaluation.evaluatorId,
        periodId: submittedEvaluation.periodId,
        divisionId: submittedEvaluation.divisionId,
        submittedAt: submittedEvaluation.submittedAt,
      },
      isSubmitted: true,
      scores: submittedEvaluation.scores,
    };
  });
}
