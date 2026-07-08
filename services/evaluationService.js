import { prisma } from "@/lib/prisma";

export const APPRAISAL_POLICY_IDS = [1, 3, 5, 7, 8, 9];

const memberSafeSelect = {
  id: true,
  name: true,
  email: true,
  roleId: true,
  divisionId: true,
  subDivisionId: true,
  role: {
    select: {
      name: true,
    },
  },
  division: {
    select: {
      name: true,
    },
  },
  subDivision: {
    select: {
      name: true,
    },
  },
};

const evaluationLookupSelect = {
  id: true,
  evaluateeId: true,
  submittedAt: true,
};

function normalizeRoleName(roleName) {
  return String(roleName || "")
    .trim()
    .toUpperCase();
}

function isAdminOrHr(user) {
  const roleName = normalizeRoleName(user?.role_name || user?.role?.name);
  return (
    user?.role_id === 1 ||
    user?.role_id === 2 ||
    roleName.includes("ADMIN") ||
    roleName === "HR" ||
    roleName.includes("HUMAN RESOURCE")
  );
}

function toSafeEvaluatee(member, evaluation = null) {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role_id: member.roleId,
    role_name: member.role?.name || null,
    division_id: member.divisionId,
    division_name: member.division?.name || null,
    sub_division_id: member.subDivisionId,
    sub_division_name: member.subDivision?.name || null,
    evaluation_id: evaluation?.id || null,
    is_submitted:
      evaluation?.submittedAt !== null && evaluation?.submittedAt !== undefined,
  };
}

function matchesPolicyScope(policy, evaluator, evaluatee) {
  if (policy.divisionScope === "GLOBAL") return true;

  if (policy.divisionScope === "SAME_DIVISION") {
    return (
      evaluator.divisionId !== null &&
      evaluator.divisionId === evaluatee.divisionId
    );
  }

  if (policy.divisionScope === "SAME_SUBDIVISION") {
    return (
      evaluator.subDivisionId !== null &&
      evaluator.subDivisionId === evaluatee.subDivisionId
    );
  }

  return false;
}

export async function getEvaluationPolicyForPair(evaluatorId, evaluateeId) {
  if (!evaluatorId || !evaluateeId || evaluatorId === evaluateeId) return null;

  const [evaluator, evaluatee] = await Promise.all([
    prisma.member.findUnique({
      where: { id: evaluatorId },
      select: { roleId: true, divisionId: true, subDivisionId: true },
    }),
    prisma.member.findUnique({
      where: { id: evaluateeId },
      select: { roleId: true, divisionId: true, subDivisionId: true },
    }),
  ]);

  if (!evaluator?.roleId || !evaluatee?.roleId) return null;

  const policies = await prisma.evaluationPolicy.findMany({
    where: {
      id: { in: APPRAISAL_POLICY_IDS },
      evaluatorRoleId: evaluator.roleId,
      evaluateeRoleId: evaluatee.roleId,
      isActive: true,
    },
    orderBy: [{ priority: "asc" }, { id: "asc" }],
    select: {
      id: true,
      evaluatorRoleId: true,
      evaluateeRoleId: true,
      divisionScope: true,
      priority: true,
    },
  });

  return (
    policies.find((policy) =>
      matchesPolicyScope(policy, evaluator, evaluatee),
    ) || null
  );
}

