import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split content by disclaimer if present
  let mainBody = content;
  let disclaimerText = '';

  const disclaimerMatch = content.match(/>\s*⚠️\s*(HealthEase AI provides.*?)(?=\n\n|$)/s);
  if (disclaimerMatch) {
    disclaimerText = disclaimerMatch[1].trim();
    mainBody = content.replace(disclaimerMatch[0], '').trim();
  }

  // Parse lines into logical blocks: headings, tables, lists, blockquotes, paragraphs
  const lines = mainBody.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentTableLines: string[] = [];
  let currentListItems: { type: 'ul' | 'ol'; text: string; num?: string }[] = [];
  let currentParagraphLines: string[] = [];
  let blockKey = 0;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim();
      if (text) {
        blocks.push(
          <p key={`p-${blockKey++}`} className="my-2.5 text-slate-200 dark:text-slate-200 light:text-slate-800 leading-relaxed text-sm sm:text-base">
            {renderInlineMarkdown(text)}
          </p>
        );
      }
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      const isOrdered = currentListItems[0].type === 'ol';
      if (isOrdered) {
        blocks.push(
          <ol key={`ol-${blockKey++}`} className="space-y-2 my-3 pl-1">
            {currentListItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center border border-cyan-500/30 mt-0.5">
                  {item.num || idx + 1}
                </span>
                <span className="flex-1">{renderInlineMarkdown(item.text)}</span>
              </li>
            ))}
          </ol>
        );
      } else {
        blocks.push(
          <ul key={`ul-${blockKey++}`} className="space-y-1.5 my-3 pl-1">
            {currentListItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <span className="shrink-0 w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shadow-[0_0_6px_#06b6d4]" />
                <span className="flex-1">{renderInlineMarkdown(item.text)}</span>
              </li>
            ))}
          </ul>
        );
      }
      currentListItems = [];
    }
  };

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const tableComponent = renderTable(currentTableLines, blockKey++);
      if (tableComponent) blocks.push(tableComponent);
      currentTableLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Empty line separates blocks
    if (!line) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    // Markdown Table line (starts and ends with | or contains |)
    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph();
      flushList();
      currentTableLines.push(line);
      continue;
    } else if (currentTableLines.length > 0) {
      flushTable();
    }

    // H1: # 🩺 Title
    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      const title = line.replace(/^#\s+/, '');
      blocks.push(
        <h2 key={`h1-${blockKey++}`} className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 mb-4 pb-3 border-b border-cyan-500/20 flex items-center gap-2">
          <span>{title}</span>
        </h2>
      );
      continue;
    }

    // H2: ## 💡 Header
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      const heading = line.replace(/^##\s+/, '');
      blocks.push(
        <h3 key={`h2-${blockKey++}`} className="text-base sm:text-lg font-bold text-cyan-300 tracking-tight mt-6 mb-2 flex items-center gap-2">
          <span>{heading}</span>
        </h3>
      );
      continue;
    }

    // H3: ### Header
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      const heading = line.replace(/^###\s+/, '');
      blocks.push(
        <h4 key={`h3-${blockKey++}`} className="text-sm sm:text-base font-semibold text-teal-300 mt-4 mb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span>{heading}</span>
        </h4>
      );
      continue;
    }

    // Unordered list item
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      flushParagraph();
      const text = line.replace(/^[-*•]\s+/, '');
      currentListItems.push({ type: 'ul', text });
      continue;
    }

    // Ordered list item (e.g., 1. or 2.)
    const olMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
    if (olMatch) {
      flushParagraph();
      currentListItems.push({ type: 'ol', num: olMatch[1], text: olMatch[2] });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      const quoteText = line.replace(/^>\s*/, '');
      blocks.push(
        <blockquote key={`bq-${blockKey++}`} className="my-3 p-3.5 rounded-xl bg-cyan-950/20 border-l-4 border-cyan-400 text-xs sm:text-sm text-cyan-100">
          {renderInlineMarkdown(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Normal paragraph text
    currentParagraphLines.push(line);
  }

  // Flush remaining
  flushParagraph();
  flushList();
  flushTable();

  return (
    <div className="ai-response-rendered space-y-1">
      {blocks}

      {/* Styled Compact Disclaimer Footer */}
      {disclaimerText && (
        <div className="mt-5 p-3 rounded-xl bg-slate-900/60 dark:bg-slate-950/70 border border-[var(--border)] flex items-start gap-2.5 text-[11px] text-slate-400 shadow-sm">
          <span className="text-amber-400 text-sm shrink-0">⚠️</span>
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-300">HealthEase AI Educational Notice: </span>
            {disclaimerText}
          </div>
        </div>
      )}
    </div>
  );
};

// Parse Markdown Table lines into styled HTML table with mobile scroll safety
function renderTable(tableLines: string[], key: number): React.ReactNode {
  if (tableLines.length < 2) return null;

  // Header row
  const headerCells = tableLines[0]
    .split('|')
    .map(c => c.trim())
    .filter((c, idx, arr) => idx !== 0 && idx !== arr.length - 1);

  // Rows (skip separator row line 1 which has ---)
  const rows: string[][] = [];
  for (let r = 1; r < tableLines.length; r++) {
    const line = tableLines[r];
    if (line.includes('---')) continue; // Skip separator line
    const cells = line
      .split('|')
      .map(c => c.trim())
      .filter((c, idx, arr) => idx !== 0 && idx !== arr.length - 1);
    if (cells.length > 0) rows.push(cells);
  }

  return (
    <div key={`table-wrapper-${key}`} className="my-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-slate-900/40 shadow-inner">
      <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[340px]">
        <thead>
          <tr className="bg-cyan-500/10 border-b border-[var(--border)]">
            {headerCells.map((h, i) => (
              <th key={i} className="py-2.5 px-3.5 font-bold text-cyan-300 uppercase tracking-wider text-[11px] sm:text-xs">
                {renderInlineMarkdown(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-cyan-500/5 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="py-2.5 px-3.5 text-slate-200">
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Parse inline Markdown: bold **...**, italics *...*, code `...`, links [...]
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split on bold **bold**
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith('**') && bPart.endsWith('**')) {
      const inner = bPart.slice(2, -2);
      return (
        <strong key={`b-${bIdx}`} className="font-extrabold text-white bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">
          {inner}
        </strong>
      );
    }

    // Split on code `code`
    const codeParts = bPart.split(/(`.*?`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith('`') && cPart.endsWith('`')) {
        return (
          <code key={`c-${cIdx}`} className="font-mono text-cyan-300 bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">
            {cPart.slice(1, -1)}
          </code>
        );
      }

      // Check links [text](url)
      const linkMatch = cPart.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [full, linkText, url] = linkMatch;
        const [before, after] = cPart.split(full);
        return (
          <span key={`l-${cIdx}`}>
            {before}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-semibold">
              {linkText}
            </a>
            {after}
          </span>
        );
      }

      return cPart;
    });
  });
}
