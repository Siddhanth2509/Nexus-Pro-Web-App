import { eq, and, count, sql, lte } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tasks, projectMembers, projects, users } from "@db/schema";

export const dashboardRouter = createRouter({
  // ─── Get dashboard statistics ───
  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Get projects user belongs to
    const memberRows = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    const projectIds = memberRows.map((r) => r.projectId);

    if (projectIds.length === 0) {
      return {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalProjects: 0,
        statusBreakdown: {
          todo: 0,
          in_progress: 0,
          done: 0,
        },
        priorityBreakdown: {
          high: 0,
          medium: 0,
          low: 0,
        },
        recentTasks: [],
      };
    }

    const projectFilter = sql`${tasks.projectId} IN (${projectIds.join(",")})`;

    // Total tasks
    const [totalResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(projectFilter);

    // Active tasks (todo + in_progress)
    const [activeResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          projectFilter,
          sql`${tasks.status} IN ('todo', 'in_progress')`
        )
      );

    // Completed tasks
    const [completedResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(projectFilter, eq(tasks.status, "done")));

    // Overdue tasks
    const now = new Date();
    const [overdueResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          projectFilter,
          sql`${tasks.status} != 'done'`,
          sql`${tasks.dueDate} IS NOT NULL`,
          lte(tasks.dueDate, now)
        )
      );

    // Status breakdown
    const [todoResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(projectFilter, eq(tasks.status, "todo")));

    const [inProgressResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(projectFilter, eq(tasks.status, "in_progress")));

    // Priority breakdown
    const [highResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(projectFilter, eq(tasks.priority, "high")));

    const [mediumResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(projectFilter, eq(tasks.priority, "medium")));

    const [lowResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(projectFilter, eq(tasks.priority, "low")));

    // Recent tasks (last 10)
    const recentTaskList = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        projectId: tasks.projectId,
        assigneeId: tasks.assigneeId,
      })
      .from(tasks)
      .where(projectFilter)
      .orderBy(sql`${tasks.updatedAt} desc`)
      .limit(10);

    // Enrich recent tasks
    const enrichedRecent = await Promise.all(
      recentTaskList.map(async (task) => {
        const [project] = task.projectId
          ? await db.select({ name: projects.name }).from(projects).where(eq(projects.id, task.projectId))
          : [null];

        const [assignee] = task.assigneeId
          ? await db.select({ name: users.name, avatar: users.avatar }).from(users).where(eq(users.id, task.assigneeId))
          : [null];

        const isOverdue =
          task.dueDate &&
          task.status !== "done" &&
          new Date(task.dueDate) < now;

        return {
          ...task,
          projectName: project?.name || "Unknown",
          assigneeName: assignee?.name || "Unassigned",
          assigneeAvatar: assignee?.avatar || null,
          isOverdue: !!isOverdue,
        };
      })
    );

    return {
      totalTasks: totalResult.count,
      activeTasks: activeResult.count,
      completedTasks: completedResult.count,
      overdueTasks: overdueResult.count,
      totalProjects: projectIds.length,
      statusBreakdown: {
        todo: todoResult.count,
        in_progress: inProgressResult.count,
        done: completedResult.count,
      },
      priorityBreakdown: {
        high: highResult.count,
        medium: mediumResult.count,
        low: lowResult.count,
      },
      recentTasks: enrichedRecent,
    };
  }),
});
