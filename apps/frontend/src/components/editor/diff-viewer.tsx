'use client';

interface DiffViewerProps {
  diff: string;
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const lines = diff.split('\n');

  return (
    <div className="font-mono text-sm overflow-auto h-full bg-secondary/30 rounded-lg">
      {lines.map((line, i) => {
        let className = 'px-4 py-0.5';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          className += ' bg-green-500/20 text-green-700 dark:text-green-300';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          className += ' bg-red-500/20 text-red-700 dark:text-red-300';
        } else if (line.startsWith('@@')) {
          className += ' bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold';
        }
        return (
          <div key={i} className={className}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
