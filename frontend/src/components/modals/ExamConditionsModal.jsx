import '../../styles/Modal.css'

function ExamConditionsModal({ isOpen, onClose, deckCount = 0 }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p>Entering Mock Exam Conditions</p>
        <button className="close-btn" onClick={onClose}>×</button>

        <span>
          You're about to start a mock exam under simulated Inspera
          conditions, covering {deckCount} deck{deckCount === 1 ? "" : "s"}:
        </span>

        <ul className="exam-conditions-list">
          <li>Course outcomes are presented one at a time, in a fixed sequence.</li>
          <li>Hints and saved content stay hidden until you finish.</li>
          <li>Content cannot be edited during the exam.</li>
        </ul>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-confirm-btn exam-confirm-btn" onClick={onClose}>
            I'm ready
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamConditionsModal;
