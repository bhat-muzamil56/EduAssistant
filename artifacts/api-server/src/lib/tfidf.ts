function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  const total = tokens.length;
  for (const [term, count] of tf.entries()) {
    tf.set(term, count / total);
  }
  return tf;
}

function inverseDocumentFrequency(
  docs: string[][]
): Map<string, number> {
  const idf = new Map<string, number>();
  const N = docs.length;
  const allTerms = new Set(docs.flat());
  for (const term of allTerms) {
    const docsWithTerm = docs.filter((d) => d.includes(term)).length;
    idf.set(term, Math.log((N + 1) / (docsWithTerm + 1)) + 1);
  }
  return idf;
}

function tfidfVector(
  tokens: string[],
  idf: Map<string, number>
): Map<string, number> {
  const tf = termFrequency(tokens);
  const vec = new Map<string, number>();
  for (const [term, tfVal] of tf.entries()) {
    vec.set(term, tfVal * (idf.get(term) ?? 1));
  }
  return vec;
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, valA] of a.entries()) {
    const valB = b.get(term) ?? 0;
    dot += valA * valB;
    normA += valA * valA;
  }
  for (const [, valB] of b.entries()) {
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
}

export interface MatchResult {
  item: KnowledgeItem;
  score: number;
}

export function findBestMatch(
  query: string,
  knowledgeBase: KnowledgeItem[]
): MatchResult | null {
  if (knowledgeBase.length === 0) return null;

  const queryTokens = tokenize(query);
  const docTokens = knowledgeBase.map((item) =>
    tokenize(item.question + " " + item.answer)
  );
  const allDocs = [queryTokens, ...docTokens];
  const idf = inverseDocumentFrequency(allDocs);

  const queryVec = tfidfVector(queryTokens, idf);

  let bestScore = -1;
  let bestItem: KnowledgeItem | null = null;

  for (let i = 0; i < knowledgeBase.length; i++) {
    const docVec = tfidfVector(docTokens[i], idf);
    const score = cosineSimilarity(queryVec, docVec);
    if (score > bestScore) {
      bestScore = score;
      bestItem = knowledgeBase[i];
    }
  }

  if (!bestItem) return null;
  return { item: bestItem, score: bestScore };
}
