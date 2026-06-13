import type { PrismaClient, NotificationType, Role } from "@prisma/client";
import { sendNotificationEmail } from "./email/sendNotificationEmail";
import { sendPushToProfile } from "./push/sendPushNotification";

interface CreateNotificationInput {
  db: PrismaClient;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
}

export async function createNotification({
  db,
  recipientId,
  type,
  title,
  message,
  linkUrl,
}: CreateNotificationInput) {
  // Fetch recipient email for e-mail dispatch (single extra query, cached by Prisma)
  const recipient = await db.profile.findUnique({
    where: { id: recipientId },
    select: { email: true, fullName: true },
  });

  const notification = await db.notification.create({
    data: { recipientId, type, title, message, linkUrl: linkUrl ?? null },
  });

  if (recipient?.email) {
    void sendNotificationEmail({
      db,
      notificationId: notification.id,
      recipientEmail: recipient.email,
      recipientName: recipient.fullName,
      title,
      message,
      linkUrl,
    });
  }

  // Fire-and-forget push — never throws, handles expired endpoints automatically
  void sendPushToProfile(db, recipientId, {
    title,
    body: message,
    url: linkUrl ?? undefined,
    notificationId: notification.id,
    type: type as string,
  });

  return notification;
}

interface CreateForRolesInput {
  db: PrismaClient;
  roles: Role[];
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  excludeProfileId?: string;
}

export async function createNotificationsForRoles({
  db,
  roles,
  type,
  title,
  message,
  linkUrl,
  excludeProfileId,
}: CreateForRolesInput) {
  const profiles = await db.profile.findMany({
    where: {
      role: { in: roles },
      status: "ACTIVE",
      ...(excludeProfileId ? { NOT: { id: excludeProfileId } } : {}),
    },
    select: { id: true, email: true, fullName: true },
  });

  if (profiles.length === 0) return;

  // Create notifications individually so we have IDs for email dispatch
  await Promise.all(
    profiles.map(async (p) => {
      const notification = await db.notification.create({
        data: { recipientId: p.id, type, title, message, linkUrl: linkUrl ?? null },
      });
      void sendNotificationEmail({
        db,
        notificationId: notification.id,
        recipientEmail: p.email,
        recipientName: p.fullName,
        title,
        message,
        linkUrl,
      });
      void sendPushToProfile(db, p.id, {
        title,
        body: message,
        url: linkUrl ?? undefined,
        notificationId: notification.id,
        type: type as string,
      });
    })
  );
}

interface CreateForDepartmentInput {
  db: PrismaClient;
  departmentId: string;
  roles?: Role[];
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  excludeProfileId?: string;
}

export async function createNotificationsForDepartment({
  db,
  departmentId,
  roles,
  type,
  title,
  message,
  linkUrl,
  excludeProfileId,
}: CreateForDepartmentInput) {
  const profiles = await db.profile.findMany({
    where: {
      departmentId,
      status: "ACTIVE",
      ...(roles ? { role: { in: roles } } : {}),
      ...(excludeProfileId ? { NOT: { id: excludeProfileId } } : {}),
    },
    select: { id: true, email: true, fullName: true },
  });

  if (profiles.length === 0) return;

  await Promise.all(
    profiles.map(async (p) => {
      const notification = await db.notification.create({
        data: { recipientId: p.id, type, title, message, linkUrl: linkUrl ?? null },
      });
      void sendNotificationEmail({
        db,
        notificationId: notification.id,
        recipientEmail: p.email,
        recipientName: p.fullName,
        title,
        message,
        linkUrl,
      });
      void sendPushToProfile(db, p.id, {
        title,
        body: message,
        url: linkUrl ?? undefined,
        notificationId: notification.id,
        type: type as string,
      });
    })
  );
}

export async function notifyHrAdmins({
  db,
  type,
  title,
  message,
  linkUrl,
  excludeProfileId,
}: Omit<CreateForRolesInput, "roles">) {
  return createNotificationsForRoles({
    db,
    roles: ["ADMIN", "HR"],
    type,
    title,
    message,
    linkUrl,
    excludeProfileId,
  });
}

// Varsle verneombud og/eller HMS-ansvarlig for en lokasjon.
// Fallback til HR/ADMIN hvis ingen er satt.
export async function createNotificationsForLocation({
  db,
  locationId,
  type,
  title,
  message,
  linkUrl,
  excludeProfileId,
}: {
  db: PrismaClient;
  locationId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  excludeProfileId?: string;
}) {
  const location = await db.location.findUnique({
    where: { id: locationId },
    select: { safetyRepresentativeId: true, hseManagerId: true },
  });

  const recipientIds = new Set<string>();
  if (location?.safetyRepresentativeId) recipientIds.add(location.safetyRepresentativeId);
  if (location?.hseManagerId) recipientIds.add(location.hseManagerId);
  if (excludeProfileId) recipientIds.delete(excludeProfileId);

  if (recipientIds.size > 0) {
    await Promise.all(
      Array.from(recipientIds).map((id) =>
        createNotification({ db, recipientId: id, type, title, message, linkUrl })
      )
    );
  } else {
    // Ingen verneombud/HMS-ansvarlig satt – varsle HR/ADMIN som fallback
    await createNotificationsForRoles({ db, roles: ["ADMIN", "HR"], type, title, message, linkUrl, excludeProfileId });
  }
}

export async function notifyAllActive({
  db,
  type,
  title,
  message,
  linkUrl,
  excludeProfileId,
}: Omit<CreateForRolesInput, "roles">) {
  const profiles = await db.profile.findMany({
    where: {
      status: "ACTIVE",
      ...(excludeProfileId ? { NOT: { id: excludeProfileId } } : {}),
    },
    select: { id: true, email: true, fullName: true },
  });

  if (profiles.length === 0) return;

  await Promise.all(
    profiles.map(async (p) => {
      const notification = await db.notification.create({
        data: { recipientId: p.id, type, title, message, linkUrl: linkUrl ?? null },
      });
      void sendNotificationEmail({
        db,
        notificationId: notification.id,
        recipientEmail: p.email,
        recipientName: p.fullName,
        title,
        message,
        linkUrl,
      });
      void sendPushToProfile(db, p.id, {
        title,
        body: message,
        url: linkUrl ?? undefined,
        notificationId: notification.id,
        type: type as string,
      });
    })
  );
}
