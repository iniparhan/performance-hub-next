export default function QuickActions({
  openQuarter,
  onOpenAppraisal,
  onOpenDepartment,
}) {
  const quarterStatus = openQuarter
    ? `Current open quarter: Q${openQuarter}`
    : "No quarter is currently open.";

  return (
    <section className="quick-section">
      <div className="section-header">
        <h2>Quick Actions</h2>
        <span className="mini-badge">{quarterStatus}</span>
      </div>

      <div className="quick-grid">
        <article className="action-card" onClick={onOpenAppraisal}>
          <div className="card-image appraisal-img" />
          <div className="card-body">
            <div className="card-kicker">Team Flow</div>
            <h3>Performance Appraisal</h3>
            <p>
              Evaluate peers, superiors, or subordinates through our
              standardized feedback cycle.
            </p>
            <button className="link-button" type="button">
              Go to Officer List <span>→</span>
            </button>
          </div>
        </article>

        <article className="action-card" onClick={onOpenDepartment}>
          <div className="card-image tracker-img" />
          <div className="card-body">
            <div className="card-kicker">Metrics View</div>
            <h3>Department Evaluation</h3>
            <p>
              Give feedback about your department performance during the active
              quarter.
            </p>
            <button className="link-button" type="button">
              Review Department <span>→</span>
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
