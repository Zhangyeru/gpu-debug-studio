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
          算法说明
        </button>
        <button
          className={`tab-btn ${tab === 'flowchart' ? 'active' : ''}`}
          onClick={() => setTab('flowchart')}
        >
          流程图
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}

      {loading && <LoadingState />}

      {!loading && !error && !result && (
        <div className="state-placeholder">
          <p>粘贴代码或加载示例 Shader，然后点击 <strong>分析</strong> 查看算法说明。</p>
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
