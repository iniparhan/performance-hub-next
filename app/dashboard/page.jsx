// app/dashboard/page.jsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppraisalModal from "../../components/AppraisalModal";
import DepartmentTrackerModal from "../../components/DepartmentTrackerModal";
import Dashboard from "../../components/Dashboard";
import QuickActions from "../../components/QuickActions";
import Toast from "../../components/Toast";
import { getCurrentUser } from "../../services/clientAuthService";
import {
  getCompletionStatus,
  getDashboardSummary,
  getEvaluatees,
  getEvaluationDetail,
  getOrCreateEvaluation,
  saveScores,
  submitEvaluation,
} from "../../services/clientEvaluationService";
import {
  getCurrentDepartmentEvaluation,
  submitCurrentDepartmentEvaluation,
} from "../../services/clientDepartmentEvaluationService";

const initialState = {
  currentUser: null,
  activeQuartal: null,
  appraisalTargets: [],
  departmentQuestions: [],
  departmentSubmissionStatus: { isSubmitted: true },
  dashboardSummary: null,
  allUsers: [],
  quarterOptions: [],
};

function getEvaluatorId(user) {
  return user?.id ?? user?.userId ?? user?.evaluatorId ?? undefined;
}

function getPeriodId(activeQuartal) {
  return activeQuartal?.id ?? activeQuartal?.periodId ?? undefined;
}

function mapEvaluateeToTarget(evaluatee) {
  return {
    ...evaluatee,
    targetEmail: evaluatee.email,
    targetName: evaluatee.name,
    evaluateeId: evaluatee.id,
    evaluationId: evaluatee.evaluationId,
    isSubmitted: evaluatee.isSubmitted || false,
    targetRole: evaluatee.roleName || "-",
    targetDepartment: evaluatee.divisionName || "-",
    targetSubDepartment: evaluatee.subDivisionName || "-",
    relationship: evaluatee.evaluationPolicyId
      ? `Policy #${evaluatee.evaluationPolicyId}`
      : "Assigned evaluation",
    divisionScope: evaluatee.divisionScope || "-",
  };
}

