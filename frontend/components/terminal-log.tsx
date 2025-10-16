"use client";

import * as React from "react";

type TerminalLogProps = {
  lines: string[];
  className?: string;
  height?: number;
};

export function TerminalLog({ lines, className, height = 280 }: TerminalLogProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [lines.length]);

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-border bg-black/60 font-[family:var(--font-jetbrains-mono)] text-[13px] leading-relaxed text-muted-foreground ${className ?? ""}`}
      style={{ height }}
    >
      <div className="h-full overflow-y-auto p-4">
        {lines.map((l, i) => (
          <pre key={i} className="whitespace-pre-wrap text-[13px]">
            {l}
          </pre>
        ))}
      </div>
    </div>
  );
}


