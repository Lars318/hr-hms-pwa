import { router, profileProcedure } from "@/server/trpc/trpc";
import type { ActionStatus } from "@prisma/client";

type FeedEvent = {
  id: string;
  type: "incident" | "action" | "leave" | "document" | "inspection";
  title: string;
  description: string;
  href: string;
  createdAt: Date;
  actor?: string;
};

export const dashboardRouter = router({
  // ── myTasks – samlet todo-liste for innlogget bruker ─────────────────────
  myTasks: profileProcedure.query(async ({ ctx }) => {
    const { profile, db } = ctx;
    const now = new Date();

    const [actions, signatures, inspections] = await Promise.all([
      db.action.findMany({
        where: { assignedToId: profile.id, status: { notIn: ["DONE", "CANCELLED"] } },
        select: { id: true, title: true, priority: true, dueDate: true, status: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 10,
      }),
      db.signatureRequest.findMany({
        where: { signerId: profile.id, signedAt: null },
        select: { id: true, contractId: true, contract: { select: { title: true } } },
        take: 5,
      }),
      db.inspectionRecord.findMany({
        where: { performedById: profile.id, status: "IN_PROGRESS" },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    type Task = { id: string; type: "action" | "signature" | "inspection"; title: string; href: string; overdue: boolean; priority?: string };
    const tasks: Task[] = [
      ...actions.map((a) => ({
        id: a.id,
        type: "action" as const,
        title: a.title,
        href: `/tiltak/${a.id}`,
        overdue: !!a.dueDate && a.dueDate < now,
        priority: a.priority,
      })),
      ...signatures.map((s) => ({
        id: s.id,
        type: "signature" as const,
        title: `Signer: ${s.contract.title}`,
        href: `/kontrakter`,
        overdue: false,
      })),
      ...inspections.map((r) => ({
        id: r.id,
        type: "inspection" as const,
        title: r.title,
        href: `/hms-runde/${r.id}`,
        overdue: false,
      })),
    ];

    return tasks;
  }),

  // ── activityFeed – siste hendelser på tvers ──────────────────────────────
  activityFeed: profileProcedure.query(async ({ ctx }) => {
    const { profile, db } = ctx;
    const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
    const isManager = profile.role === "MANAGER";
    const deptId = profile.departmentId;

    const incidentWhere = isHrAdmin ? {} : isManager && deptId ? { departmentId: deptId } : { reportedById: profile.id };
    const actionWhere = isHrAdmin ? {} : isManager && deptId ? { OR: [{ departmentId: deptId }, { assignedToId: profile.id }] } : { assignedToId: profile.id };
    const leaveWhere = isHrAdmin ? {} : isManager && deptId ? { departmentId: deptId } : { employeeId: profile.id };
    const inspectionWhere = isHrAdmin ? {} : { performedById: profile.id };

    const [incidents, actions, leaves, inspections] = await Promise.all([
      db.incident.findMany({
        where: incidentWhere,
        select: { id: true, title: true, severity: true, status: true, createdAt: true, reportedBy: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.action.findMany({
        where: actionWhere,
        select: { id: true, title: true, status: true, priority: true, createdAt: true, assignedTo: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.leaveRequest.findMany({
        where: leaveWhere,
        select: { id: true, type: true, status: true, startDate: true, createdAt: true, employee: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.inspectionRecord.findMany({
        where: inspectionWhere,
        select: { id: true, title: true, status: true, createdAt: true, performedBy: { select: { fullName: true } }, template: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const events: FeedEvent[] = [
      ...incidents.map((i) => ({
        id: i.id,
        type: "incident" as const,
        title: i.title,
        description: `Avvik · ${i.severity} · ${i.status}`,
        href: `/avvik/${i.id}`,
        createdAt: i.createdAt,
        actor: i.reportedBy.fullName,
      })),
      ...actions.map((a) => ({
        id: a.id,
        type: "action" as const,
        title: a.title,
        description: `Tiltak · ${a.priority} · ${a.status}`,
        href: `/tiltak/${a.id}`,
        createdAt: a.createdAt,
        actor: a.assignedTo?.fullName,
      })),
      ...leaves.map((l) => ({
        id: l.id,
        type: "leave" as const,
        title: `${l.employee.fullName} – ${l.type.toLowerCase()}`,
        description: `Fravær · ${l.status}`,
        href: `/fravaer`,
        createdAt: l.createdAt,
        actor: l.employee.fullName,
      })),
      ...inspections.map((r) => ({
        id: r.id,
        type: "inspection" as const,
        title: r.title,
        description: `HMS-runde · ${r.template.title} · ${r.status === "COMPLETED" ? "Fullført" : r.status === "IN_PROGRESS" ? "Pågående" : "Avbrutt"}`,
        href: `/hms-runde/${r.id}`,
        createdAt: r.createdAt,
        actor: r.performedBy.fullName,
      })),
    ];

    events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return events.slice(0, 15);
  }),

  // ── summary – alle aggregerte tall i ett kall ──────────────────────────────
  summary: profileProcedure.query(async ({ ctx }) => {
    const { profile, db } = ctx;
    const role = profile.role;
    const isHrAdmin = role === "ADMIN" || role === "HR";
    const isManager = role === "MANAGER";
    const deptId = profile.departmentId;
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ── Incident filters ───────────────────────────────────────────────────
    const incidentWhere =
      isHrAdmin ? {}
      : isManager && deptId ? { departmentId: deptId }
      : { reportedById: profile.id };

    const [
      openIncidents,
      criticalIncidents,
      inProgressIncidents,
      recentIncidents,
      incidentsBySeverity,
    ] = await Promise.all([
      db.incident.count({ where: { ...incidentWhere, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      db.incident.count({ where: { ...incidentWhere, severity: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.incident.count({ where: { ...incidentWhere, status: "IN_PROGRESS" } }),
      db.incident.findMany({
        where: incidentWhere,
        include: {
          reportedBy: { select: { id: true, fullName: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.incident.groupBy({
        by: ["severity"],
        where: { ...incidentWhere, status: { notIn: ["RESOLVED", "CLOSED"] } },
        _count: { severity: true },
      }),
    ]);

    // ── Action filters ─────────────────────────────────────────────────────
    const actionWhere =
      isHrAdmin ? {}
      : isManager && deptId
        ? { OR: [{ departmentId: deptId }, { assignedToId: profile.id }] }
        : { assignedToId: profile.id };

    const excludedStatuses: ActionStatus[] = ["DONE", "CANCELLED"];
    const myActionWhere = { assignedToId: profile.id, status: { notIn: excludedStatuses } };

    const [
      openActions,
      overdueActions,
      dueSoonActions,
      myActions,
      actionsByStatus,
    ] = await Promise.all([
      db.action.count({ where: { ...actionWhere, status: "OPEN" } }),
      db.action.count({ where: { ...actionWhere, dueDate: { lt: now }, status: { notIn: ["DONE", "CANCELLED"] } } }),
      db.action.count({ where: { ...actionWhere, dueDate: { gte: now, lte: in7 }, status: { notIn: ["DONE", "CANCELLED"] } } }),
      db.action.findMany({
        where: myActionWhere,
        include: { department: { select: { id: true, name: true } } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
      }),
      db.action.groupBy({
        by: ["status"],
        where: actionWhere,
        _count: { status: true },
      }),
    ]);

    // ── Risk filters ───────────────────────────────────────────────────────
    const riskWhere =
      isHrAdmin ? {}
      : (isManager || role === "EMPLOYEE") && deptId ? { departmentId: deptId }
      : { id: { in: [] as string[] } };

    const [
      activeAssessments,
      reviewSoonAssessments,
      criticalHighItems,
    ] = await Promise.all([
      db.riskAssessment.count({ where: { ...riskWhere, status: "ACTIVE" } }),
      db.riskAssessment.count({ where: { ...riskWhere, status: { in: ["ACTIVE", "REVIEW"] }, reviewDate: { lte: in30 } } }),
      db.riskItem.count({
        where: {
          riskLevel: { in: ["HIGH", "CRITICAL"] },
          status: { not: "RESOLVED" },
          ...(isHrAdmin ? {} : deptId ? { assessment: { departmentId: deptId } } : { id: { in: [] as string[] } }),
        },
      }),
    ]);

    // Top-risk assessment: highest unresolved critical/high item count
    const topRiskAssessment = await db.riskAssessment.findFirst({
      where: { ...riskWhere, status: "ACTIVE" },
      include: {
        _count: { select: { riskItems: true } },
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Document filters ───────────────────────────────────────────────────
    const docVisibility = isHrAdmin ? {} : { visibility: "PUBLIC" as const };

    const [
      expiringDocuments,
      unconfirmedDocuments,
    ] = await Promise.all([
      db.document.count({ where: { ...docVisibility, expiresAt: { lte: in30 } } }),
      db.document.findMany({
        where: {
          ...docVisibility,
          NOT: {
            readConfirmations: {
              some: { profileId: profile.id },
            },
          },
        },
        select: { id: true, title: true, version: true, category: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // ── Handbook: mangler lesing ───────────────────────────────────────────
    const latestHandbookVersion = await db.handbookVersion.findFirst({
      orderBy: { version: "desc" },
      select: { id: true, version: true },
    });

    let handbookStats: { version: number | null; unreadCount: number; hasRead: boolean } = {
      version: null,
      unreadCount: 0,
      hasRead: true,
    };

    if (latestHandbookVersion) {
      const myAck = await db.handbookAcknowledgement.findUnique({
        where: {
          versionId_profileId: {
            versionId: latestHandbookVersion.id,
            profileId: profile.id,
          },
        },
      });

      let unreadCount = 0;
      if (isHrAdmin) {
        const totalActive = await db.profile.count({ where: { status: "ACTIVE" } });
        const readCount = await db.handbookAcknowledgement.count({
          where: { versionId: latestHandbookVersion.id },
        });
        unreadCount = totalActive - readCount;
      }

      handbookStats = {
        version: latestHandbookVersion.version,
        unreadCount,
        hasRead: !!myAck,
      };
    }

    // ── Rolle-spesifikke sub-objekter ─────────────────────────────────────

    // EMPLOYEE
    let employeeDash: { pendingLeave: number; upcomingApprovedLeave: number } | null = null;
    let employeeProfileHome: {
      profile: {
        id: string; fullName: string; email: string; phone: string | null;
        title: string | null; avatarUrl: string | null; employedAt: Date;
      };
      manager: { id: string; fullName: string; title: string | null } | null;
      department: { id: string; name: string } | null;
      assignments: {
        id: string; isPrimary: boolean; roleLabel: string | null;
        location: { id: string; name: string; city: string | null };
        department: { id: string; name: string } | null;
      }[];
      counts: {
        openActions: number; overdueActions: number;
        openIncidents: number; pendingLeave: number;
        unconfirmedDocs: number;
      };
      handbookStatus: { version: number | null; hasRead: boolean };
      todoItems: {
        type: "action" | "incident" | "document" | "handbook" | "leave";
        id: string; title: string; description: string; href: string;
      }[];
      recentIncidents: { id: string; title: string; status: string; severity: string; createdAt: Date }[];
      recentActions: { id: string; title: string; status: string; priority: string; dueDate: Date | null }[];
      recentLeave: { id: string; type: string; status: string; startDate: Date; endDate: Date }[];
      unconfirmedDocs: { id: string; title: string; version: number; category: string }[];
    } | null = null;

    if (role === "EMPLOYEE") {
      const [
        pendingLeave, upcomingApprovedLeave,
        myOpenActions, myOverdueActions,
        myOpenIncidents,
        myUnconfirmedDocs,
        myRecentIncidents,
        myRecentActions,
        myRecentLeave,
      ] = await Promise.all([
        db.leaveRequest.count({ where: { employeeId: profile.id, status: "PENDING" } }),
        db.leaveRequest.count({ where: { employeeId: profile.id, status: "APPROVED", startDate: { gte: now } } }),
        db.action.count({ where: { assignedToId: profile.id, status: { notIn: ["DONE", "CANCELLED"] as const } } }),
        db.action.count({ where: { assignedToId: profile.id, status: { notIn: ["DONE", "CANCELLED"] as const }, dueDate: { lt: now } } }),
        db.incident.count({ where: { reportedById: profile.id, status: { notIn: ["RESOLVED", "CLOSED"] as const } } }),
        db.document.findMany({
          where: {
            visibility: "PUBLIC",
            NOT: { readConfirmations: { some: { profileId: profile.id } } },
          },
          select: { id: true, title: true, version: true, category: true },
          take: 5,
          orderBy: { updatedAt: "desc" },
        }),
        db.incident.findMany({
          where: { reportedById: profile.id },
          select: { id: true, title: true, status: true, severity: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        db.action.findMany({
          where: { assignedToId: profile.id, status: { notIn: ["DONE", "CANCELLED"] as const } },
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
          orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
          take: 3,
        }),
        db.leaveRequest.findMany({
          where: { employeeId: profile.id },
          select: { id: true, type: true, status: true, startDate: true, endDate: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
      ]);

      employeeDash = { pendingLeave, upcomingApprovedLeave };

      // Hent avdeling, leder og tilhørigheter parallelt
      const [dept, myManager, myAssignments] = await Promise.all([
        profile.departmentId
          ? db.department.findUnique({ where: { id: profile.departmentId }, select: { id: true, name: true } })
          : Promise.resolve(null),
        profile.managerId
          ? db.profile.findUnique({ where: { id: profile.managerId }, select: { id: true, fullName: true, title: true } })
          : Promise.resolve(null),
        db.profileAssignment.findMany({
          where: { profileId: profile.id, endDate: null },
          include: {
            location: { select: { id: true, name: true, city: true } },
            department: { select: { id: true, name: true } },
          },
          orderBy: [{ isPrimary: "desc" }, { startDate: "asc" }],
        }),
      ]);

      // Bygg todo-lista
      type TodoItem = { type: "action" | "incident" | "document" | "handbook" | "leave"; id: string; title: string; description: string; href: string };
      const todoItems: TodoItem[] = [];

      if (myUnconfirmedDocs.length > 0) {
        todoItems.push({
          type: "document",
          id: "docs",
          title: `${myUnconfirmedDocs.length} dokument${myUnconfirmedDocs.length > 1 ? "er" : ""} mangler lesebekreftelse`,
          description: "Du må bekrefte at du har lest disse dokumentene",
          href: "/dokumenter",
        });
      }

      if (!handbookStats.hasRead && handbookStats.version !== null) {
        todoItems.push({
          type: "handbook",
          id: "handbook",
          title: "Personalhåndbok må bekreftes",
          description: `Versjon ${handbookStats.version} er publisert og venter på din bekreftelse`,
          href: "/personalhandbok",
        });
      }

      if (myOverdueActions > 0) {
        todoItems.push({
          type: "action",
          id: "overdue-actions",
          title: `${myOverdueActions} tiltak er forfalt`,
          description: "Du har tiltak som har passert fristen",
          href: "/tiltak",
        });
      }

      if (pendingLeave > 0) {
        todoItems.push({
          type: "leave",
          id: "pending-leave",
          title: `${pendingLeave} fraværssøknad${pendingLeave > 1 ? "er" : ""} venter`,
          description: "Søknaden din er til behandling",
          href: "/fravaer",
        });
      }

      employeeProfileHome = {
        profile: {
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          title: profile.title,
          avatarUrl: profile.avatarUrl,
          employedAt: profile.employedAt,
        },
        manager: myManager,
        department: dept,
        assignments: myAssignments,
        counts: {
          openActions: myOpenActions,
          overdueActions: myOverdueActions,
          openIncidents: myOpenIncidents,
          pendingLeave,
          unconfirmedDocs: myUnconfirmedDocs.length,
        },
        handbookStatus: { version: handbookStats.version, hasRead: handbookStats.hasRead },
        todoItems,
        recentIncidents: myRecentIncidents,
        recentActions: myRecentActions,
        recentLeave: myRecentLeave,
        unconfirmedDocs: myUnconfirmedDocs,
      };
    }

    // MANAGER
    let managerDash: { pendingLeaveInDept: number; deptEmployeeCount: number; pendingOvertimeInDept: number } | null = null;
    if (isManager && deptId) {
      const [pendingLeaveInDept, deptEmployeeCount, pendingOvertimeInDept] = await Promise.all([
        db.leaveRequest.count({ where: { departmentId: deptId, status: "PENDING" } }),
        db.profile.count({ where: { departmentId: deptId, status: "ACTIVE" } }),
        db.overtimeEntry.count({ where: { employee: { departmentId: deptId }, status: "SUBMITTED" } }),
      ]);
      managerDash = { pendingLeaveInDept, deptEmployeeCount, pendingOvertimeInDept };
    }

    // HR / HMS
    let hrDash: { pendingLeaveOrgWide: number; pendingOvertimeOrgWide: number } | null = null;
    if (isHrAdmin) {
      const [pendingLeaveOrgWide, pendingOvertimeOrgWide] = await Promise.all([
        db.leaveRequest.count({ where: { status: "PENDING" } }),
        db.overtimeEntry.count({ where: { status: "SUBMITTED" } }),
      ]);
      hrDash = { pendingLeaveOrgWide, pendingOvertimeOrgWide };
    }

    // ADMIN
    let adminDash: { totalUsers: number; notificationsLast30d: number } | null = null;
    if (role === "ADMIN") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const [totalUsers, notificationsLast30d] = await Promise.all([
        db.profile.count(),
        db.notification.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      ]);
      adminDash = { totalUsers, notificationsLast30d };
    }

    // ── HR/ADMIN only: employee stats ──────────────────────────────────────
    let employeeStats: {
      totalActive: number;
      byDepartment: { departmentId: string | null; department: { name: string } | null; _count: { id: number } }[];
    } | null = null;

    if (isHrAdmin) {
      const [totalActive, byDepartment] = await Promise.all([
        db.profile.count({ where: { status: "ACTIVE" } }),
        db.profile.groupBy({
          by: ["departmentId"],
          where: { status: "ACTIVE" },
          _count: { id: true },
        }),
      ]);

      // Fetch department names for groupBy result
      const deptIds = byDepartment.map((r) => r.departmentId).filter(Boolean) as string[];
      const depts = await db.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } });
      const deptMap = new Map(depts.map((d) => [d.id, d]));

      employeeStats = {
        totalActive,
        byDepartment: byDepartment.map((r) => ({
          ...r,
          department: r.departmentId ? (deptMap.get(r.departmentId) ?? null) : null,
        })),
      };
    }

    return {
      incidents: {
        open: openIncidents,
        critical: criticalIncidents,
        inProgress: inProgressIncidents,
        recent: recentIncidents,
        bySeverity: incidentsBySeverity,
      },
      actions: {
        open: openActions,
        overdue: overdueActions,
        dueSoon: dueSoonActions,
        mine: myActions,
        byStatus: actionsByStatus,
      },
      risk: {
        active: activeAssessments,
        reviewSoon: reviewSoonAssessments,
        criticalHighItems,
        topAssessment: topRiskAssessment,
      },
      documents: {
        expiringSoon: expiringDocuments,
        unconfirmed: unconfirmedDocuments,
      },
      employees: employeeStats,
      handbook: handbookStats,
      employeeDash,
      employeeProfileHome,
      managerDash,
      hrDash,
      adminDash,
    };
  }),
});
