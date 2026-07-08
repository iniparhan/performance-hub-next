import { useState } from "react";

const scoreOptions = [
  ["", "Score"],
  ["1", "1 - Very Poor"],
  ["2", "2 - Poor"],
  ["3", "3 - Fair"],
  ["4", "4 - Good"],
  ["5", "5 - Excellent"],
];

export default function QuestionForm({
  emptyMessage,
  isSubmitting,
  prefix,
  questions,
  submitLabel,
  onSubmit,
  onValidationError,
}) {
  const [answers, setAnswers] = useState({});

  const updateAnswer = (questionId, field, value) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        [field]: value,
      },
    }));
  };

  const getFirstValue = (...values) => {
    return values.find(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    );
  };

  const getQuestionId = (question) => {
    return getFirstValue(
      question.questionId,
      question.question_id,
      question.id,
      question.kpi_id,
      question.depart_kpi_id,
      question.kpis?.id,
      question.depart_kpis?.id,
    );
  };

  const getQuestionTitle = (question) => {
    return (
      getFirstValue(
        question.kpis?.indicator_name,
        question.depart_kpis?.indicator_name,

        question.kpis?.indicatorName,
        question.departKpis?.indicatorName,

        question["kpis.indicator_name"],
        question["depart_kpis.indicator_name"],

        question.indicator_name,
        question.indicatorName,
        question.indicators,
      ) || "Untitled KPI"
    );
  };

  const getQuestionDefinition = (question) => {
    return (
      getFirstValue(
        question.kpis?.definition,
        question.depart_kpis?.definition,

        question["kpis.definition"],
        question["depart_kpis.definition"],

        question.definition,
        question.question,
      ) || ""
    );
  };

  const getQuestionExplanation = (question) => {
    return (
      getFirstValue(
        question.kpis?.explanation,
        question.depart_kpis?.explanation,

        question["kpis.explanation"],
        question["depart_kpis.explanation"],

        question.explanation,
        question.example,
      ) || ""
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = [];

    for (const question of questions) {
      const questionId = getQuestionId(question);
      const title = getQuestionTitle(question);

      const answer = answers[questionId] || {};
      const score = Number(answer.score);
      const notes = (answer.notes || "").trim();

      if (!score || score < 1 || score > 5) {
        onValidationError(`Please fill score for ${title}.`);
        return;
      }

      if (!notes) {
        onValidationError(`Please write notes for ${title}.`);
        return;
      }

      payload.push({
        questionId,
        score,
        notes,
      });
    }

    onSubmit(payload);
  };

  if (!questions.length) {
    return (
      <>
        <div className="notice">{emptyMessage}</div>
        <button className="primary-button" type="button" disabled>
          {submitLabel}
        </button>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {questions.map((question) => {
        const questionId = getQuestionId(question);
        const title = getQuestionTitle(question);
        const definition = getQuestionDefinition(question);
        const explanation = getQuestionExplanation(question);

        return (
          <div className="question-card" key={questionId}>
            <label htmlFor={`${prefix}_score_${questionId}`}>{title}</label>

            {definition ? <p>{definition}</p> : null}

            {explanation ? <small>Explanation: {explanation}</small> : null}

            <div className="form-row">
              <select
                id={`${prefix}_score_${questionId}`}
                value={answers[questionId]?.score || ""}
                required
                onChange={(event) =>
                  updateAnswer(questionId, "score", event.target.value)
                }
              >
                {scoreOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <textarea
                value={answers[questionId]?.notes || ""}
                placeholder="Write your notes here..."
                required
                onChange={(event) =>
                  updateAnswer(questionId, "notes", event.target.value)
                }
              />
            </div>
          </div>
        );
      })}

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : submitLabel}
      </button>
    </form>
  );
}
