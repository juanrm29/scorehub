import { Info } from 'lucide-react';

export function InfoTooltip({ content }: { content: string }) {
  // If content contains actual \n or literal \n from JSX string, split it
  const lines = content.split(/\\n|\n/);

  return (
    <div className="group relative inline-flex items-center ml-1.5 align-middle cursor-help">
      <Info className="w-3.5 h-3.5 text-[#666] hover:text-blue-400 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#161622] border border-white/[0.08] rounded-xl text-[10px] text-white shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 text-left font-normal leading-relaxed">
        <div className="space-y-1.5">
          {lines.map((line, i) => {
            const isHeader = line.startsWith('5:') || line.startsWith('4:') || line.startsWith('3:') || line.startsWith('2:') || line.startsWith('1:');
            if (isHeader) {
              const score = line.substring(0, 2);
              const text = line.substring(2);
              return (
                <div key={i} className="flex gap-2 items-start">
                  <span className="font-bold text-blue-400 shrink-0">{score}</span>
                  <span className="text-[#ccc] mt-px">{text.trim()}</span>
                </div>
              );
            }
            return <div key={i} className="text-[#999]">{line}</div>;
          })}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161622]" />
      </div>
    </div>
  );
}
