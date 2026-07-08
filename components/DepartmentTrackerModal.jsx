import Modal from "./Modal";
import QuestionForm from "./QuestionForm";

export default function DepartmentTrackerModal({
  isOpen,
  isLoading,
  isSubmitting,
  questions,
  currentUser,
  departmentSubmissionStatus,
  onClose,
  onSubmit,
  onValidationError,
}) {
  const departmentName =
    currentUser?.department ??
    currentUser?.division?.name ??
    currentUser?.divisionName ??
    "Department";

  const isSubmitted = departmentSubmissionStatus?.isSubmitted || false;

  return (
    <Modal
      isOpen={isOpen}
      kicker="Department Tracker"
      title="Evaluate Department"
      onClose={onClose}
    >
      <div className="selected-target">
        <h3>{departmentName}</h3>
        <p>
          Penilaian ini berlaku untuk seluruh anggota dalam department yang
          sama.
        </p>
      </div>

      {isLoading ? (
        <div className="notice">Loading department questions...</div>
      ) : isSubmitted ? (
        <div className="notice">
          Department evaluation sudah disubmit untuk periode ini.
        </div>
      ) : (
        <QuestionForm
          emptyMessage="No department question found for this department."
          isSubmitting={isSubmitting}
          prefix="department-tracker"
          questions={questions}
          submitLabel="Submit Department Evaluation"
          onSubmit={onSubmit}
          onValidationError={onValidationError}
        />
      )}
    </Modal>
  );
}
