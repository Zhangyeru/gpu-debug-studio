import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type ExplanationTabProps = {
  markdown: string;
  onLineClick?: (from: number, to: number) => void;
};

export default function ExplanationTab({ markdown, onLineClick }: ExplanationTabProps) {
  // Replace [第X行] and [第X-Y行] with markdown links
  const processed = markdown
    // Range format: [第1-5行]
    .replace(
      /\[第(\d+)-(\d+)行\]/g,
      (_, from: string, to: string) => `[第${from}-${to}行](#L${from}-${to})`,
    )
    // Single line format: [第8行]
    .replace(
      /\[第(\d+)行\]/g,
      (_, line: string) => `[第${line}行](#L${line}-${line})`,
    );

  return (
    <div className="explanation-content explanation">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            const lineMatch = (href || '').match(/^#L(\d+)-(\d+)$/);
            if (lineMatch) {
              return (
                <span
                  className="line-ref"
                  data-from={lineMatch[1]}
                  data-to={lineMatch[2]}
                  onClick={(e) => {
                    e.preventDefault();
                    onLineClick?.(Number(lineMatch[1]), Number(lineMatch[2]));
                  }}
                >
                  {children}
                </span>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');
            const nodeProps = props as Record<string, unknown>;

            if (match) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                >
                  {codeStr}
                </SyntaxHighlighter>
              );
            }

            return (
              <code className={className} {...nodeProps}>
                {children}
              </code>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
