import { useState } from 'react';
import {
  Mail,
  Lock,
  Smartphone,
  Monitor,
  MapPin,
  Clock,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';

type Modal = 'email' | 'password' | null;

const sessions = [
  {
    id: '1',
    device: 'Chrome on macOS',
    location: 'San Francisco, US',
    lastActive: 'Now (current)',
    current: true,
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    location: 'San Francisco, US',
    lastActive: '2 hours ago',
    current: false,
  },
  {
    id: '3',
    device: 'Firefox on Windows',
    location: 'New York, US',
    lastActive: '3 days ago',
    current: false,
  },
];

function ChangeEmailModal({ onClose }: { onClose: () => void }) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Change Email Address</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-lg transition-colors shadow-sm">
            Update Email
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
              />
              <button
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
              />
              <button
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-lg transition-colors shadow-sm">
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SecuritySection() {
  const [modal, setModal] = useState<Modal>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Account Credentials</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Update your email address and password
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          <button
            onClick={() => setModal('email')}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cx-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-cx-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Email Address</p>
                <p className="text-xs text-gray-500">alex.morgan@company.com</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>

          <button
            onClick={() => setModal('password')}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cx-50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-cx-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Password</p>
                <p className="text-xs text-gray-500">Last changed 30 days ago</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Two-Factor Authentication</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Add an extra layer of security to your account
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  twoFactorEnabled ? 'bg-green-50' : 'bg-gray-100'
                }`}
              >
                <Shield
                  className={`w-4 h-4 ${twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Authenticator App</p>
                <p className="text-xs text-gray-500">
                  {twoFactorEnabled
                    ? 'Two-factor authentication is enabled'
                    : 'Use an authentication app to generate one-time codes'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-green-800">2FA is active</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Your account is protected with two-factor authentication.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Active Sessions</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your logged-in devices
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  {session.device.includes('iPhone') ? (
                    <Smartphone className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Monitor className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {session.device}
                    {session.current && (
                      <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        Current
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.lastActive}
                    </span>
                  </div>
                </div>
              </div>
              {!session.current && (
                <button className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {modal === 'email' && <ChangeEmailModal onClose={() => setModal(null)} />}
      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} />}
    </div>
  );
}
