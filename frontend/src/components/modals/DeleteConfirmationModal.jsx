import '../../styles/Modal.css'

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  title = "Delete Collection",
  itemLabel = "collection",
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p>{title}</p>
        <button className="close-btn" onClick={onClose}>×</button>

        <span>
          Are you sure you want to delete{" "}
          {itemName ? <strong>{itemName}</strong> : `this ${itemLabel}`}? This
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
