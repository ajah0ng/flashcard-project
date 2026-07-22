import { useEffect, useState } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Image } from "@tiptap/extension-image";
import { Underline } from "@tiptap/extension-underline";
import ResizableImageView from "./ResizableImageView";

import "../styles/Tiptap.css";

const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent(),
            width: {
                default: null,
                renderHTML: (attributes) =>
                    attributes.width ? { width: attributes.width } : {},
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageView);
    },
});

const insertImageFile = (view, file, pos) => {
    if (!file || !file.type.startsWith("image/")) return false;

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
        const node = view.state.schema.nodes.image.create({
            src: readerEvent.target.result,
        });

        const insertPos = pos ?? view.state.selection.from;

        view.dispatch(view.state.tr.insert(insertPos, node));
    };

    reader.readAsDataURL(file);
    return true;
};

function Tiptap({ content = "", onChange, onBlur, autoFocus = false }) {
    const [isDraggingFile, setIsDraggingFile] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Underline,
            ResizableImage.configure({
                inline: false,
                allowBase64: true,
            }),
        ],
        content,
        autofocus: autoFocus ? "end" : false,
        editorProps: {
            handleDrop: (view, event, _slice, moved) => {
                if (moved) return false;

                const file = event.dataTransfer?.files?.[0];
                if (!file) return false;

                const coords = view.posAtCoords({
                    left: event.clientX,
                    top: event.clientY,
                });

                if (insertImageFile(view, file, coords?.pos)) {
                    event.preventDefault();
                    return true;
                }

                return false;
            },
            handlePaste: (view, event) => {
                const file = Array.from(event.clipboardData?.items || [])
                    .find((item) => item.type.startsWith("image/"))
                    ?.getAsFile();

                if (!file) return false;

                if (insertImageFile(view, file)) {
                    event.preventDefault();
                    return true;
                }

                return false;
            },
        },
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
        onBlur({ editor }) {
            onBlur?.(editor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) return;

        if (editor.getHTML() !== content) {
            editor.commands.setContent(content || "", false);
        }
    }, [content, editor]);

    if (!editor) return null;

    const addImage = () => {
        const url = window.prompt("Enter image URL");

        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="tiptap-container">
            <div
                className="tiptap-toolbar"
                onMouseDown={(event) => {
                    if (event.target.tagName !== "INPUT") {
                        event.preventDefault();
                    }
                }}
            >
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "active" : ""}
                >
                    <b>B</b>
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "active" : ""}
                >
                    <i>I</i>
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={editor.isActive("underline") ? "active" : ""}
                >
                    <u>U</u>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    className={editor.isActive("heading", { level: 1 }) ? "active" : ""}
                >
                    Heading 1
                </button>

                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
                >
                    Heading 2
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "active" : ""}
                >
                    • List
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "active" : ""}
                >
                    1. List
                </button>

                <label className="color-picker">
                    Colour
                    <input
                        type="color"
                        onChange={(e) =>
                            editor.chain().focus().setColor(e.target.value).run()
                        }
                    />
                </label>

                <button type="button" onClick={addImage}>
                    🖼️ Image
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    Undo
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    Redo
                </button>
            </div>

            <div
                className={
                    isDraggingFile
                        ? "tiptap-editor-wrapper is-dragging"
                        : "tiptap-editor-wrapper"
                }
                onDragEnter={(event) => {
                    if (event.dataTransfer.types.includes("Files")) {
                        event.preventDefault();
                        setIsDraggingFile(true);
                    }
                }}
                onDragOver={(event) => {
                    if (event.dataTransfer.types.includes("Files")) {
                        event.preventDefault();
                    }
                }}
                onDragLeave={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget)) {
                        return;
                    }

                    setIsDraggingFile(false);
                }}
                onDrop={() => setIsDraggingFile(false)}
            >
                <EditorContent editor={editor} className="tiptap-editor" />
            </div>
        </div>
    );
}

export default Tiptap;