export default function FeedbackGrid({ notes = [] }) {
  const appraisalNotes = notes.filter((item) => item.source === "Appraisal");

  return (
    <div className="panel feedback-panel">
      <h3>Qualitative Feedback</h3>

      <div className="feedback-grid">
        {!appraisalNotes.length ? (
          <div className="notice">
            No feedback notes are available for your received evaluations yet.
          </div>
        ) : (
          appraisalNotes.map((item, index) => (
            <div
              className="feedback-card"
              key={`${item.evaluatorName}-${item.quartal}-${index}`}
            >
              <div className="feedback-user">
                <div className="avatar">
                  {/* {(item.evaluatorName || "U").charAt(0).toUpperCase()} */}
                </div>
                <div>
                  {/* <strong>{item.evaluatorName || "Anonymous"}</strong> */}
                  <strong>{"Anonymous"}</strong>
                  <p>
                    {/* {item.source} • Q{item.quartal} */}
                    {item.source} • Q{item.quartal}
                  </p>
                </div>
                {/* <span>{item.score}/5</span> */}
                <span>{" - "}</span>
              </div>
              <p>
                <strong>{"Feedback"}</strong>
              </p>
              <p>{item.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
