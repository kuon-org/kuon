import React, { type JSX, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { uuidv7 } from '../../utils/uuid';

type MermaidRendererProps = {
  code: string;
};

export const MermaidRenderer = React.memo(
  (props: MermaidRendererProps): JSX.Element => {
    const { code } = props;

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      (async () => {
        if (ref.current != null && code != null) {
          mermaid.initialize({});
          try {
            const id = `mermaid-${uuidv7()}`;
            const { svg } = await mermaid.render(id, code, ref.current);
            ref.current.innerHTML = svg;
          } catch (err) {
            console.error(err);
          }
        }
      })();
    }, [code]);

    return code ? (
      <div ref={ref} key={code}>
        {code}
      </div>
    ) : (
      <div key={code}></div>
    );
  },
);