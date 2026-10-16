/** Organize whitespace only: never rewrite words, punctuation or list markers. */
export function organizeText(input) {
  const normalized = input.replace(/\r\n?/g, "\n");
  const segmenter = new Intl.Segmenter("pt-PT", { granularity: "sentence" });
  const special = (line) =>
    /^\s*(?:#{1,6}\s|[-*•▪‣]\s|\d+[.)]\s|[A-Za-z][.)]\s)/u.test(line) ||
    /[:：]$/u.test(line.trim()) ||
    (/\p{L}/u.test(line) && line === line.toLocaleUpperCase("pt-PT"));
  const result = [];
  for (const block of normalized.split(/\n[\t ]*\n+/u)) {
    const lines = block
      .split("\n")
      .map((line) => line.replace(/[^\S\n]+/gu, " ").trim())
      .filter(Boolean);
    let prose = [];
    const flush = () => {
      if (!prose.length) return;
      const sentences = Array.from(segmenter.segment(prose.join(" ")), (part) =>
        part.segment.trim(),
      ).filter(Boolean);
      let group = [],
        count = 0;
      for (const sentence of sentences) {
        const length = sentence.split(/\s+/u).length;
        if (
          group.length &&
          (count + length > 40 ||
            group.join(" ").length + sentence.length > 250)
        ) {
          result.push(group.join(" "));
          group = [];
          count = 0;
        }
        group.push(sentence);
        count += length;
      }
      if (group.length) result.push(group.join(" "));
      prose = [];
    };
    for (const line of lines) {
      if (special(line)) {
        flush();
        result.push(line);
      } else prose.push(line);
    }
    flush();
  }
  return result.join("\n\n");
}
