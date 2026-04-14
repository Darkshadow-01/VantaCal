"use client";

import { useState, useEffect } from "react";
import {
  X,
  Link,
  Copy,
  Check,
  Mail,
  Users,
  Trash2,
  Clock,
  Shield,
  KeyRound,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type AccessLevel,
  getAccessRules,
  getAccessSummary,
  checkAccess,
  type AccessRule,
} from "@/lib/access-control";
import {
  generateCalendarLinkId,
  createCalendarLink,
  getAllLinksForCalendar,
  deleteCalendarLink,
  getLinkStats,
} from "@/lib/calendar-link";

interface CalendarSharing {
  calendarId: string;
  currentUserId: string;
  currentAccessLevel: AccessLevel;
  onMembersChange?: (members: AccessRule[]) => void;
  onLinkCreate?: (url: string) => void;
  onLinkDelete?: (linkKey: string) => void;
}

interface SharedMember {
  id: string;
  email: string;
  name?: string;
  accessLevel: AccessLevel;
  status: "pending" | "active";
}

export function SharingPanel({
  calendarId,
  currentUserId,
  currentAccessLevel,
  onMembersChange,
  onLinkCreate,
  onLinkDelete,
}: CalendarSharing) {
  const [activeTab, setActiveTab] = useState<"members" | "links" | "invites">(
    "members"
  );
  const [members, setMembers] = useState<SharedMember[]>([]);
  const [links, setLinks] = useState<
    Array<{
      id: string;
      linkKey: string;
      title?: string;
      accessLevel: "read" | "read-write";
      expiresAt?: number;
      maxUses?: number;
      useCount: number;
      createdAt: number;
    }>
  >([]);
  const [invites, setInvites] = useState<
    Array<{ id: string; email: string; accessLevel: AccessLevel; status: "pending" | "sent" }>
  >([]);

  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<AccessLevel>("read");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkExpires, setLinkExpires] = useState("");
  const [linkMaxUses, setLinkMaxUses] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showLinkOptions, setShowLinkOptions] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const rules = getAccessRules(calendarId);
    setMembers(
      rules.map((r) => ({
        id: r.principalId,
        email: r.principalId,
        accessLevel: r.accessLevel,
        status: "active" as const,
      }))
    );
    onMembersChange?.(rules);

    const calendarLinks = getAllLinksForCalendar(calendarId);
    setLinks(
      calendarLinks.map((l) => ({
        id: l.id,
        linkKey: l.linkKey,
        title: l.title,
        accessLevel: l.accessLevel,
        expiresAt: l.expiresAt,
        maxUses: l.maxUses,
        useCount: l.useCount,
        createdAt: l.createdAt,
      }))
    );
  }, [calendarId, onMembersChange]);

  const handleCopyLink = async (url: string, linkKey: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedLink(linkKey);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleCreateLink = async () => {
    const expiresAt = linkExpires
      ? new Date(linkExpires).getTime()
      : undefined;
    const maxUses = linkMaxUses ? parseInt(linkMaxUses, 10) : undefined;

    const link = await createCalendarLink(calendarId, "read", currentUserId, {
      expiresAt,
      maxUses,
      title: linkTitle || undefined,
      password: linkPassword || undefined,
    });

    setLinks((prev) => [
      ...prev,
      {
        id: link.config.id,
        linkKey: link.config.linkKey,
        title: link.config.title,
        accessLevel: link.config.accessLevel,
        expiresAt: link.config.expiresAt,
        maxUses: link.config.maxUses,
        useCount: 0,
        createdAt: link.config.createdAt,
      },
    ]);
    onLinkCreate?.(link.url);

    setLinkTitle("");
    setLinkPassword("");
    setLinkExpires("");
    setLinkMaxUses("");
    setShowLinkOptions(false);
  };

  const handleDeleteLink = async (linkKey: string) => {
    deleteCalendarLink(linkKey);
    setLinks((prev) => prev.filter((l) => l.linkKey !== linkKey));
    onLinkDelete?.(linkKey);
  };

  const handleAddMember = () => {
    if (!email || !email.includes("@")) return;

    const newMember: SharedMember = {
      id: email,
      email,
      accessLevel: permission,
      status: "active",
    };
    setMembers((prev) => [...prev, newMember]);
    setEmail("");
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  if (!isOpen) return null;

  const canManageMembers = currentAccessLevel === "admin" || currentAccessLevel === "write";

  return (
    <div className="bg-white dark:bg-[#1A1D24] rounded-xl border border-gray-200 dark:border-[#333] shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#333]">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sharing
          </h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-[#252830] rounded"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-[#333]">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 inline-block mr-2" />
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "links"
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Link className="w-4 h-4 inline-block mr-2" />
          Links ({links.length})
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "invites"
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Mail className="w-4 h-4 inline-block mr-2" />
          Invites ({invites.length})
        </button>
      </div>

      <div className="p-4">
        {activeTab === "members" && (
          <div className="space-y-4">
            {canManageMembers && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invite people
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white placeholder:text-gray-500 outline-none focus:border-stone-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={permission}
                      onChange={(e) =>
                        setPermission(e.target.value as AccessLevel)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white outline-none focus:border-stone-500"
                    >
                      <option value="read">Can view</option>
                      <option value="write">Can edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button onClick={handleAddMember} disabled={!email}>
                      Invite
                    </Button>
                  </div>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-1 border-t border-gray-200 dark:border-[#333]" />
                  <span className="flex-shrink-0 mx-4 text-gray-500 dark:text-gray-400 text-sm">
                    Current members
                  </span>
                  <div className="flex-1 border-t border-gray-200 dark:border-[#333]" />
                </div>
              </>
            )}

            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#252830] rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {member.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-[#333] rounded capitalize text-gray-600 dark:text-gray-400">
                        {member.accessLevel}
                      </span>
                      {canManageMembers && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No members yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-4">
            <div>
              <Button
                onClick={() => setShowLinkOptions(!showLinkOptions)}
                className="w-full"
              >
                <Link className="w-4 h-4 mr-2" />
                Create share link
              </Button>

              {showLinkOptions && (
                <div className="mt-4 space-y-3 p-4 bg-gray-50 dark:bg-[#252830] rounded-lg">
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Link title (optional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white placeholder:text-gray-500 outline-none focus:border-stone-500"
                  />
                  <input
                    type="password"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="Password protection (optional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white placeholder:text-gray-500 outline-none focus:border-stone-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      value={linkExpires}
                      onChange={(e) => setLinkExpires(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white outline-none focus:border-stone-500"
                    />
                    <input
                      type="number"
                      value={linkMaxUses}
                      onChange={(e) => setLinkMaxUses(e.target.value)}
                      placeholder="Max uses"
                      className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white placeholder:text-gray-500 outline-none focus:border-stone-500"
                    />
                  </div>
                  <Button onClick={handleCreateLink} className="w-full">
                    Generate Link
                  </Button>
                </div>
              )}
            </div>

            {links.length > 0 ? (
              <div className="space-y-2">
                {links.map((link) => {
                  const url = `${
                    typeof window !== "undefined"
                      ? window.location.origin
                      : ""
                  }/calendar/share/${link.linkKey}`;
                  return (
                    <div
                      key={link.id}
                      className="p-3 bg-gray-50 dark:bg-[#252830] rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {link.title || "Share link"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyLink(url, link.linkKey)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
                          >
                            {copiedLink === link.linkKey ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          {canManageMembers && (
                            <button
                              onClick={() => handleDeleteLink(link.linkKey)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                        {url}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {link.useCount} uses
                          {link.maxUses && ` / ${link.maxUses}`}
                        </span>
                        {link.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No share links yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "invites" && (
          <div className="space-y-4">
            {invites.length > 0 ? (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#252830] rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {invite.email}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded capitalize">
                      {invite.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending invites</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}