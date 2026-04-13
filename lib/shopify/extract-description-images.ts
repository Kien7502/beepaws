/**
 * Tách thẻ <img> khỏi HTML mô tả sản phẩm (Shopify) để hiển thị layout riêng.
 */
export function extractImagesFromProductHtml(html: string): {
  strippedHtml: string;
  images: { src: string; alt: string }[];
} {
  const images: { src: string; alt: string }[] = [];
  const imgTagRe = /<img\b[^>]*>/gi;

  let stripped = html.replace(imgTagRe, (tag) => {
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    const altMatch = tag.match(/\balt=["']([^"']*)["']/i);
    if (srcMatch?.[1]) {
      images.push({ src: srcMatch[1], alt: altMatch?.[1] ?? "" });
    }
    return "";
  });

  stripped = stripped
    .replace(/<figure>\s*<\/figure>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />")
    .trim();

  return { strippedHtml: stripped, images };
}
