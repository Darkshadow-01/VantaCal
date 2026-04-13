export interface SharedCalendar {
  _id: string;
  ownerId: string;
  name: string;
  color: string;
  description?: string;
  isDefault: boolean;
  permission: "view" | "edit" | "admin";
  isOwner: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CalendarShare {
  _id: string;
  calendarId: string;
  userId: string;
  permission: "view" | "edit" | "admin";
  addedAt: number;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export interface CalendarInvitation {
  _id: string;
  calendarId: string;
  email: string;
  permission: "view" | "edit" | "admin";
  status: "pending" | "accepted" | "declined";
  invitedBy: string;
  invitedAt: number;
  respondedAt?: number;
  calendarName?: string;
  calendarColor?: string;
  calendarDescription?: string;
}

export interface CreateCalendarInput {
  ownerId: string;
  name: string;
  color: string;
  description?: string;
  isDefault?: boolean;
}

export interface InviteToCalendarInput {
  calendarId: string;
  email: string;
  permission: "view" | "edit" | "admin";
  invitedBy: string;
}