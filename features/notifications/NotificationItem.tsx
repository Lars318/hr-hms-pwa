import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  ShieldAlert, Zap, FileText, ShieldCheck, Bell,
  CheckCircle2, CalendarDays, BookOpen, Clock, AlertTriangle,
} from "lucide-react";
import type { NotificationType } from "@prisma/client";

const TYPE_ICONS: Record<NotificationType, ElementType> = {
  INCIDENT_CREATED: ShieldAlert,
  INCIDENT_ASSIGNED: ShieldAlert,
  INCIDENT_STATUS_CHANGED: ShieldAlert,
  ACTION_ASSIGNED: Zap,
  ACTION_DUE_SOON: Zap,
  ACTION_OVERDUE: Zap,
  DOCUMENT_REQUIRES_READ: FileText,
  DOCUMENT_EXPIRING: FileText,
  RISK_REVIEW_DUE: ShieldCheck,
  LEAVE_REQUEST_CREATED: CalendarDays,
  LEAVE_REQUEST_APPROVED: CalendarDays,
  LEAVE_REQUEST_REJECTED: CalendarDays,
  LEAVE_REQUEST_CANCELLED: CalendarDays,
  HANDBOOK_PUBLISHED: BookOpen,
  OVERTIME_SUBMITTED: Clock,
  OVERTIME_APPROVED: Clock,
  OVERTIME_REJECTED: Clock,
  SYSTEM: Bell,
  WHISTLEBLOWING_RECEIVED: AlertTriangle,
  TRAINING_EXPIRING_SOON: Clock,
  TRAINING_OVERDUE: AlertTriangle,
  CHEMICAL_REVIEW_DUE: AlertTriangle,
  DATA_REQUEST_RECEIVED: FileText,
  DATA_REQUEST_COMPLETED: CheckCircle2,
  ONBOARDING_TASK_ASSIGNED: CheckCircle2,
  OFFBOARDING_TASK_ASSIGNED: CheckCircle2,
  ONBOARDING_COMPLETED: CheckCircle2,
  OFFBOARDING_COMPLETED: CheckCircle2,
  REVIEW_SCHEDULED: CalendarDays,
  REVIEW_COMPLETED: CheckCircle2,
  PERSONNEL_CASE_OPENED: AlertTriangle,
  PERSONNEL_CASE_CLOSED: CheckCircle2,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  INCIDENT_CREATED: "text-red-600",
  INCIDENT_ASSIGNED: "text-orange-600",
  INCIDENT_STATUS_CHANGED: "text-blue-600",
  ACTION_ASSIGNED: "text-purple-600",
  ACTION_DUE_SOON: "text-yellow-600",
  ACTION_OVERDUE: "text-red-600",
  DOCUMENT_REQUIRES_READ: "text-blue-600",
  DOCUMENT_EXPIRING: "text-yellow-600",
  RISK_REVIEW_DUE: "text-orange-600",
  LEAVE_REQUEST_CREATED: "text-teal-600",
  LEAVE_REQUEST_APPROVED: "text-green-600",
  LEAVE_REQUEST_REJECTED: "text-red-600",
  LEAVE_REQUEST_CANCELLED: "text-slate-600",
  HANDBOOK_PUBLISHED: "text-emerald-600",
  OVERTIME_SUBMITTED: "text-blue-600",
  OVERTIME_APPROVED: "text-green-600",
  OVERTIME_REJECTED: "text-red-600",
  SYSTEM: "text-slate-600",
  WHISTLEBLOWING_RECEIVED: "text-amber-600",
  TRAINING_EXPIRING_SOON: "text-yellow-600",
  TRAINING_OVERDUE: "text-red-600",
  CHEMICAL_REVIEW_DUE: "text-orange-600",
  DATA_REQUEST_RECEIVED: "text-blue-600",
  DATA_REQUEST_COMPLETED: "text-green-600",
  ONBOARDING_TASK_ASSIGNED: "text-teal-600",
  OFFBOARDING_TASK_ASSIGNED: "text-slate-600",
  ONBOARDING_COMPLETED: "text-green-600",
  OFFBOARDING_COMPLETED: "text-slate-600",
  REVIEW_SCHEDULED: "text-blue-600",
  REVIEW_COMPLETED: "text-green-600",
  PERSONNEL_CASE_OPENED: "text-red-600",
  PERSONNEL_CASE_CLOSED: "text-slate-600",
};

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}

interface NotificationItemProps {
  notification: NotificationData;
  onRead?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({ notification: n, onRead, compact }: NotificationItemProps) {
  const Icon = TYPE_ICONS[n.type] ?? Bell;
  const iconColor = TYPE_COLORS[n.type] ?? "text-slate-600";
  const isUnread = !n.readAt;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        isUnread ? "bg-blue-50/60" : "bg-transparent",
        n.linkUrl && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={() => {
        if (onRead && isUnread) onRead(n.id);
      }}
    >
      <div className={cn("mt-0.5 shrink-0", iconColor)}>
        <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium leading-tight", isUnread && "text-foreground")}>
            {n.title}
          </p>
          {isUnread && (
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}
        </div>
        <p className={cn("text-xs text-muted-foreground mt-0.5", compact ? "line-clamp-1" : "line-clamp-2")}>
          {n.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {format(new Date(n.createdAt), "d. MMM, HH:mm", { locale: nb })}
        </p>
      </div>
    </div>
  );
}
