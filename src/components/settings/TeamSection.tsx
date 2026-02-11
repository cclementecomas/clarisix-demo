import { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  Check,
  ChevronDown,
  Mail,
  Clock,
  RotateCw,
  Trash2,
} from 'lucide-react';
import UserAvatar from '../UserAvatar';

type Role = 'Admin' | 'Editor' | 'Viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  isCurrentUser?: boolean;
}

interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  sentAgo: string;
}

const initialMembers: TeamMember[] = [
  { id: '1', name: 'Alex Morgan', email: 'alex.morgan@company.com', role: 'Admin', isCurrentUser: true },
  { id: '2', name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'Editor' },
  { id: '3', name: 'James Wilson', email: 'james.wilson@company.com', role: 'Viewer' },
  { id: '4', name: 'Maria Garcia', email: 'maria.garcia@company.com', role: 'Editor' },
];

const initialPendingInvites: PendingInvite[] = [
  { id: 'p1', email: 'david.lee@company.com', role: 'Viewer', sentAgo: '2 days ago' },
  { id: 'p2', email: 'emma.taylor@company.com', role: 'Editor', sentAgo: '5 days ago' },
];

const roleDescriptions: Record<Role, string> = {
  Admin: 'Full access to all features and settings',
  Editor: 'Can view and modify data, but not manage users',
  Viewer: 'Read-only access to dashboards and reports',
};

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    Admin: 'text-cx-700 bg-cx-50 border-cx-200',
    Editor: 'text-amber-700 bg-amber-50 border-amber-200',
    Viewer: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${styles[role]}`}>
      {role}
    </span>
  );
}

function RoleDropdown({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  const [open, setOpen] = useState(false);
  const roles: Role[] = ['Admin', 'Editor', 'Viewer'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <RoleBadge role={value} />
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[220px] animate-fade-slide-in">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => { onChange(role); setOpen(false); }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                  value === role ? 'bg-cx-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{role}</span>
                  {value === role && <Check className="w-3.5 h-3.5 text-cx-500" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{roleDescriptions[role]}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string, role: Role) => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Viewer');
  const [success, setSuccess] = useState(false);

  const isValid = email.includes('@') && email.includes('.');
  const roles: Role[] = ['Admin', 'Editor', 'Viewer'];

  const handleSubmit = () => {
    if (!isValid) return;
    setSuccess(true);
    onInvite(email, role);
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-slide-in" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Invitation Sent</h3>
              <p className="text-xs text-gray-500">
                An invitation has been sent to <span className="font-medium text-gray-700">{email}</span> as <RoleBadge role={role} />
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Invite Team Member</h3>
                <p className="text-xs text-gray-500 mt-0.5">Send an invitation to join your workspace</p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all duration-200 ${
                        role === r
                          ? 'border-cx-300 bg-cx-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${role === r ? 'text-cx-700' : 'text-gray-700'}`}>
                        {r}
                      </span>
                      <span className="text-[10px] text-gray-500 text-center leading-tight">
                        {roleDescriptions[r]}
                      </span>
                    </button>
                  ))}
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
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2 ${
                  isValid
                    ? 'text-white bg-cx-500 hover:bg-cx-600'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Send Invite
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeamSection() {
  const [members, setMembers] = useState(initialMembers);
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleRoleChange = (id: string, newRole: Role) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleInvite = (email: string, role: Role) => {
    setPendingInvites((prev) => [
      { id: `p${Date.now()}`, email, role, sentAgo: 'Just now' },
      ...prev,
    ]);
  };

  const handleRevokeInvite = (id: string) => {
    setPendingInvites((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Team Members</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {members.length} member{members.length !== 1 ? 's' : ''} in your workspace
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-lg transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-6 py-3.5 group">
              <div className="flex items-center gap-3">
                <UserAvatar name={member.name} size={36} />
                <div>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {member.name}
                    {member.isCurrentUser && (
                      <span className="text-[10px] font-semibold text-cx-700 bg-cx-50 border border-cx-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {member.isCurrentUser ? (
                  <RoleBadge role={member.role} />
                ) : (
                  <>
                    <RoleDropdown value={member.role} onChange={(role) => handleRoleChange(member.id, role)} />
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Pending Invitations</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pendingInvites.length} invitation{pendingInvites.length !== 1 ? 's' : ''} waiting to be accepted
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {invite.email}
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        Pending
                      </span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <RoleBadge role={invite.role} />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Sent {invite.sentAgo}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <RotateCw className="w-3 h-3" />
                    Resend
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
}
