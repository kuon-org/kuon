// src/utils/searchParser.ts

export interface SearchTerms {
  title?: string[];
  body?: string[];
  tags?: { name: string; exclude: boolean }[];
  user?: string;
  stocks?: { operator: "gt" | "lt" | "gte" | "lte"; value: number };
  created?: { operator: "gte" | "lte"; value: Date };
  updated?: { operator: "gte" | "lte"; value: Date };
  freeWords: string[]; // 接頭辞がない単語
}

export const parseSearchQuery = (q: string): SearchTerms => {
  const terms: SearchTerms = { freeWords: [], tags: [] };
  if (!q) return terms;

  // スペース（全角半角）で区切る
  const tokens = q.trim().split(/[\s　]+/);

  tokens.forEach((token) => {
    if (!token) return;

    // tag:Ruby,Rails (OR検索)
    if (token.startsWith("tag:")) {
      const val = token.replace("tag:", "");
      val
        .split(",")
        .forEach((t) => terms.tags?.push({ name: t, exclude: false }));
    }
    // -tag:Ruby (除外)
    else if (token.startsWith("-tag:")) {
      terms.tags?.push({ name: token.replace("-tag:", ""), exclude: true });
    }
    // title:Git
    else if (token.startsWith("title:")) {
      if (!terms.title) terms.title = [];
      terms.title.push(token.replace("title:", ""));
    }
    // body:Ruby
    else if (token.startsWith("body:")) {
      if (!terms.body) terms.body = [];
      terms.body.push(token.replace("body:", ""));
    }
    // user:hiroppeach
    else if (token.startsWith("user:")) {
      terms.user = token.replace("user:", "");
    }
    // stocks:>3
    else if (token.includes("stocks:")) {
      const match = token.match(/stocks:([><]=?)(\d+)/);
      if (match) {
        const [, op, val] = match;
        const operatorMap: any = {
          ">": "gt",
          "<": "lt",
          ">=": "gte",
          "<=": "lte",
        };
        terms.stocks = { operator: operatorMap[op], value: parseInt(val) };
      }
    }
    // created:>=2026-01-28
    else if (token.startsWith("created:")) {
      const match = token.match(/created:([><]=?)(.+)/);
      if (match) {
        const [, op, val] = match;
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          terms.created = {
            operator: op === ">=" ? "gte" : "lte",
            value: date,
          };
        }
      }
    } else if (token.startsWith("updated:")) {
      const match = token.match(/updated:([><]=?)(.+)/);
      if (match) {
        const [, op, val] = match;
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          terms.updated = {
            operator: op === ">=" ? "gte" : "lte",
            value: date,
          };
        }
      }
    }
    // 接頭辞なし
    else {
      terms.freeWords.push(token);
    }
  });

  return terms;
};