export async function getActivePeriod() {
  return prisma.evaluationPeriod.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getEvaluateesForUser(user) {
  if (!user) return [];

  const activePeriod = await getActivePeriod();

  const evaluator = {
    id: user.id,
    roleId: user.role_id,
    divisionId: user.division_id,
    subDivisionId: user.sub_division_id,
  };

  if (!evaluator.roleId) return [];

  const policies = await prisma.evaluationPolicy.findMany({
    where: {
      id: { in: APPRAISAL_POLICY_IDS },
      evaluatorRoleId: evaluator.roleId,
      isActive: true,
    },
    orderBy: [{ priority: "asc" }, { id: "asc" }],
    select: {
      id: true,
      evaluateeRoleId: true,
      divisionScope: true,
      priority: true,
    },
  });

  if (policies.length === 0) return [];

  const whereOrConditions = policies.map((policy) => {
    const condition = {
      roleId: policy.evaluateeRoleId,
    };

    if (policy.divisionScope === "SAME_DIVISION") {
      condition.divisionId = evaluator.divisionId;
    }

    if (policy.divisionScope === "SAME_SUBDIVISION") {
      condition.subDivisionId = evaluator.subDivisionId;
    }

    return condition;
  });

  const members = await prisma.member.findMany({
    where: {
      id: { not: user.id },
      OR: whereOrConditions,
    },
    select: memberSafeSelect,
    orderBy: { name: "asc" },
  });

  if (members.length === 0) return [];

  const allowedMemberIds = new Set();
  const allowedMembers = [];

  for (const member of members) {
    const isAllowed = policies.some((policy) => {
      if (member.roleId !== policy.evaluateeRoleId) return false;

      if (policy.divisionScope === "SAME_DIVISION") {
        return member.divisionId === evaluator.divisionId;
      }

      if (policy.divisionScope === "SAME_SUBDIVISION") {
        return member.subDivisionId === evaluator.subDivisionId;
      }

      return true;
    });

    if (isAllowed && !allowedMemberIds.has(member.id)) {
      allowedMemberIds.add(member.id);
      allowedMembers.push(member);
    }
  }

  if (allowedMembers.length === 0) return [];

  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatorId: user.id,
      evaluateeId: {
        in: [...allowedMemberIds],
      },
      ...(activePeriod?.id ? { periodId: activePeriod.id } : {}),
    },
    select: evaluationLookupSelect,
  });

  const evaluationByEvaluateeId = new Map(
    evaluations.map((evaluation) => [evaluation.evaluateeId, evaluation]),
  );

  return allowedMembers.map((member) => {
    const policy = policies.find(
      (item) =>
        item.evaluateeRoleId === member.roleId &&
        matchesPolicyScope(item, evaluator, member),
    );

    return {
      ...toSafeEvaluatee(member, evaluationByEvaluateeId.get(member.id)),
      evaluation_policy_id: policy?.id || null,
      division_scope: policy?.divisionScope || null,
    };
  });
}

export async function canAccessEvaluation({ user, evaluationId }) {
  if (!user || !evaluationId) return false;
  if (isAdminOrHr(user)) return true;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: {
      evaluatorId: true,
      evaluateeId: true,
    },
  });

  if (!evaluation) return false;

  return (
    evaluation.evaluatorId === user.id || evaluation.evaluateeId === user.id
  );
}

export async function canEvaluate({ evaluatorId, evaluateeId, user }) {
  if (!user || !evaluatorId || !evaluateeId) {
    return false;
  }

  if (evaluatorId !== user.id) return false;

  return Boolean(await getEvaluationPolicyForPair(evaluatorId, evaluateeId));
}

export async function canSubmitEvaluation({ user, evaluationId }) {
  if (!user || !evaluationId) return false;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: { evaluatorId: true, evaluateeId: true },
  });

  if (!evaluation || evaluation.evaluatorId !== user.id) return false;

  return Boolean(
    await getEvaluationPolicyForPair(
      evaluation.evaluatorId,
      evaluation.evaluateeId,
    ),
  );
}

export async function getEvaluationForUser(user, evaluationId) {
  const hasAccess = await canAccessEvaluation({ user, evaluationId });
  if (!hasAccess) return null;

  return prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      evaluator: true,
      evaluatee: true,
      scores: true,
    },
  });
}

export function isSubmitted(evaluation) {
  return (
    evaluation?.submittedAt !== null && evaluation?.submittedAt !== undefined
  );
}
