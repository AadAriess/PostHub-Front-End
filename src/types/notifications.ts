// Tipe untuk User yang menjadi pemicu atau penerima notifikasi
export interface NotificationUser {
  id: string;
  firstName: string;
}

// Enum untuk Tipe Notifikasi yang sesuai dengan backend
export type NotificationType = "COMMENT" | "MENTION";

// Tipe Notifikasi
export interface Notification {
  id: string;
  type: NotificationType;
  recipient: NotificationUser;
  triggerer: NotificationUser;
}

// Tipe respons untuk query notifikasi
export interface GetNotificationsResponse {
  myNotifications: Notification[];
}
