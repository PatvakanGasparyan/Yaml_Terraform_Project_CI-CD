'use client';

import { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSettingsStore } from '@/stores';
import { getMonacoLanguage } from '@iac-platform/shared';
import type { FileFormat } from '@iac-platform/shared';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  format: FileFormat;
  onLineHover?: (line: number) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, format, onLineHover, readOnly }: CodeEditorProps) {
  const { editorFontSize, editorTheme } = useSettingsStore();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLine = useRef<number>(0);

  const handleLineHover = useCallback((line: number) => {
    if (!onLineHover || line === lastLine.current) return;
    lastLine.current = line;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => onLineHover(line), 400);
  }, [onLineHover]);

  return (
    <MonacoEditor
      height="100%"
      language={getMonacoLanguage(format)}
      value={value}
      theme={editorTheme}
      onChange={(v) => onChange(v || '')}
      options={{
        fontSize: editorFontSize,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        readOnly,
        automaticLayout: true,
        padding: { top: 16 },
      }}
      onMount={(editor) => {
        editor.onMouseMove((e) => {
          if (e.target.position) handleLineHover(e.target.position.lineNumber);
        });
      }}
    />
  );
}
