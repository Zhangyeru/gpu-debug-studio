import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { glsl } from 'codemirror-lang-glsl';
import { oneDark } from '@codemirror/theme-one-dark';
import FileUpload from './FileUpload';

type ShaderEditorProps = {
  value: string;
  filename: string;
  onChange: (value: string) => void;
  onFileContent: (content: string, filename: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  onLineClick?: (line: number) => void;
};

export type ShaderEditorHandle = {
  highlightLines: (fromLine: number, toLine: number) => void;
};

function ShaderEditor(
  { value, filename, onChange, onFileContent, onAnalyze, loading, onLineClick }: ShaderEditorProps,
  ref: React.Ref<ShaderEditorHandle>,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    highlightLines(fromLine: number, toLine: number) {
      const view = viewRef.current;
      if (!view) return;

      // Clear previous highlight
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const editorDom = view.dom;
      editorDom.querySelectorAll('.cm-highlighted-line').forEach((el) => {
        el.classList.remove('cm-highlighted-line');
      });

      // Highlight target lines by finding their DOM elements
      const doc = view.state.doc;
      for (let line = fromLine; line <= toLine; line++) {
        const lineNo = Math.min(line, doc.lines);
        const lineObj = doc.line(lineNo);
        if (lineObj.number !== line) continue;

        // Find the DOM node at the start of the line
        const domAt = view.domAtPos(lineObj.from);
        if (domAt.node) {
          // Start from element node (domAtPos may return a text node)
          let lineEl: HTMLElement | null =
            domAt.node.nodeType === Node.ELEMENT_NODE
              ? (domAt.node as HTMLElement)
              : domAt.node.parentElement;
          // Walk up to find the .cm-line wrapper element
          while (lineEl && !lineEl.classList.contains('cm-line')) {
            lineEl = lineEl.parentElement;
          }
          if (lineEl) {
            lineEl.classList.add('cm-highlighted-line');
          }
        }
      }

      // Clear after 3 seconds
      timerRef.current = setTimeout(() => {
        editorDom.querySelectorAll('.cm-highlighted-line').forEach((el) => {
          el.classList.remove('cm-highlighted-line');
        });
        timerRef.current = null;
      }, 3000);
    },
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        glsl(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    // Click handler for line → explanation linking
    const handleEditorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const lineEl = target.closest('.cm-line') as HTMLElement | null;
      if (!lineEl || !onLineClick) return;

      // Find line number by iterating .cm-line siblings
      const contentEl = lineEl.parentElement;
      if (!contentEl) return;
      const allLines = contentEl.querySelectorAll('.cm-line');
      const index = Array.prototype.indexOf.call(allLines, lineEl);
      if (index >= 0) {
        onLineClick(index + 1); // 1-based line number
      }
    };
    editorRef.current.addEventListener('click', handleEditorClick);

    return () => {
      editorRef.current?.removeEventListener('click', handleEditorClick);
      if (timerRef.current) clearTimeout(timerRef.current);
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  const isEmpty = !value.trim();

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="filename-display">{filename}</span>
        <div className="editor-toolbar-right">
          <FileUpload onFileContent={onFileContent} />
          <button
            className="analyze-btn"
            onClick={onAnalyze}
            disabled={isEmpty || loading}
          >
            {loading ? '分析中...' : '分析'}
          </button>
        </div>
      </div>
      <div className="editor-wrapper" ref={editorRef} />
    </div>
  );
}

export default forwardRef(ShaderEditor);
