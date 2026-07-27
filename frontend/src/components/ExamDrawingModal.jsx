import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "./icons/ExamIcons";

const CANVAS_WIDTH = 760;
const CANVAS_HEIGHT = 420;

function ExamDrawingModal({ onInsert, onCancel }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return {
      x: (point.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (point.clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    isDrawingRef.current = true;
    setIsEmpty(false);
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event) => {
    if (!isDrawingRef.current) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleInsert = () => {
    if (isEmpty) return;
    onInsert(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <div className="exam-drawing-overlay" onClick={onCancel}>
      <div className="exam-drawing-modal" onClick={(event) => event.stopPropagation()}>
        <div className="exam-drawing-header">
          <span>Free-hand drawing</span>
          <button type="button" className="exam-icon-btn" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="exam-drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <div className="exam-drawing-footer">
          <button type="button" className="exam-drawing-clear-btn" onClick={handleClear}>
            Clear
          </button>

          <div className="exam-drawing-footer-actions">
            <button type="button" className="exam-drawing-cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="exam-drawing-insert-btn"
              disabled={isEmpty}
              onClick={handleInsert}
            >
              Insert drawing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamDrawingModal;
