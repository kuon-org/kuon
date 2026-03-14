import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import type { Plugin } from "unified";

export const rehypeBootstrapPlugin: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node: Element) => {
      const props = node.properties;
      if (!props) return;

      // クラス名の配列をスペース区切り文字列に強制結合
      const rawClass = props.className || props.class;
      if (rawClass) {
        props.className = Array.isArray(rawClass)
          ? rawClass.join(" ")
          : String(rawClass);
        delete props.class;
      }

      // Reactが dataBsToggle のように変換したものを data-bs-toggle に復元
      Object.keys(props).forEach((key) => {
        if (key.startsWith("dataBs")) {
          const kebabKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          props[kebabKey] = props[key];
        }
      });
    });
  };
};
