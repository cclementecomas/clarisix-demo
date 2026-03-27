import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  className?: string;
  content?: string;
  wide?: boolean;
}

export default function InfoTooltip({ className = '', content = 'How is it calculated?', wide = false }: InfoTooltipProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: rect.left });
    }
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setPos(null), 150);
  };

  const tooltipWidth = wide ? 320 : 240;

  return (
    <span
      ref={anchorRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 transition-colors cursor-help" />
      {pos && createPortal(
        <div
          className="fixed px-3 py-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none leading-relaxed whitespace-pre-line"
          style={{
            top: pos.top,
            left: Math.min(pos.left, window.innerWidth - tooltipWidth - 16),
            width: tooltipWidth,
            zIndex: 99999,
          }}
        >
          {content}
          <span className="absolute bottom-full left-3 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-900" />
        </div>,
        document.body
      )}
    </span>
  );
}
