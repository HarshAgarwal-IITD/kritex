/**
 * Product descriptions are plain text with a tiny markdown subset, so the admin textarea stays simple:
 *   - blank line       -> new block
 *   - "## Heading"     -> section heading
 *   - "- item" lines   -> bullet list
 *   - "**bold**"       -> strong (inline)
 * The first paragraph is the intro (shown beside the gallery and used for SEO); the rest is the
 * long-form "Product Details" section. Unstructured descriptions are just one intro paragraph.
 */
export type DescriptionBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

export function parseDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "paragraph", text: para.join(" ") });
    if (list.length) blocks.push({ kind: "list", items: list });
    para = [];
    list = [];
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "heading", text: line.slice(3).trim() });
    } else if (/^[-•]\s+/.test(line)) {
      if (para.length) flush();
      list.push(line.replace(/^[-•]\s+/, ""));
    } else {
      if (list.length) flush();
      para.push(line);
    }
  }
  flush();
  return blocks;
}

export const stripInline = (text: string) => text.replace(/\*\*(.+?)\*\*/g, "$1");

/** The intro paragraph (plain text) and the remaining blocks. */
export function splitDescription(text: string): { intro: string; body: DescriptionBlock[] } {
  const blocks = parseDescription(text);
  const first = blocks[0];
  if (first?.kind !== "paragraph") return { intro: "", body: blocks };
  return { intro: stripInline(first.text), body: blocks.slice(1) };
}

/** Plain-text summary for meta tags / JSON-LD. */
export const descriptionSummary = (text: string) => {
  const { intro, body } = splitDescription(text);
  if (intro) return intro;
  const firstText = body.find((b) => b.kind === "paragraph");
  return firstText?.kind === "paragraph" ? stripInline(firstText.text) : stripInline(text.replace(/^##\s+/gm, ""));
};
