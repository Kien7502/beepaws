export type DescriptionSection = {
  heading: string | null;
  html: string;
};

export function parseDescriptionSections(html: string): DescriptionSection[] {
  const parts = html.split(/(<h2[^>]*>[\s\S]*?<\/h2>)/gi);
  const sections: DescriptionSection[] = [];

  const intro = parts[0]?.trim();
  if (intro) sections.push({ heading: null, html: intro });

  for (let i = 1; i < parts.length; i += 2) {
    const headingTag = parts[i] ?? "";
    const content = parts[i + 1]?.trim() ?? "";
    const headingText = headingTag.replace(/<[^>]+>/g, "").trim();
    if (headingText) sections.push({ heading: headingText, html: content });
  }

  return sections;
}