function mapKpiToQuestion(kpi, score) {
  return {
    ...kpi,
    id: kpi.id,
    kpiId: kpi.id,
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

function normalizeAnswersToScores(answers, questions = []) {
  if (!answers) return [];

  if (Array.isArray(answers)) {
    return answers
      .map((item) => ({
        kpiId: item.kpiId ?? item.kpi_id ?? item.questionId ?? item.id,
        score: item.score ?? item.value ?? item.answer,
        notes: item.notes ?? item.comment ?? null,
      }))
      .filter(
        (item) => item.kpiId && item.score !== undefined && item.score !== "",
      );
  }

  if (Array.isArray(answers.scores)) {
    return normalizeAnswersToScores(answers.scores, questions);
  }

  return questions
    .map((question) => {
      const key = question.kpiId ?? question.questionId ?? question.id;
      const value = answers[key];

      if (value && typeof value === "object") {
        return {
          kpiId: value.kpiId ?? value.kpi_id ?? key,
          score: value.score ?? value.value ?? value.answer,
          notes: value.notes ?? value.comment ?? null,
        };
      }

      return {
        kpiId: key,
        score: value,
        notes: null,
      };
    })
    .filter(
      (item) => item.kpiId && item.score !== undefined && item.score !== "",
    );
}

export default function PerformanceHubPage() {
  const [appState, setAppState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedTargetQuestions, setSelectedTargetQuestions] = useState([]);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    showToast("Loading data...");

    try {
      const currentUser = appState.currentUser || (await getCurrentUser());

      if (!currentUser) {
        setAppState((current) => ({
          ...current,
          currentUser: null,
          appraisalTargets: [],
          dashboardSummary: {
            ...(current.dashboardSummary || {}),
            totalEvaluatees: 0,
            completed: 0,
            pending: 0,
            isAllComplete: false,
            openQuarter: false,
          },
        }));
        setToast("Silakan login terlebih dahulu.");
        return;
      }

      const evaluatorId = getEvaluatorId(currentUser);

      const [evaluatees, completionStatus, dashboard] = await Promise.all([
        getEvaluatees(evaluatorId),
        getCompletionStatus(evaluatorId),
        getDashboardSummary(),
      ]);

      setAppState((current) => ({
        ...current,
        currentUser,
        activeQuartal: dashboard.activePeriod || null,
        quarterOptions: dashboard.quarterOptions || [],
        appraisalTargets: evaluatees.map(mapEvaluateeToTarget),
        dashboardSummary: {
          ...(current.dashboardSummary || {}),
          totalEvaluatees: completionStatus.totalEvaluatees,
          completed: completionStatus.completed,
          pending: completionStatus.pending,
          isAllComplete: completionStatus.isAllComplete,
          openQuarter: dashboard.activePeriod?.quartal || false,
          performanceByQuarter: dashboard.performanceByQuarter || [],
          feedbackNotes: dashboard.feedbackNotes || [],
        },
        departmentQuestions: [],
        departmentSubmissionStatus: { isSubmitted: true },
      }));

      setToast("");
    } catch (error) {
      showToast(error.message || "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [appState.currentUser, showToast]);

  useEffect(() => {
    // Data fetching is the external synchronization this page performs on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const openAppraisalPanel = () => {
    setSelectedTarget(null);
    setSelectedTargetQuestions([]);
    setActiveModal("appraisal");
  };

  const openDepartmentPanel = async () => {
    setSelectedTarget(null);
    setActiveModal("department-tracker");
    setIsQuestionLoading(true);
    showToast("Loading department questions...");

    try {
      const currentUser = appState.currentUser || (await getCurrentUser());
      const evaluatorId = getEvaluatorId(currentUser);

      if (!evaluatorId) {
        throw new Error("User tidak valid.");
      }

      const departmentEvaluation =
        await getCurrentDepartmentEvaluation(evaluatorId);

      setAppState((current) => ({
        ...current,
        currentUser,
        departmentQuestions: departmentEvaluation.questions || [],
        departmentSubmissionStatus: {
          isSubmitted: departmentEvaluation.isSubmitted,
          evaluation: departmentEvaluation.evaluation,
          period: departmentEvaluation.period,
          department: departmentEvaluation.department,
        },
      }));

      setToast("");
    } catch (error) {
      showToast(error.message || "Failed to load department evaluation.");
    } finally {
      setIsQuestionLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleSelectTarget = async (targetEmail) => {
    setIsQuestionLoading(true);
    showToast("Loading questions...");

    try {
      const target = appState.appraisalTargets.find(
        (item) =>
          item.targetEmail === targetEmail || item.email === targetEmail,
      );

      if (!target) {
        throw new Error("Evaluatee tidak ditemukan.");
      }

      const evaluateeId = target.evaluateeId ?? target.id;
      const periodId = getPeriodId(appState.activeQuartal);

      const evaluation = target.evaluationId
        ? { id: target.evaluationId }
        : await getOrCreateEvaluation(evaluateeId, periodId);

      const detail = await getEvaluationDetail(evaluation.id, evaluateeId);

      const scoresByKpiId = new Map(
        (detail.scores || []).map((score) => [String(score.kpiId), score]),
      );

      const questions = (detail.kpis || []).map((kpi) =>
        mapKpiToQuestion(kpi, scoresByKpiId.get(String(kpi.id))),
      );

      setSelectedTarget({
        ...target,
        evaluateeId,
        evaluationId: detail.evaluation?.id ?? evaluation.id,
      });
      setSelectedTargetQuestions(questions);
      setToast("");
    } catch (error) {
      showToast(error.message || "Failed to load appraisal questions.");
    } finally {
      setIsQuestionLoading(false);
    }
  };

  const handleSubmitAppraisal = async (answers) => {
    if (!selectedTarget?.evaluationId) {
      showToast("Evaluation belum dipilih.");
      return;
    }

    const scores = normalizeAnswersToScores(answers, selectedTargetQuestions);

    if (!scores.length) {
      showToast("Tidak ada score yang bisa disimpan.");
      return;
    }

    setIsSubmitting(true);

    try {
      await saveScores(selectedTarget.evaluationId, scores);
      await submitEvaluation(selectedTarget.evaluationId);

      showToast("Evaluation submitted.");
      setSelectedTarget(null);
      setSelectedTargetQuestions([]);
      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to submit appraisal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDepartmentEvaluation = async (answers) => {
    const evaluatorId = getEvaluatorId(appState.currentUser);

    if (!evaluatorId) {
      showToast("User tidak valid.");
      return;
    }

    const scores = normalizeAnswersToScores(
      answers,
      appState.departmentQuestions,
    ).map((item) => ({
      departKpiId: item.kpiId,
      score: item.score,
      notes: item.notes,
    }));

    if (!scores.length) {
      showToast("Tidak ada score yang bisa disimpan.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitCurrentDepartmentEvaluation(evaluatorId, scores);

      showToast("Department evaluation submitted.");
      setActiveModal(null);

      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to submit department evaluation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const user = appState.currentUser;
  const activeQuartal = appState.activeQuartal?.quartal || null;
  const summary = appState.dashboardSummary || {};

  const pendingStatus = useMemo(() => {
    const pendingAppraisals =
      summary.pending ??
      appState.appraisalTargets.filter((target) => !target.isSubmitted).length;

    if (pendingAppraisals > 0) {
      return {
        title: "Kamu belum menyelesaikan evaluasi",
        text: `Ada ${pendingAppraisals} evaluation yang perlu diisi.`,
      };
    }

    return {
      title: "Semua evaluasi sudah selesai",
      text: "Thank you. You have completed your evaluation for this active quarter.",
    };
  }, [appState.appraisalTargets, summary.pending]);

  return (
    <>
      {/* Topbar dan validasi session dipindahkan ke app/dashboard/layout.jsx. */}
      <main className="page">
        <section className="hero">
          <p className="eyebrow">Performance Hub</p>
          <h1>Performance Hub</h1>
          <p>
            {user
              ? `Welcome back, ${user.name}.`
              : "Let's give your performance review."}
          </p>
        </section>

        <QuickActions
          openQuarter={summary.openQuarter}
          onOpenAppraisal={openAppraisalPanel}
          onOpenDepartment={openDepartmentPanel}
        />

        <Dashboard
          activeQuartal={activeQuartal}
          dashboardSummary={summary}
          isLoading={isLoading}
          pendingStatus={pendingStatus}
          quarterOptions={appState.quarterOptions}
          user={user}
          onOpenAppraisal={openAppraisalPanel}
        />
      </main>

      <AppraisalModal
        isOpen={activeModal === "appraisal"}
        isLoading={isQuestionLoading}
        isSubmitting={isSubmitting}
        questions={selectedTargetQuestions}
        selectedTarget={selectedTarget}
        targets={appState.appraisalTargets}
        onBack={() => {
          setSelectedTarget(null);
          setSelectedTargetQuestions([]);
        }}
        onClose={closeModal}
        onSelectTarget={handleSelectTarget}
        onSubmit={handleSubmitAppraisal}
        onValidationError={showToast}
      />

      <DepartmentTrackerModal
        isOpen={activeModal === "department-tracker"}
        isLoading={isQuestionLoading}
        isSubmitting={isSubmitting}
        questions={appState.departmentQuestions}
        currentUser={user}
        departmentSubmissionStatus={appState.departmentSubmissionStatus}
        onClose={closeModal}
        onSubmit={handleSubmitDepartmentEvaluation}
        onValidationError={showToast}
      />

      <Toast message={toast} onHide={() => setToast("")} />
    </>
  );
}
