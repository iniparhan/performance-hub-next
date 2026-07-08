import Modal from "./Modal";
import QuestionForm from "./QuestionForm";

export default function AppraisalModal({
  isOpen,
  isLoading,
  isSubmitting,
  questions,
  selectedTarget,
  targets,
  onBack,
  onClose,
  onSelectTarget,
  onSubmit,
  onValidationError,
}) {
  return (
    <Modal
      isOpen={isOpen}
      kicker="Performance Appraisal"
      title="Evaluate Member"
      onClose={onClose}
    >
      {!selectedTarget ? (
        <>
          <p className="helper-text">Choose one assigned person to evaluate.</p>
          <div className="target-list">
            {!targets.length ? (
              <div className="notice">
                No appraisal target is available for your role.
              </div>
            ) : (
              targets.map((target) => (
                <div className="target-card" key={target.targetEmail}>
                  <div>
                    <h3>{target.targetName}</h3>
                    <p>
                      {target.targetRole} • {target.targetDepartment} •{" "}
                      {target.targetSubDepartment}
                    </p>
                    <p>
                      {target.relationship} • {target.divisionScope}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={target.isSubmitted || isLoading}
                    onClick={() => onSelectTarget(target.targetEmail)}
                  >
                    {target.isSubmitted ? "Submitted" : "Evaluate"}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <button className="back-button" type="button" onClick={onBack}>
            <span className="back-icon">❮</span>
            <span>Back to List</span>
          </button>

          <div className="selected-target">
            <h3>{selectedTarget.targetName}</h3>
            <p>
              {selectedTarget.targetRole ?? selectedTarget.role?.name ?? "-"} •{" "}
              {selectedTarget.targetDepartment ??
                selectedTarget.division?.name ??
                "-"}{" "}
              •{" "}
              {selectedTarget.targetSubDepartment ??
                selectedTarget.subDivision?.name ??
                "-"}
            </p>
          </div>

          <QuestionForm
            emptyMessage="No question found for this relationship and division scope."
            isSubmitting={isSubmitting}
            prefix="appraisal"
            questions={questions}
            submitLabel="Submit Appraisal"
            onSubmit={onSubmit}
            onValidationError={onValidationError}
          />
        </>
      )}
    </Modal>
  );
}
