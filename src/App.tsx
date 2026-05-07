import { useCallback, useRef, useState } from 'react';
import { analyzeShader } from './services/api';
import SampleSelector from './components/SampleSelector';
import ShaderEditor, { type ShaderEditorHandle } from './components/ShaderEditor';
import ResultPanel, { type ResultPanelHandle } from './components/ResultPanel';
import type { AnalysisResult } from './types';

const INITIAL_SHADER = `#version 450

layout(location = 0) in vec2 uv;
layout(location = 0) out vec4 outColor;
layout(binding = 0) uniform sampler2D tex0;

void main() {
  // 在此编写 Shader 或点击下方示例加载
  outColor = texture(tex0, uv);
}`;

export default function App() {
  const [shaderSource, setShaderSource] = useState(INITIAL_SHADER);
  const [shaderName, setShaderName] = useState('untitled.frag');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const editorRef = useRef<ShaderEditorHandle>(null);
  const resultPanelRef = useRef<ResultPanelHandle>(null);

  const handleAnalyze = useCallback(async () => {
    const source = shaderSource.trim();
    if (!source) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeShader(source, shaderName);
      setResult(analysis);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setLoading(false);
    }
  }, [shaderSource, shaderName]);

  const handleFileContent = useCallback(
    (content: string, filename: string) => {
      abortRef.current?.abort();
      setShaderSource(content);
      setShaderName(filename);
      setResult(null);
      setError(null);
    },
    [],
  );

  const handleSampleSelect = useCallback(
    (source: string, name: string) => {
      abortRef.current?.abort();
      setShaderSource(source);
      setShaderName(name);
      setResult(null);
      setError(null);
    },
    [],
  );

  // Right explanation → left code highlight
  const handleLineClick = useCallback((from: number, to: number) => {
    editorRef.current?.highlightLines(from, to);
  }, []);

  // Left code → right explanation highlight
  const handleCodeLineClick = useCallback((line: number) => {
    resultPanelRef.current?.scrollToLine(line);
  }, []);

  return (
    <>
      <header className="app-header">
        <h1>GPU 调试工作室</h1>
        <p className="subtitle">
          Shader 算法分析 — AI 驱动的算法说明与流程图
        </p>
      </header>

      <SampleSelector onSelect={handleSampleSelect} />

      <main className="layout">
        <ShaderEditor
          ref={editorRef}
          value={shaderSource}
          filename={shaderName}
          onChange={setShaderSource}
          onFileContent={handleFileContent}
          onAnalyze={handleAnalyze}
          loading={loading}
          onLineClick={handleCodeLineClick}
        />
        <ResultPanel
          ref={resultPanelRef}
          result={result}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          onLineClick={handleLineClick}
        />
      </main>
    </>
  );
}
