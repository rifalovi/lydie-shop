import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";

function parseInline(text: string): TextRun[] {
  // Supports **bold** and `code` and plain text. Italic can be added later.
  const runs: TextRun[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun(text.slice(lastIndex, match.index)));
    }
    if (match[2] !== undefined) {
      runs.push(new TextRun({ text: match[2], bold: true }));
    } else if (match[3] !== undefined) {
      runs.push(new TextRun({ text: match[3], font: "Consolas" }));
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun(text.slice(lastIndex)));
  }

  return runs.length > 0 ? runs : [new TextRun(text)];
}

export async function markdownToDocxBlob(
  markdown: string,
  title: string
): Promise<Blob> {
  const lines = markdown.split(/\r?\n/);
  const children: Paragraph[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) {
      children.push(new Paragraph(""));
      continue;
    }

    if (line.startsWith("# ")) {
      children.push(
        new Paragraph({
          children: parseInline(line.slice(2)),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
        })
      );
      continue;
    }
    if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          children: parseInline(line.slice(3)),
          heading: HeadingLevel.HEADING_2,
        })
      );
      continue;
    }
    if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          children: parseInline(line.slice(4)),
          heading: HeadingLevel.HEADING_3,
        })
      );
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      children.push(
        new Paragraph({
          children: parseInline(line.slice(2)),
          bullet: { level: 0 },
        })
      );
      continue;
    }
    if (/^---+$/.test(line)) {
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    children.push(new Paragraph({ children: parseInline(line) }));
  }

  const doc = new Document({
    creator: "Assistant SCS — OIF",
    title,
    description: "Note analytique générée par l'Assistant SCS",
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
