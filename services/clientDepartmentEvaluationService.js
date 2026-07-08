async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request gagal.");
  }

  return data;
}

export async function getCurrentDepartmentEvaluation(evaluatorId) {
  const params = new URLSearchParams({
    evaluatorId: String(evaluatorId),
  });

  const response = await fetch(
    `/api/department-evaluations/current?${params.toString()}`,
    {
      method: "GET",
    },
  );

  return parseJsonResponse(response);
}

export async function submitCurrentDepartmentEvaluation(evaluatorId, scores) {
  const response = await fetch("/api/department-evaluations/current/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      evaluatorId,
      scores,
    }),
  });

  return parseJsonResponse(response);
}
