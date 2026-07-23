import '../../styles/Modal.css'

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p>Delete Collection</p>
        <button className="close-btn" onClick={onClose}>×</button>

        <span>
          Are you sure you want to delete{" "}
          {itemName ? <strong>{itemName}</strong> : "this collection"}? This
          action cannot be undone.
        </span>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-confirm-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;
