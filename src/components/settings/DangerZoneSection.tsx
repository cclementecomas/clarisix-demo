import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DangerZoneSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const canDelete = confirmText === 'DELETE';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-900">Danger Zone</h2>
          </div>
          <p className="text-xs text-red-700/70 mt-0.5">
            Irreversible and destructive actions
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Delete Account</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md leading-relaxed">
                Permanently remove your account and all of its contents from the platform.
                This action is not reversible, so please continue with caution.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all flex-shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-slide-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Confirm Account Deletion</h3>
              </div>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800 leading-relaxed">
                  This will permanently delete your account, all connected data sources,
                  reports, and settings. This cannot be undone.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300/50 focus:border-red-300 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!canDelete}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  canDelete
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
