import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { AnalysisResult } from '../types';
import ExplanationTab from './ExplanationTab';
import LoadingState from './LoadingState';
import ErrorBanner from './ErrorBanner';

type ResultPanelProps = {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
  onLineClick?: (from: number, to: number) => void;
};

export type ResultPanelHandle = {
  scrollToLine: (line: number) => void;
};

function ResultPanel(
  { result, loading, error, onDismissError, onLineClick }: ResultPanelProps,
  ref: React.Ref<ResultPanelHandle>,
) {
  const [tab, setTab] = useState<'explanation' | 'optimization'>('explanation');
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    scrollToLine(line: number) {
      const el = containerRef.current;
      if (!el) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      el.querySelectorAll('.line-ref-highlight').forEach((r) => {
        r.classList.remove('line-ref-highlight');
      });

      const refs = el.querySelectorAll<HTMLElement>('.line-ref');
      let target: HTMLElement | null = null;
      for (const r of refs) {
        const from = Number(r.dataset.from);
        const to = Number(r.dataset.to);
        if (from && to && line >= from && line <= to) {
          target = r;
          break;
        }
      }

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('line-ref-highlight');
        timerRef.current = setTimeout(() => {
          target?.classList.remove('line-ref-highlight');
          timerRef.current = null;
        }, 2000);
      }
    },
  }));

  return (
    <div className="panel" ref={containerRef}>
      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}

      {loading && <LoadingState />}

      {!loading && !error && !result && (
        <div className="state-placeholder">
          <p>粘贴代码或加载示例 Shader，然后点击 <strong>分析</strong> 查看算法说明。</p>
        </div>
      )}

      {!loading && result && (
        <>
          <div className="tab-bar">
            <button
              className={`tab-btn ${tab === 'explanation' ? 'active' : ''}`}
              onClick={() => setTab('explanation')}
            >
              算法步骤
            </button>
            <button
              className={`tab-btn ${tab === 'optimization' ? 'active' : ''}`}
              onClick={() => setTab('optimization')}
            >
              性能优化
            </button>
          </div>
          {tab === 'explanation' && (
            <ExplanationTab markdown={result.explanation_markdown} onLineClick={onLineClick} />
          )}
          {tab === 'optimization' && (
            <ExplanationTab markdown={result.optimization_markdown} onLineClick={onLineClick} />
          )}
        </>
      )}
    </div>
  );
}

export default forwardRef(ResultPanel);
