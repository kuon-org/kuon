import plantuml from "@akebifiky/remark-simple-plantuml";
import urljoin from "url-join";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { Code } from "mdast";

interface RemarkPlantUMLOptions {
  plantumlUri: string;
}

export const remarkPlantUML: Plugin<[RemarkPlantUMLOptions]> = (options) => {
  const { plantumlUri } = options;
  const baseUrl = urljoin(plantumlUri, "/svg");
  const simplePlantumlPlugin = plantuml.bind(this)({ baseUrl });

  return (tree, file) => {
    visit(tree, "code", (node: Code) => {
      if (node.lang === "plantuml") {
        node.value = `\n${node.value}`;
      }
    });

    simplePlantumlPlugin(tree, file);
  };
};
