import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

type FlowchartTabProps = {
  mermaidCode: string;
};

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#1c2129',
    primaryBorderColor: '#58a6ff',
    primaryTextColor: '#e6edf3',
    lineColor: '#8b949e',
    secondaryColor: '#161b22',
    tertiaryColor: '#0e1117',
  },
});

export default function FlowchartTab({ mermaidCode }: FlowchartTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    setParseError(null);

    // Validate before rendering
    try {
      mermaid.parse(mermaidCode);
    } catch {
      setParseError('Mermaid syntax error — the generated diagram may be invalid.');
      return;
    }

    let cancelled = false;

    const renderId = 'mermaid-' + Math.random().toString(36).slice(2, 8);
    mermaid
      .run({
        nodes: [],
        suppressErrors: true,
      })
      .catch(() => {});

    // Manual render approach
    mermaid
      .render(renderId, mermaidCode)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setParseError('Failed to render diagram.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mermaidCode]);

  return (
    <div className="tab-content">
      {parseError && (
        <div className="error-banner" style={{ margin: '0 0 16px 0' }}>
          {parseError}
        </div>
      )}
      <div className="mermaid-container" ref={containerRef} />
    </div>
  );
}
