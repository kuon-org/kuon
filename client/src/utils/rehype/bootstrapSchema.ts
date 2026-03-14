// utils/rehype/bootstrapSchema.ts
import { defaultSchema } from "rehype-sanitize";

export const bootstrapSafeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "button",
    "span",
    "section",
    "nav",
    "article",
    "i",
    "div",
    "h5",
    "h6",
    "p",
    "ul",
    "li",
  ],
  attributes: {
    ...defaultSchema.attributes,

    "*": [
      ...(defaultSchema.attributes?.["*"] || []),
      "class",
      "className",
      "style",
      "role",
      "id",
      "data*",
    ],

    blockquote: [
      // 既存...
      "className",
      "data-admonition",
      "data-admonition-title",
      "role",
      "aria-label",
      "id",
    ],
    span: [
      "className",
      "aria-hidden",
      // 必要なら 'style' を許可（インラインstyleを使わないなら省略OK）
      "style",
    ],

    a: [
      ...(defaultSchema.attributes?.a || []),
      "class",
      "className",
      "target",
      "rel",
      "data-bs-toggle",
      "data-bs-target",
      "data-bs-dismiss",
      "aria-expanded",
      "aria-controls",
    ],

    button: [
      ...(defaultSchema.attributes?.button || []),
      "type",
      "class",
      "className",
      "data-bs-toggle",
      "data-bs-target",
      "data-bs-dismiss",
    ],
  },

  protocols: {
    ...defaultSchema.protocols,
    href: [
      ...(defaultSchema.protocols?.href || []),
      "http",
      "https",
      "mailto",
      "tel",
    ],
  },
};
