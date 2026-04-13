"use client";

import { useState } from "react";
import { useSharedCalendars, useCalendarMembers } from "@/features/shared-calendars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Link2, Mail, X, Copy, Check } from "lucide-react";
import { cn } from "@/shared/utils";

interface ShareCalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  currentUserId: string;
}

export function ShareCalendarModal({
  open,
  onOpenChange,
  calendarId,
  calendarName,
  calendarColor,
  currentUserId,
}: ShareCalendarModalProps) {
  const { invite, changePermission, removeMember, isLoading } = useSharedCalendars(currentUserId);
  const { members } = useCalendarMembers(calendarId);
  
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit" | "admin">("view");
  const [inviteSent, setInviteSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/calendar/join/${btoa(calendarId)}`;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    await invite({
      calendarId,
      email,
      permission,
      invitedBy: currentUserId,
    });

    setEmail("");
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getPermissionLabel = (perm: string) => {
    switch (perm) {
      case "admin": return "Admin";
      case "edit": return "Can edit";
      case "view": return "Can view";
      default: return perm;
    }
  };

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case "admin": return "text-red-500 bg-red-50";
      case "edit": return "text-blue-500 bg-blue-50";
      case "view": return "text-gray-500 bg-gray-50";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: calendarColor }} />
            Share &quot;{calendarName}&quot;
          </DialogTitle>
          <DialogDescription>
            Invite others to view or collaborate on this calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Invite by email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "edit" | "admin")}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can view</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={!email || isLoading} className="w-full">
              {inviteSent ? "✓ Invitation sent" : "Send invitation"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or share via link</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyLink} className="flex-1">
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Link copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy link
                </>
              )}
            </Button>
          </div>

          {members && members.length > 0 && (
            <div className="space-y-2">
              <Label>People with access</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {members.map((member: Record<string, unknown>) => (
                  <div
                    key={member._id as string}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {(member.userName as string)?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.userName as string}</p>
                        <p className="text-xs text-muted-foreground">{member.userEmail as string}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-1 rounded-full", getPermissionColor(member.permission as string))}>
                        {getPermissionLabel(member.permission as string)}
                      </span>
                      {(member.permission as string) !== "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(calendarId, member.userId as string)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}