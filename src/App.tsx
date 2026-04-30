import { useCallback, useRef, useState } from 'react';
import { analyzeShader } from './services/api';
import SampleSelector from './components/SampleSelector';
import ShaderEditor from './components/ShaderEditor';
import ResultPanel from './components/ResultPanel';
import type { AnalysisResult } from './types';

const INITIAL_SHADER = `#version 450

layout(location = 0) in vec2 uv;
layout(location = 0) out vec4 outColor;
layout(binding = 0) uniform sampler2D tex0;

void main() {
  // Write your shader here or load a sample below
  outColor = texture(tex0, uv);
}`;

export default function App() {
  const [shaderSource, setShaderSource] = useState(INITIAL_SHADER);
  const [shaderName, setShaderName] = useState('untitled.frag');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
      setError(err instanceof Error ? err.message : 'Analysis failed');
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

  return (
    <>
      <header className="app-header">
        <h1>GPU Debug Studio</h1>
        <p className="subtitle">
          Shader algorithm analysis — AI-powered explanations and flowcharts
        </p>
      </header>

      <SampleSelector onSelect={handleSampleSelect} />

      <main className="layout">
        <ShaderEditor
          value={shaderSource}
          filename={shaderName}
          onChange={setShaderSource}
          onFileContent={handleFileContent}
          onAnalyze={handleAnalyze}
          loading={loading}
        />
        <ResultPanel
          result={result}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
        />
      </main>
    </>
  );
}
