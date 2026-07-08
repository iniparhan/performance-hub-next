/**
 * Evaluation service
 * JavaScript version
 *
 * Catatan:
 * - Request ke API tetap memakai snake_case agar kompatibel dengan kode API lama.
 * - Data response dinormalisasi ke camelCase agar lebih cocok dengan Prisma model.
 */

async function handleResponse(res) {
  const text = await res.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const errorDetails = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      data,
    };

    console.error("API ERROR:", JSON.stringify(errorDetails, null, 2));

    throw new Error(
      data?.message ||
        data?.error ||
        `${res.status} ${res.statusText} from ${res.url}`,
    );
  }

  return data;
}

function normalizeEvaluatee(item) {
  if (!item) return null;

  return {
    id: item.id,
    name: item.name,
    email: item.email,

    roleId: item.roleId ?? item.role_id ?? null,
    roleName: item.roleName ?? item.role_name ?? item.role?.name ?? null,

    divisionId: item.divisionId ?? item.division_id ?? null,
    divisionName:
      item.divisionName ?? item.division_name ?? item.division?.name ?? null,

    subDivisionId: item.subDivisionId ?? item.sub_division_id ?? null,
    subDivisionName:
      item.subDivisionName ??
      item.sub_division_name ??
      item.subDivision?.name ??
      null,

    evaluationId: item.evaluationId ?? item.evaluation_id ?? null,
    isSubmitted: item.isSubmitted ?? item.is_submitted ?? false,
    evaluationPolicyId:
      item.evaluationPolicyId ?? item.evaluation_policy_id ?? null,
    divisionScope: item.divisionScope ?? item.division_scope ?? null,
  };
}

function normalizeEvaluation(item) {
  if (!item) return null;

  return {
    id: item.id,
    evaluatorId: item.evaluatorId ?? item.evaluator_id,
    evaluateeId: item.evaluateeId ?? item.evaluatee_id,
    periodId: item.periodId ?? item.period_id ?? null,
    submittedAt: item.submittedAt ?? item.submitted_at ?? null,
    createdAt: item.createdAt ?? item.created_at ?? null,
  };
}

function normalizeKpi(item) {
  if (!item) return null;

  return {
    id: item.id,
    indicatorName:
      item.indicatorName ??
      item.indicator_name ??
      item.indicator ??
      item.name ??
      null,

    definition: item.definition ?? null,
    explanation: item.explanation ?? null,
    type: item.type ?? null,

    divisionId: item.divisionId ?? item.division_id ?? null,
    weight: item.weight ?? null,
    maxScore: item.maxScore ?? item.max_score ?? null,

    version: item.version ?? null,
    isActive: item.isActive ?? item.is_active ?? null,
    createdAt: item.createdAt ?? item.created_at ?? null,
    updatedAt: item.updatedAt ?? item.updated_at ?? null,
  };
}

function normalizeScore(item) {
  if (!item) return null;

  return {
    id: item.id,
    evaluationId: item.evaluationId ?? item.evaluation_id,
    kpiId: item.kpiId ?? item.kpi_id,
    score: item.score,
    notes: item.notes ?? null,
    createdAt: item.createdAt ?? item.created_at ?? null,
    updatedAt: item.updatedAt ?? item.updated_at ?? null,
    kpi: item.kpi ? normalizeKpi(item.kpi) : null,
  };
}

/**
 * Get list of evaluatees for the current evaluator
 */
export async function getEvaluatees(evaluatorId) {
  const res = await fetch(`/api/evaluatees?evaluator_id=${evaluatorId}`, {
    credentials: "include",
  });

  const data = await handleResponse(res);

  return (data?.data?.evaluatees || data.evaluatees || []).map(
    normalizeEvaluatee,
  );
}

/**
 * Get or create an evaluation record
 */
export async function getOrCreateEvaluation(evaluateeId, periodId) {
  const body = {
    evaluatee_id: evaluateeId,
  };

  if (periodId !== undefined && periodId !== null) {
    body.period_id = periodId;
  }

  const res = await fetch("/api/evaluations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await handleResponse(res);

  return normalizeEvaluation(data?.data?.evaluation || data.evaluation);
}

/**
 * Get evaluation detail with scores and KPIs
 */
export async function getEvaluationDetail(evaluationId, evaluateeId) {
  const res = await fetch(
    `/api/evaluations/${evaluationId}?evaluatee_id=${evaluateeId}`,
    {
      credentials: "include",
    },
  );

  const data = await handleResponse(res);

  return {
    evaluation: normalizeEvaluation(data?.data?.evaluation || data.evaluation),
    scores: (data?.data?.scores || data.scores || []).map(normalizeScore),
    kpis: (data?.data?.kpis || data.kpis || []).map(normalizeKpi),
  };
}

/**
 * Save/update evaluation scores
 */
export async function saveScores(evaluationId, scores) {
  const normalizedScores = scores.map((item) => ({
    kpi_id: item.kpiId ?? item.kpi_id,
    score: item.score,
    notes: item.notes || null,
  }));

  const res = await fetch(`/api/evaluations/${evaluationId}/scores`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      scores: normalizedScores,
    }),
  });

  await handleResponse(res);
}

/**
 * Submit evaluation
 */
export async function submitEvaluation(evaluationId) {
  const res = await fetch(`/api/evaluations/${evaluationId}/submit`, {
    method: "POST",
    credentials: "include",
  });

  await handleResponse(res);
}

/**
 * Check completion status for all evaluatees
 */
export async function getCompletionStatus(evaluatorId) {
  const res = await fetch(
    `/api/evaluations/status?evaluator_id=${evaluatorId}`,
    {
      credentials: "include",
    },
  );

  const data = await handleResponse(res);

  return {
    totalEvaluatees:
      data?.data?.totalEvaluatees ??
      data?.data?.total_evaluatees ??
      data.totalEvaluatees ??
      data.total_evaluatees ??
      0,
    completed: data?.data?.completed ?? data.completed ?? 0,
    pending: data?.data?.pending ?? data.pending ?? 0,
    isAllComplete:
      data?.data?.isAllComplete ??
      data?.data?.is_all_complete ??
      data.isAllComplete ??
      data.is_all_complete ??
      false,
  };
}

export async function getDashboardSummary() {
  const res = await fetch("/api/dashboard", { credentials: "include" });
  const response = await handleResponse(res);
  return response?.data || {};
}
