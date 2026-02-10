import { useState, useRef, useEffect } from 'react';
import { Settings, HelpCircle, LogOut, Sparkles } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface UserDropdownProps {
  onNavigate: (page: string) => void;
}

export default function UserDropdown({ onNavigate }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSettingsClick = () => {
    onNavigate('settings');
    setOpen(false);
  };

  const handleSignOut = () => {
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center rounded-full transition-all duration-200 ring-2 ring-transparent hover:ring-cx-200 ${
          open ? 'ring-cx-300' : ''
        }`}
      >
        <UserAvatar name="Demo User" size={32} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <UserAvatar name="Demo User" size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Demo User</p>
                <p className="text-xs text-gray-500 truncate">demo@clarisix.com</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cx-100 text-cx-700 rounded-full font-medium">
                <Sparkles className="w-3 h-3" />
                Pro Plan
              </span>
            </div>
          </div>

          <div className="py-1.5">
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Help & Support</span>
            </button>
          </div>

          <div className="border-t border-gray-100 py-1.5">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
