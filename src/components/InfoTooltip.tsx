import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  className?: string;
  content?: string;
}

export default function InfoTooltip({ className = '', content = 'How is it calculated?' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  };

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 transition-colors cursor-help" />
      {visible && (
        <span className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl z-[100] pointer-events-none w-64 leading-relaxed">
          {content}
          <span className="absolute bottom-full left-3 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-900" />
        </span>
      )}
    </span>
  );
}
