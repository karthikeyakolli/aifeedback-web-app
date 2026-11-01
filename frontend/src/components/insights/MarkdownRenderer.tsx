import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onCitationClick?: (citationText: string) => void;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCitationClick,
  className = '',
}) => {
  if (!content) return null;

  // Split content into blocks: code blocks, tables, lists, headers, paragraphs
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-3 text-[13px] leading-relaxed text-[var(--text-primary)] ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'header': {
            const level = block.level;
            const text = renderInline(block.content, onCitationClick);
            if (level === 1) {
              return (
                <h1
                  key={index}
                  className="text-lg font-bold text-[var(--text-primary)] mt-4 mb-2 pb-1.5 border-b border-[var(--border-subtle)]"
                >
                  {text}
                </h1>
              );
            }
            if (level === 2) {
              return (
                <h2
                  key={index}
                  className="text-base font-bold text-[var(--text-primary)] mt-3.5 mb-1.5 pb-1 border-b border-[var(--border-subtle)]/60"
                >
                  {text}
                </h2>
              );
            }
            if (level === 3) {
              return (
                <h3 key={index} className="text-sm font-semibold text-[var(--text-primary)] mt-3 mb-1">
                  {text}
                </h3>
              );
            }
            return (
              <h4 key={index} className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-2.5 mb-1">
                {text}
              </h4>
            );
          }

          case 'code':
            return <CodeBlock key={index} code={block.content} language={block.language} />;

          case 'table':
            return <TableBlock key={index} rows={block.rows} onCitationClick={onCitationClick} />;

          case 'quote':
            return (
              <blockquote
                key={index}
                className="pl-3.5 py-1.5 border-l-3 border-indigo-500 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-r-lg my-2 text-xs italic text-[var(--text-primary)]"
              >
                {renderInline(block.content, onCitationClick)}
              </blockquote>
            );

          case 'list':
            return (
              <ul key={index} className="space-y-1.5 my-2 pl-1">
                {block.items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                    <span className="flex-1">{renderInline(item, onCitationClick)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'ordered-list':
            return (
              <ol key={index} className="space-y-1.5 my-2 pl-1 list-none">
                {block.items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-xs font-bold text-indigo-500 shrink-0 min-w-4 text-right mt-0.5">
                      {i + 1}.
                    </span>
                    <span className="flex-1">{renderInline(item, onCitationClick)}</span>
                  </li>
                ))}
              </ol>
            );

          case 'paragraph':
          default:
            return (
              <p key={index} className="leading-relaxed">
                {renderInline(block.content, onCitationClick)}
              </p>
            );
        }
      })}
    </div>
  );
};

// Code block with copy button
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-slate-900 text-slate-100 my-3 text-xs shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-xs leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Table block
const TableBlock: React.FC<{ rows: string[][]; onCitationClick?: (c: string) => void }> = ({
  rows,
  onCitationClick,
}) => {
  if (rows.length === 0) return null;
  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div className="overflow-x-auto my-3 rounded-xl border border-[var(--border-subtle)] shadow-xs">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-[var(--surface-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-semibold text-[10px] border-b border-[var(--border-subtle)]">
          <tr>
            {header.map((col, idx) => (
              <th key={idx} className="px-3.5 py-2.5">
                {renderInline(col, onCitationClick)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {body.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-3.5 py-2 text-[var(--text-primary)]">
                  {renderInline(cell, onCitationClick)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Inline parser for bold, italics, code, and citations
function renderInline(text: string, onCitationClick?: (c: string) => void): React.ReactNode {
  if (!text) return null;

  // Pattern matches:
  // 1. Citations: [1], [2], [Sarah Chen], [comment_123], [doc_abc]
  // 2. Bold: **text**
  // 3. Inline code: `code`
  // 4. Italic: *text*
  const tokens: React.ReactNode[] = [];
  const regex = /(\[[\w\s\.\,\#\-\_\:\/]{1,40}\]|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // Citation tag [1], [2], [Author]
    if (token.startsWith('[') && token.endsWith(']')) {
      const citationContent = token.slice(1, -1);
      const isCitationPattern =
        /^\d+$/.test(citationContent) ||
        citationContent.toLowerCase().includes('comment') ||
        citationContent.toLowerCase().includes('doc') ||
        citationContent.toLowerCase().includes('spec') ||
        citationContent.toLowerCase().includes('prd') ||
        citationContent.length < 25;

      if (isCitationPattern) {
        tokens.push(
          <button
            key={match.index}
            type="button"
            onClick={() => onCitationClick && onCitationClick(citationContent)}
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 hover:underline border border-indigo-500/30 cursor-pointer align-baseline transition-all"
            title={`Inspect citation: ${citationContent}`}
          >
            {citationContent}
          </button>
        );
      } else {
        tokens.push(token);
      }
    }
    // Bold **text**
    else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} className="font-semibold text-[var(--text-primary)]">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Inline code `code`
    else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-mono bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-indigo-600 dark:text-indigo-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    // Italic *text*
    else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={match.index} className="italic text-[var(--text-primary)]">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return <>{tokens}</>;
}

// Block parser for paragraphs, code fences, tables, headers, lists
interface ParsedBlock {
  type: 'header' | 'code' | 'table' | 'quote' | 'list' | 'ordered-list' | 'paragraph';
  level?: number;
  content?: any;
  language?: string;
  rows?: any;
  items?: any;
}

function parseBlocks(markdown: string): ParsedBlock[] {
  const lines = markdown.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code',
        language: language || 'text',
        content: codeLines.join('\n'),
      });
      i++;
      continue;
    }

    // Markdown Table (starts with |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowLine = lines[i].trim();
        // Ignore separator row e.g. |---|---|
        if (!/^[\|\-\:\s]+$/.test(rowLine)) {
          const cells = rowLine
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      blocks.push({
        type: 'table',
        rows: tableRows,
      });
      continue;
    }

    // Headings #, ##, ###, ####
    const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headerMatch) {
      blocks.push({
        type: 'header',
        level: headerMatch[1].length,
        content: headerMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'quote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'ordered-list',
        items,
      });
      continue;
    }

    // Unordered list
    if (/^[\*\-]\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[\*\-]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[\*\-]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        items,
      });
      continue;
    }

    // Paragraph
    if (line.trim().length > 0) {
      const pLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim().length > 0 &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('|') &&
        !lines[i].trim().startsWith('>') &&
        !/^[\*\-]\s/.test(lines[i].trim()) &&
        !/^\d+\.\s/.test(lines[i].trim())
      ) {
        pLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'paragraph',
        content: pLines.join(' '),
      });
      continue;
    }

    i++;
  }

  return blocks;
}
