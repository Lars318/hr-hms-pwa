import { router } from "@/server/trpc/trpc";
import { profileRouter } from "./profile";
import { departmentRouter } from "./department";
import { incidentRouter } from "./incident";
import { attachmentRouter } from "./attachment";
import { documentRouter } from "./document";
import { riskAssessmentRouter } from "./riskAssessment";
import { riskItemRouter } from "./riskItem";
import { actionRouter } from "./action";
import { dashboardRouter } from "./dashboard";
import { notificationRouter } from "./notification";
import { leaveRequestRouter } from "./leaveRequest";
import { reportRouter } from "./report";
import { pushRouter } from "./push";
import { handbookRouter } from "./handbook";
import { locationRouter } from "./location";
import { profileAssignmentRouter } from "./profileAssignment";
import { overtimeRouter } from "./overtime";

export const appRouter = router({
  profile: profileRouter,
  department: departmentRouter,
  incident: incidentRouter,
  attachment: attachmentRouter,
  document: documentRouter,
  riskAssessment: riskAssessmentRouter,
  riskItem: riskItemRouter,
  action: actionRouter,
  dashboard: dashboardRouter,
  notification: notificationRouter,
  leaveRequest: leaveRequestRouter,
  report: reportRouter,
  push: pushRouter,
  handbook: handbookRouter,
  location: locationRouter,
  profileAssignment: profileAssignmentRouter,
  overtime: overtimeRouter,
});

export type AppRouter = typeof appRouter;
