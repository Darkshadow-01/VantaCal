"use client";

import { useState } from "react";
import { X, Link, Copy, Check, Mail, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SharedUser {
  email: string;
  permission: "view" | "edit";
}

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUsers: SharedUser[];
  onAddUser: (email: string, permission: "view" | "edit") => void;
  onRemoveUser: (email: string) => void;
  onGenerateLink: () => string;
}

export function ShareCalendarModal({ 
  isOpen, 
  onClose, 
  sharedUsers: propSharedUsers,
  onAddUser,
  onRemoveUser,
  onGenerateLink
}: ShareCalendarModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [localUsers, setLocalUsers] = useState<SharedUser[]>([]);

  const sharedUsers = [...propSharedUsers, ...localUsers];

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const link = onGenerateLink();
    await navigator.clipboard.writeText(link);
    setShareLink(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddUser = () => {
    if (email && email.includes("@")) {
      setLocalUsers([...localUsers, { email, permission }]);
      onAddUser(email, permission);
      setEmail("");
    }
  };

  const handleRemoveUser = (email: string, isLocal: boolean) => {
    if (isLocal) {
      setLocalUsers(localUsers.filter(u => u.email !== email));
    } else {
      onRemoveUser(email);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1A1D24] rounded-xl w-full max-w-md border border-gray-200 dark:border-[#333] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#333]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Calendar
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-[#252830] rounded">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Share via link
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Anyone with the link can view your calendar
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252830] transition-colors text-gray-700 dark:text-gray-300"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-gray-200 dark:border-[#333]" />
            <span className="flex-shrink-0 mx-4 text-gray-500 dark:text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-[#333]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite people by email
            </label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white placeholder:text-gray-500 outline-none focus:border-[#5B8DEF]"
                />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as "view" | "edit")}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white outline-none focus:border-[#5B8DEF]"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
              <Button onClick={handleAddUser} disabled={!email}>
                Add
              </Button>
            </div>

            {sharedUsers.length > 0 && (
              <div className="space-y-2 mt-4">
                {sharedUsers.map((user, index) => {
                  const isLocal = index >= propSharedUsers.length;
                  return (
                    <div key={isLocal ? `local-${index}` : user.email} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#252830] rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.permission}</span>
                        <button onClick={() => handleRemoveUser(user.email, isLocal)} className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded">
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}