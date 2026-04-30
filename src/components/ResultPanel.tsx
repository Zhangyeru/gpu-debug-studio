import { useState } from 'react';
import type { AnalysisResult } from '../types';
import ExplanationTab from './ExplanationTab';
import FlowchartTab from './FlowchartTab';
import LoadingState from './LoadingState';
import ErrorBanner from './ErrorBanner';

type ResultPanelProps = {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
};

export default function ResultPanel({
  result,
  loading,
  error,
  onDismissError,
}: ResultPanelProps) {
  const [tab, setTab] = useState<'explanation' | 'flowchart'>('explanation');

  return (
    <div className="panel">
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'explanation' ? 'active' : ''}`}
          onClick={() => setTab('explanation')}
        >
          Explanation
        </button>
        <button
          className={`tab-btn ${tab === 'flowchart' ? 'active' : ''}`}
          onClick={() => setTab('flowchart')}
        >
          Flowchart
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}

      {loading && <LoadingState />}

      {!loading && !error && !result && (
        <div className="state-placeholder">
          <p>Paste or load a shader, then click <strong>Analyze</strong> to see the algorithm explained here.</p>
        </div>
      )}

      {!loading && result && tab === 'explanation' && (
        <ExplanationTab markdown={result.explanation_markdown} />
      )}
      {!loading && result && tab === 'flowchart' && (
        <FlowchartTab mermaidCode={result.mermaid_code} />
      )}
    </div>
  );
}
