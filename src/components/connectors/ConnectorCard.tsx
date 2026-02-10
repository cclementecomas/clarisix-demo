import { Lock, ExternalLink, Check } from 'lucide-react';
import type { Connector } from '../../data/connectorsData';

interface ConnectorCardProps {
  connector: Connector;
}

export default function ConnectorCard({ connector }: ConnectorCardProps) {
  const { name, description, available, configured, iconBg, iconText, letter } = connector;

  return (
    <div
      className={`relative bg-white rounded-xl border transition-all duration-200 group ${
        available
          ? 'border-gray-200 hover:border-cx-300 hover:shadow-md hover:shadow-cx-500/5'
          : 'border-gray-100 opacity-70 hover:opacity-80'
      }`}
    >
      {!available && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500">
            <Lock className="w-2.5 h-2.5" />
            Coming Soon
          </span>
        </div>
      )}

      {configured && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-50 text-green-700">
            <Check className="w-2.5 h-2.5" />
            Connected
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg ${iconBg} ${iconText} flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-sm`}
          >
            {letter}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">{name}</h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          {available ? (
            <div className="flex items-center gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-cx-500 text-white hover:bg-cx-500 transition-colors shadow-sm">
                Configure
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Docs
              </button>
            </div>
          ) : (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed"
            >
              Not Available Yet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
