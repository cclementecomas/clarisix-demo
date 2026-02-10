import { Rocket, Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({
  title = "Coming Soon",
  description = "We're working hard to bring you this feature. Stay tuned for updates!"
}: ComingSoonProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-6">
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cx-100 to-cx-200 animate-pulse" style={{ transform: 'scale(1.5)' }} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cx-200 to-cx-300 animate-ping opacity-20" style={{ transform: 'scale(1.2)', animationDuration: '2s' }} />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cx-500 to-cx-600 flex items-center justify-center shadow-lg shadow-cx-500/30">
            <Rocket className="w-10 h-10 text-white animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h2>

        <p className="text-gray-500 mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cx-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-cx-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-cx-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
