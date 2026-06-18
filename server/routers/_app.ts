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
import { whistleblowingRouter } from "./whistleblowing";
import { trainingRouter } from "./training";
import { chemicalRouter } from "./chemical";
import { dataRequestRouter } from "./dataRequest";
import { onboardingRouter } from "./onboarding";
import { reviewRouter } from "./review";
import { personnelCaseRouter } from "./personnelCase";
import { commentRouter } from "./comment";
import { contractRouter } from "./contract";
import { signatureRouter } from "./signature";
import { inspectionRouter } from "./inspection";
import { sickLeaveRouter } from "./sickLeave";
import { employmentRecordRouter } from "./employmentRecord";
import { announcementRouter } from "./announcement";

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
  whistleblowing: whistleblowingRouter,
  training: trainingRouter,
  chemical: chemicalRouter,
  dataRequest: dataRequestRouter,
  onboarding: onboardingRouter,
  review: reviewRouter,
  personnelCase: personnelCaseRouter,
  comment: commentRouter,
  contract: contractRouter,
  signature: signatureRouter,
  inspection: inspectionRouter,
  sickLeave: sickLeaveRouter,
  employmentRecord: employmentRecordRouter,
  announcement: announcementRouter,
});

export type AppRouter = typeof appRouter;
