// utils/remarkLineNumber.ts
import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

export function remarkLineNumber() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.position && node.type !== 'root') {
        const line = node.position.start.line
        if (!node.data) node.data = {}
        if (!node.data.hProperties) node.data.hProperties = {}
        node.data.hProperties['data-line'] = line
      }
    })
  }
}
