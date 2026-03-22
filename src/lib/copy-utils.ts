/**
 * Strip markdown syntax to produce plain text.
 */
export function markdownToPlainText(md: string): string {
  return (
    md
      // Remove headings
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      // Remove strikethrough
      .replace(/~~(.+?)~~/g, "$1")
      // Remove inline code
      .replace(/`(.+?)`/g, "$1")
      // Remove links, keep text
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      // Remove images
      .replace(/!\[.*?\]\(.+?\)/g, "")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Clean up bullet markers
      .replace(/^[\s]*[-*+]\s+/gm, "• ")
      // Clean up numbered lists
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Convert markdown to basic HTML.
 */
export function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks (before inline processing)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_m, _lang, code) => `<pre><code>${escapeHtml(code.trim())}</code></pre>`,
  );

  // Inline code
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Links
  html = html.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2">$1</a>',
  );

  // Images
  html = html.replace(
    /!\[(.+?)\]\((.+?)\)/g,
    '<img src="$2" alt="$1" />',
  );

  // Blockquotes
  html = html.replace(
    /^>\s+(.+)$/gm,
    "<blockquote>$1</blockquote>",
  );

  // Horizontal rules
  html = html.replace(/^[-*_]{3,}\s*$/gm, "<hr />");

  // Unordered lists (simple — consecutive bullet lines)
  html = html.replace(
    /(?:^[\s]*[-*+]\s+.+\n?)+/gm,
    (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^[\s]*[-*+]\s+/, "")}</li>`)
        .join("\n");
      return `<ul>\n${items}\n</ul>\n`;
    },
  );

  // Ordered lists
  html = html.replace(
    /(?:^[\s]*\d+\.\s+.+\n?)+/gm,
    (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^[\s]*\d+\.\s+/, "")}</li>`)
        .join("\n");
      return `<ol>\n${items}\n</ol>\n`;
    },
  );

  // Paragraphs — wrap remaining plain text lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap blocks that already have HTML tags
      if (/^<(h[1-6]|ul|ol|pre|blockquote|hr)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n\n");

  return html.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type CopyFormat = "plain" | "markdown" | "html";

export async function copyContent(
  content: string,
  format: CopyFormat,
): Promise<void> {
  let textToCopy: string;

  switch (format) {
    case "plain":
      textToCopy = markdownToPlainText(content);
      break;
    case "html":
      textToCopy = markdownToHtml(content);
      break;
    case "markdown":
    default:
      textToCopy = content;
      break;
  }

  await navigator.clipboard.writeText(textToCopy);
}
