import { offlineStorage, type SharedCalendar, type SharedWithEntry, type CalendarPermission } from "./offline-storage";

export interface CalendarShareOptions {
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  email: string;
  permission: CalendarPermission;
}

class CollaborationService {
  private currentUserId: string = "local_user";
  private currentUserName: string = "You";

  setCurrentUser(userId: string, userName: string): void {
    this.currentUserId = userId;
    this.currentUserName = userName;
  }

  async shareCalendar(options: CalendarShareOptions): Promise<SharedWithEntry> {
    const invitation: SharedWithEntry = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      calendarId: options.calendarId,
      email: options.email.toLowerCase(),
      permission: options.permission,
      status: "pending",
      invitedAt: Date.now(),
    };

    await offlineStorage.inviteToCalendar(invitation);

    return invitation;
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    const sharedCalendar: SharedCalendar = {
      id: `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      calendarId: "",
      ownerId: this.currentUserId,
      ownerName: this.currentUserName,
      name: "",
      color: "#4F8DFD",
      permission: "view",
      accepted: true,
      createdAt: Date.now(),
    };

    await offlineStorage.updateInvitationStatus(invitationId, "accepted");
  }

  async declineInvitation(invitationId: string): Promise<void> {
    await offlineStorage.updateInvitationStatus(invitationId, "declined");
  }

  async getSharedCalendars(): Promise<SharedCalendar[]> {
    const all = await offlineStorage.getSharedCalendars();
    return all.filter(c => c.accepted);
  }

  async getPendingInvitations(): Promise<SharedWithEntry[]> {
    const calendars = await offlineStorage.getSharedCalendars();
    const pending: SharedWithEntry[] = [];
    
    for (const cal of calendars) {
      const invitations = await offlineStorage.getInvitations(cal.calendarId);
      pending.push(...invitations.filter(i => i.status === "pending"));
    }
    
    return pending;
  }

  async removeSharedCalendar(sharedCalendarId: string): Promise<void> {
    await offlineStorage.deleteSharedCalendar(sharedCalendarId);
  }

  async updatePermission(sharedCalendarId: string, permission: CalendarPermission): Promise<void> {
    const calendar = await offlineStorage.getSharedCalendarById(sharedCalendarId);
    if (calendar) {
      calendar.permission = permission;
      await offlineStorage.saveSharedCalendar(calendar);
    }
  }

  canEdit(permission: CalendarPermission): boolean {
    return permission === "edit" || permission === "admin";
  }

  canShare(permission: CalendarPermission): boolean {
    return permission === "admin";
  }

  canDelete(permission: CalendarPermission): boolean {
    return permission === "admin";
  }

  generateShareLink(calendarId: string): string {
    const token = btoa(`${calendarId}_${Date.now()}`);
    return `${typeof window !== "undefined" ? window.location.origin : ""}/calendar/join/${token}`;
  }

  async parseShareLink(token: string): Promise<{ calendarId: string } | null> {
    try {
      const decoded = atob(token);
      const [calendarId] = decoded.split("_");
      return { calendarId };
    } catch {
      return null;
    }
  }
}

export const collaborationService = new CollaborationService();
