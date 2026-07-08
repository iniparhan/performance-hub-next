const DRAFT_PREFIX = "sxc-evaluation-draft";

export function getEvaluationDraftKey(formType, evaluateeId, evaluationId) {
  return `${DRAFT_PREFIX}:${formType}:${evaluateeId}:${evaluationId}`;
}

export function getAllEvaluationDrafts() {
  if (typeof window === "undefined") return [];

  const drafts = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(`${DRAFT_PREFIX}:`)) continue;

    const parts = key.split(":");
    if (parts.length !== 4) continue;

    const [, formType, rawEvaluateeId, rawEvaluationId] = parts;
    if (formType !== "up_to_bottom" && formType !== "bottom_to_up") continue;

    const evaluateeId = Number.parseInt(rawEvaluateeId, 10);
    const evaluationId = Number.parseInt(rawEvaluationId, 10);

    if (!Number.isInteger(evaluateeId) || !Number.isInteger(evaluationId)) {
      continue;
    }

    const draft = readEvaluationDraft(key);
    if (!draft) continue;

    drafts.push({
      formType,
      evaluateeId,
      evaluationId,
      draft,
    });
  }

  return drafts;
}

export function readEvaluationDraft(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.updatedAt !== "number") return null;

    return {
      scores: parsed.scores || {},
      feedback: parsed.feedback || "",
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeEvaluationDraft(key, value) {
  if (typeof window === "undefined") return;

  const payload = {
    ...value,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function clearEvaluationDraft(key) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(key);
}
