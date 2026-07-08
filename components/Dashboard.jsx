import FeedbackGrid from "./FeedbackGrid";
import PerformancePanel from "./PerformancePanel";

export default function Dashboard({
  activeQuartal,
  dashboardSummary,
  isLoading,
  pendingStatus,
  quarterOptions,
  user,
  onOpenAppraisal,
}) {
  const subtitle = user
    ? `${user.role} • ${user.department} • ${user.subDepartment}`
    : "Here is your performance overview.";
  const openQuarterText = dashboardSummary.openQuarter
    ? `Current open quarter: Q${dashboardSummary.openQuarter}`
    : "No quarter is currently open.";

  return (
    <section className="dashboard">
      <div className="section-header">
        <div>
          <h2>Your Performance</h2>
          <p>{subtitle}</p>
        </div>
        <span className="badge">
          {isLoading ? "Loading..." : `Active Q${activeQuartal || "-"}`}
        </span>
      </div>

      <div className="dashboard-grid">
        <PerformancePanel
          activeQuartal={activeQuartal}
          performanceByQuarter={dashboardSummary.performanceByQuarter || []}
          quarterOptions={quarterOptions}
        />

        <div className="panel warning-panel">
          <div className="warning-icon">▣</div>
          <h3>{pendingStatus.title}</h3>
          <p>{pendingStatus.text}</p>
          <p className="quarter-info">{openQuarterText}</p>
          <button type="button" onClick={onOpenAppraisal}>
            Review Evaluations Now
          </button>
        </div>
      </div>

      <FeedbackGrid notes={dashboardSummary.feedbackNotes || []} />
    </section>
  );
}
