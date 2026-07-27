import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import ExamDrawingModal from "./ExamDrawingModal";
import { ExpandIcon, PencilIcon } from "./icons/ExamIcons";
import "../styles/ExamMode.css";

const SPECIAL_CHARACTERS = ["±", "≤", "≥", "≠", "∞", "√", "π", "Σ", "Δ", "∫", "α", "β", "θ", "→"];

const PARAGRAPH_STYLES = [
  { value: "paragraph", label: "Normal" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

function countWords(text) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function ExamEditor({ content, onChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const symbolPickerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      attributes: { class: "exam-editor-prose" },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
      setWordCount(countWords(currentEditor.getText()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    setWordCount(countWords(editor.getText()));
  }, [editor]);

  useEffect(() => {
    if (!showSymbolPicker) return;

    const handleClickOutside = (event) => {
      if (symbolPickerRef.current && !symbolPickerRef.current.contains(event.target)) {
        setShowSymbolPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSymbolPicker]);

  if (!editor) return null;

  const currentParagraphStyle = PARAGRAPH_STYLES.find(({ value }) =>
    value === "paragraph"
      ? editor.isActive("paragraph")
      : editor.isActive("heading", { level: Number(value.slice(1)) })
  )?.value ?? "paragraph";

  const handleParagraphStyleChange = (event) => {
    const { value } = event.target;

    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: Number(value.slice(1)) }).run();
    }
  };

  const handleCopy = async () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const text = editor.state.doc.textBetween(from, to, "\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard permissions unavailable -- fail silently.
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) editor.chain().focus().insertContent(text).run();
    } catch {
      // Clipboard permissions unavailable -- fail silently.
    }
  };

  const handleInsertEquation = () => {
    const equation = window.prompt("Enter your equation:");
    if (!equation) return;

    editor
      .chain()
      .focus()
      .insertContent(`<span class="exam-equation">${equation}</span>&nbsp;`)
      .run();
  };

  const insertSymbol = (symbol) => {
    editor.chain().focus().insertContent(symbol).run();
    setShowSymbolPicker(false);
  };

  const handleInsertDrawing = (dataUrl) => {
    editor.chain().focus().setImage({ src: dataUrl }).run();
    setShowDrawingModal(false);
  };

  return (
    <div className={isExpanded ? "exam-editor-container is-expanded" : "exam-editor-container"}>
      <div
        className="exam-editor-toolbar"
        onMouseDown={(event) => {
          if (event.target.tagName !== "INPUT" && event.target.tagName !== "SELECT") {
            event.preventDefault();
          }
        }}
      >
        <select
          className="exam-toolbar-select"
          value={currentParagraphStyle}
          onChange={handleParagraphStyleChange}
        >
          {PARAGRAPH_STYLES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <span className="exam-toolbar-divider" />

        <button
          type="button"
          className={editor.isActive("bold") ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={editor.isActive("underline") ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className={editor.isActive("subscript") ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Subscript"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          X<sub>2</sub>
        </button>
        <button
          type="button"
          className={editor.isActive("superscript") ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Superscript"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          X<sup>2</sup>
        </button>
        <button
          type="button"
          className="exam-toolbar-btn"
          title="Clear formatting"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          T<sub>x</sub>
        </button>

        <span className="exam-toolbar-divider" />

        <button type="button" className="exam-toolbar-btn" title="Copy" onClick={handleCopy}>
          ⧉
        </button>
        <button type="button" className="exam-toolbar-btn" title="Paste" onClick={handlePaste}>
          📋
        </button>
        <button
          type="button"
          className="exam-toolbar-btn"
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </button>
        <button
          type="button"
          className="exam-toolbar-btn"
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </button>

        <span className="exam-toolbar-divider" />

        <button
          type="button"
          className={editor.isActive("orderedList") ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          ≡₁
        </button>
        <button
          type="button"
          className={editor.isActive("bulletList") ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          ≡•
        </button>
        <button
          type="button"
          className="exam-toolbar-btn"
          title="Decrease indent"
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        >
          ⇤
        </button>
        <button
          type="button"
          className="exam-toolbar-btn"
          title="Increase indent"
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        >
          ⇥
        </button>

        <span className="exam-toolbar-divider" />

        <button
          type="button"
          className={editor.isActive({ textAlign: "left" }) ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Align left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          ⯇≡
        </button>
        <button
          type="button"
          className={editor.isActive({ textAlign: "center" }) ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          ≡
        </button>
        <button
          type="button"
          className={editor.isActive({ textAlign: "right" }) ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          ≡⯈
        </button>
        <button
          type="button"
          className={editor.isActive({ textAlign: "justify" }) ? "exam-toolbar-btn active" : "exam-toolbar-btn"}
          title="Justify"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          ☰
        </button>

        <span className="exam-toolbar-divider" />

        <div className="exam-symbol-picker-wrap" ref={symbolPickerRef}>
          <button
            type="button"
            className="exam-toolbar-btn"
            title="Special characters"
            onClick={() => setShowSymbolPicker((open) => !open)}
          >
            Ω
          </button>

          {showSymbolPicker && (
            <div className="exam-symbol-picker">
              {SPECIAL_CHARACTERS.map((symbol) => (
                <button
                  type="button"
                  key={symbol}
                  onClick={() => insertSymbol(symbol)}
                >
                  {symbol}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="exam-toolbar-btn"
          title="Insert table"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          ⊞
        </button>
        <button
          type="button"
          className="exam-toolbar-btn"
          title="Free-hand drawing"
          onClick={() => setShowDrawingModal(true)}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          className="exam-toolbar-btn"
          title="Insert equation"
          onClick={handleInsertEquation}
        >
          Σ
        </button>
      </div>

      <button
        type="button"
        className="exam-expand-btn"
        title={isExpanded ? "Collapse" : "Expand"}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        <ExpandIcon />
      </button>

      <div className="exam-editor-body">
        <EditorContent editor={editor} />
      </div>

      <div className="exam-editor-footer">
        <span>Words: {wordCount}</span>
      </div>

      {showDrawingModal && (
        <ExamDrawingModal
          onInsert={handleInsertDrawing}
          onCancel={() => setShowDrawingModal(false)}
        />
      )}
    </div>
  );
}

export default ExamEditor;
