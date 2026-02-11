import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareScoreModal from './ShareScoreModal';
import InfoTooltip from './InfoTooltip';

const SCORE = 74;
const RADIUS = 64;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ClarisixScore() {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [dashOffset, setDashOffset] = useState(CIRCUMFERENCE);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(SCORE);
      setDashOffset(CIRCUMFERENCE - (SCORE / 100) * CIRCUMFERENCE);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 67) return { stroke: '#16a34a', glow: 'rgba(22, 163, 74, 0.3)', text: 'text-green-600', label: 'Good' };
    if (score >= 33) return { stroke: '#ca8a04', glow: 'rgba(202, 138, 4, 0.3)', text: 'text-yellow-600', label: 'Average' };
    return { stroke: '#dc2626', glow: 'rgba(220, 38, 38, 0.3)', text: 'text-red-600', label: 'Needs Work' };
  };

  const colors = getScoreColor(SCORE);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Clarisix Score</h2>
            <InfoTooltip content="A single number (0-100) that reflects how ready your brand is to grow today." />
          </div>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:border-cx-300 hover:text-cx-700 hover:bg-cx-50 transition-all duration-200"
          >
            <Share2 className="w-3 h-3" />
            Share
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                stroke="#EEF2F6"
                strokeWidth={STROKE_WIDTH}
              />
              <circle
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-[1500ms] ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-4xl font-bold ${colors.text} tabular-nums`}>
                {animatedScore > 0 ? SCORE : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ShareScoreModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
