import { useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";

const MIN_WIDTH = 80;

function ResizableImageView({ node, updateAttributes, selected, deleteNode }) {
    const { src, alt, width } = node.attrs;
    const wrapperRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);

    const handleResizeStart = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const startX = event.clientX;
        const startWidth = wrapperRef.current?.offsetWidth || 0;

        setIsResizing(true);

        const handlePointerMove = (moveEvent) => {
            const nextWidth = Math.max(
                MIN_WIDTH,
                Math.round(startWidth + (moveEvent.clientX - startX))
            );

            updateAttributes({ width: nextWidth });
        };

        const handlePointerUp = () => {
            setIsResizing(false);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    };

    return (
        <NodeViewWrapper
            ref={wrapperRef}
            className={`tiptap-image-wrapper${selected ? " is-selected" : ""}${
                isResizing ? " is-resizing" : ""
            }`}
            style={{ width: width ? `${width}px` : undefined }}
        >
            <img src={src} alt={alt || ""} draggable={false} />

            <button
                type="button"
                className="tiptap-image-delete"
                contentEditable={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => deleteNode()}
                aria-label="Delete image"
            >
                ×
            </button>

            <span
                className="tiptap-image-resize-handle"
                contentEditable={false}
                onPointerDown={handleResizeStart}
            />
        </NodeViewWrapper>
    );
}

export default ResizableImageView;
