import { useState } from 'react';
import {
  AlertTriangle,
  Package,
  Megaphone,
  Star,
  FileText,
  ChevronRight,
  Bell,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { homeAlerts, type HomeAlert, type AlertSeverity, type AlertCategory } from '../data/dashboardData';

const severityConfig: Record<AlertSeverity, { dot: string; bg: string; border: string; icon: typeof AlertTriangle; iconColor: string }> = {
  critical: { dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-500' },
  warning: { dot: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' },
  info: { dot: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-500' },
};

const categoryIcon: Record<AlertCategory, typeof Package> = {
  inventory: Package,
  advertising: Megaphone,
  customer: Star,
  content: FileText,
};

interface HomeAlertsProps {
  onAlertClick?: (section: string, sub: string) => void;
}

export default function HomeAlerts({ onAlertClick }: HomeAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleAlerts = homeAlerts.filter((a) => !dismissed.has(a.id));
  const criticalCount = visibleAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter((a) => a.severity === 'warning').length;

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Action Items</h2>
            <p className="text-xs text-gray-500">
              {visibleAlerts.length === 0
                ? 'All clear — nothing needs attention'
                : `${criticalCount > 0 ? `${criticalCount} critical` : ''}${criticalCount > 0 && warningCount > 0 ? ', ' : ''}${warningCount > 0 ? `${warningCount} warning` : ''}`}
            </p>
          </div>
        </div>
        {visibleAlerts.length > 0 && (
          <span className="text-xs font-medium text-gray-400">{visibleAlerts.length} items</span>
        )}
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No action items right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {visibleAlerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onClick={onAlertClick}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertRow({
  alert,
  onClick,
  onDismiss,
}: {
  alert: HomeAlert;
  onClick?: (section: string, sub: string) => void;
  onDismiss: (e: React.MouseEvent, id: string) => void;
}) {
  const sev = severityConfig[alert.severity];
  const CategoryIcon = categoryIcon[alert.category];
  const SevIcon = sev.icon;

  return (
    <div
      onClick={onClick ? () => onClick(alert.navSection, alert.navSub) : undefined}
      className={`flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors ${onClick ? 'cursor-pointer' : ''} group`}
    >
      <div className={`w-7 h-7 rounded-lg ${sev.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <SevIcon className={`w-3.5 h-3.5 ${sev.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-gray-900">{alert.title}</span>
          <CategoryIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{alert.description}</p>
        <span className="text-[10px] text-gray-400 mt-1 block">{alert.timestamp}</span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 mt-1">
        <button
          onClick={(e) => onDismiss(e, alert.id)}
          className="text-[10px] font-medium text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
        >
          Dismiss
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </div>
  );
}
