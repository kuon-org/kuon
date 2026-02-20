import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

interface FastEditorProps {
  value: string;
  onChange: (text: string) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  placeholder?: string;
}

export interface FastEditorRef {
  setValue: (text: string) => void;
  getValue: () => string;
}

const FastEditor = forwardRef<FastEditorRef, FastEditorProps>(
  ({ value, onChange, onScroll, placeholder }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // 外部（Prettierなど）からの変更をDOMに反映
    useEffect(() => {
      if (editorRef.current && editorRef.current.innerText !== value) {
        editorRef.current.innerText = value;
      }
    }, [value]);

    useImperativeHandle(ref, () => ({
      setValue: (text: string) => {
        if (editorRef.current) editorRef.current.innerText = text;
      },
      getValue: () => editorRef.current?.innerText || '',
    }));

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const text = e.currentTarget.innerText;
      onChange(text);
    };

    return (
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onScroll={onScroll}
        spellCheck={false}
        data-placeholder={placeholder}
        style={{
          width: '100%',
          height: '100%',
          padding: '16px',
          overflowY: 'auto',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: '"Roboto Mono", "Fira Code", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          backgroundColor: 'transparent',
          color: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    );
  }
);

FastEditor.displayName = 'FastEditor';
export default FastEditor;