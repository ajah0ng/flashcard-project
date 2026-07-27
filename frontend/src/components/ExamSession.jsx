import { useEffect, useRef, useState } from "react";
import ExamEditor from "./ExamEditor";
import {
  WifiIcon,
  BellIcon,
  HamburgerIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  KeyboardIcon,
} from "./icons/ExamIcons";
import "../styles/ExamMode.css";

const hasText = (html) => Boolean(html && html.replace(/<[^>]*>/g, "").trim().length > 0);

function ExamSession({ cards, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(() => new Set());
  const [view, setView] = useState("question"); // "question" | "summary" | "complete"
  const [showMenu, setShowMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const menuRef = useRef(null);

  const currentCard = cards[currentIndex];
  const total = cards.length;

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleExitRequest = () => {
    setShowMenu(false);
    if (window.confirm("Exit the mock exam? Your answers for this session will be lost.")) {
      onClose();
    }
  };

  const handleAnswerChange = (html) => {
    setAnswers((prev) => ({ ...prev, [currentCard._id]: html }));
  };

  const toggleFlagged = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentCard._id)) {
        next.delete(currentCard._id);
      } else {
        next.add(currentCard._id);
      }
      return next;
    });
  };

  const goTo = (index) => {
    setCurrentIndex(index);
    setView("question");
  };

  const topBar = (
    <div className="exam-topbar">
      <span className="exam-topbar-candidate">Candidate ID</span>

      <div className="exam-topbar-actions">
        <WifiIcon className="exam-topbar-icon" />
        <BellIcon className="exam-topbar-icon" />

        <div className="exam-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="exam-icon-btn"
            onClick={() => setShowMenu((open) => !open)}
          >
            <HamburgerIcon />
          </button>

          {showMenu && (
            <div className="exam-menu">
              <button type="button" onClick={handleExitRequest}>
                Exit exam
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const progressBar = (
    <div className="exam-progress-bar">
      {cards.map((card, index) => (
        <button
          type="button"
          key={card._id}
          className={
            "exam-progress-tile" +
            (index === currentIndex && view === "question" ? " is-current" : "") +
            (flagged.has(card._id) ? " is-flagged" : "") +
            (hasText(answers[card._id]) ? " is-answered" : "")
          }
          onClick={() => goTo(index)}
        >
          {index + 1}
        </button>
      ))}

      <button
        type="button"
        className={"exam-progress-tile exam-progress-submit" + (view === "summary" ? " is-current" : "")}
        title="Review and submit"
        onClick={() => setView("summary")}
      >
        <CheckIcon />
      </button>
    </div>
  );

  if (view === "complete") {
    return (
      <div className="exam-overlay">
        {topBar}

        <div className="exam-page exam-complete-page">
          <h1>Exam submitted</h1>
          <p className="exam-complete-subtitle">
            You answered {Object.values(answers).filter(hasText).length} of {total} course
            outcome{total === 1 ? "" : "s"}.
          </p>

          <div className="exam-review-list">
            {cards.map((card, index) => (
              <div className="exam-review-item" key={card._id}>
                <div className="exam-review-item-header">
                  <span className="exam-review-item-number">{index + 1}</span>
                  <span className="exam-review-item-title">
                    {card.courseOutcome || "Untitled Course Outcome"}
                  </span>
                </div>

                <div className="exam-review-item-body">
                  <div>
                    <p className="exam-review-label">Your answer</p>
                    <div
                      className="exam-review-content"
                      dangerouslySetInnerHTML={{
                        __html: hasText(answers[card._id])
                          ? answers[card._id]
                          : "<p><em>No answer given</em></p>",
                      }}
                    />
                  </div>

                  <details className="exam-review-model">
                    <summary>Show model answer</summary>
                    <div
                      className="exam-review-content"
                      dangerouslySetInnerHTML={{
                        __html: card.content || "<p><em>No content saved</em></p>",
                      }}
                    />
                  </details>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="exam-primary-btn" onClick={onClose}>
            Return to collection
          </button>
        </div>
      </div>
    );
  }

  if (view === "summary") {
    return (
      <div className="exam-overlay">
        {topBar}

        <div className="exam-page">
          <h1>Test summary</h1>
          <p className="exam-complete-subtitle">
            Review your questions before you submit. You can still go back and change answers.
          </p>

          <div className="exam-summary-list">
            {cards.map((card, index) => (
              <button
                type="button"
                key={card._id}
                className="exam-summary-row"
                onClick={() => goTo(index)}
              >
                <span className="exam-summary-number">{index + 1}</span>
                <span className="exam-summary-title">
                  {card.courseOutcome || "Untitled Course Outcome"}
                </span>
                {flagged.has(card._id) && (
                  <BookmarkIcon filled className="exam-summary-flag" />
                )}
                <span
                  className={
                    hasText(answers[card._id])
                      ? "exam-summary-status is-answered"
                      : "exam-summary-status"
                  }
                >
                  {hasText(answers[card._id]) ? "Answered" : "Not answered"}
                </span>
              </button>
            ))}
          </div>

          <div className="exam-summary-actions">
            <button type="button" className="exam-secondary-btn" onClick={() => goTo(currentIndex)}>
              Back to exam
            </button>
            <button type="button" className="exam-primary-btn" onClick={() => setView("complete")}>
              Submit exam
            </button>
          </div>
        </div>

        {progressBar}
      </div>
    );
  }

  return (
    <div className="exam-overlay">
      {topBar}

      <div className="exam-page">
        <div className="exam-question-header">
          <span className="exam-question-number">{currentIndex + 1}</span>

          <button
            type="button"
            className="exam-icon-btn exam-bookmark-btn"
            title={flagged.has(currentCard._id) ? "Unmark for review" : "Mark for review"}
            onClick={toggleFlagged}
          >
            <BookmarkIcon filled={flagged.has(currentCard._id)} />
          </button>
        </div>

        <h1 className="exam-question-title">Written Response Question</h1>
        <p className="exam-question-kicker">
          This is a written response question{currentCard.deckName ? ` from ${currentCard.deckName}` : ""}.
        </p>

        <p className="exam-question-prompt">
          {currentCard.courseOutcome || "Untitled Course Outcome"}
        </p>

        <p className="exam-question-hint">
          Use the formatting toolbar below to structure your answer, or click the pencil{" "}
          <PencilInline /> to add a free-hand drawing.
        </p>

        <div className="exam-answer-header">
          <span className="exam-answer-label">Fill in your answer here</span>

          <div className="exam-help-wrap">
            <button type="button" className="exam-help-btn" onClick={() => setShowHelp((s) => !s)}>
              <KeyboardIcon /> Help
            </button>

            {showHelp && (
              <div className="exam-help-popup">
                <h4>Keyboard shortcuts</h4>
                <ul>
                  <li><kbd>Ctrl/Cmd</kbd> + <kbd>B</kbd> Bold</li>
                  <li><kbd>Ctrl/Cmd</kbd> + <kbd>I</kbd> Italic</li>
                  <li><kbd>Ctrl/Cmd</kbd> + <kbd>U</kbd> Underline</li>
                  <li><kbd>Ctrl/Cmd</kbd> + <kbd>Z</kbd> Undo</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <ExamEditor
          key={currentCard._id}
          content={answers[currentCard._id] || ""}
          onChange={handleAnswerChange}
        />

        <div className="exam-tips">
          <p className="exam-tips-title">Tips for answering:</p>
          <ul>
            <li>Your answers stay on this device for the length of the session.</li>
            <li>You can flag a question and come back to it using the progress bar.</li>
            <li>The model answer and hints stay hidden until you submit.</li>
          </ul>
        </div>

        <div className="exam-nav-buttons">
          <button
            type="button"
            className="exam-nav-btn"
            disabled={currentIndex === 0}
            onClick={() => goTo(currentIndex - 1)}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className="exam-nav-btn"
            disabled={currentIndex === total - 1}
            onClick={() => goTo(currentIndex + 1)}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {progressBar}
    </div>
  );
}

function PencilInline() {
  return <span className="exam-pencil-inline">✎</span>;
}

export default ExamSession;
