import { useEffect, useRef } from 'react';
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
};

export default function ShaderEditor({
  value,
  filename,
  onChange,
  onFileContent,
  onAnalyze,
  loading,
}: ShaderEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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

    return () => view.destroy();
    // Only mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor when value changes externally (samples, uploads)
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
