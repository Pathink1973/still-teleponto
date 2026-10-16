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
      const segments = Array.from(segmenter.segment(prose.join(" ")), (part) =>
        part.segment.trim(),
      ).filter(Boolean);
      const sentences = [];
      for (const segment of segments) {
        const previous = sentences.at(-1);
        if (previous && /(?:\b(?:Sr|Sra|Srª|Dr|Dra|Drª|Prof|Profa|Eng|Arq|Exmo|Exma|Av|pág|vol|nº|etc)|\b\p{Lu})\.$/iu.test(previous)) {
          sentences[sentences.length - 1] = previous + " " + segment;
        } else sentences.push(segment);
      }
      // A paragraph per sentence gives a visible reading rhythm even for short text.
      for (const sentence of sentences) {
        // Prefer existing breathing points for long sentences. No words are rewritten.
        const clauses = sentence.split(/(?<=[,;:—–])\s+/u);
        let group = [];
        for (const clause of clauses) {
          group.push(clause);
          if (sentence.split(/\s+/u).length > 28 && group.join(" ").split(/\s+/u).length >= 12) {
            result.push(group.join(" "));
            group = [];
          }
        }
        if (group.length) result.push(group.join(" "));
      }
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
