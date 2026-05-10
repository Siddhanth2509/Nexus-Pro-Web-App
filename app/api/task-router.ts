import { z } from "zod";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tasks, projectMembers, users, projects } from "@db/schema";

export const taskRouter = createRouter({
  // ─── List tasks (with filtering) ───
  list: authedQuery
    .input(
      z.object({
        projectId: z.number().optional(),
        status: z.enum(["todo", "in_progress", "done"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        assigneeId: z.number().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Get projects user belongs to
      const memberRows = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, userId));

      const accessibleProjectIds = memberRows.map((r) => r.projectId);

      if (accessibleProjectIds.length === 0) {
        return { tasks: [], total: 0 };
      }

      const filters = [];

      // Only filter by specific projectId if provided and user has access
      if (input?.projectId) {
        if (!accessibleProjectIds.includes(input.projectId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this project",
          });
        }
        filters.push(eq(tasks.projectId, input.projectId));
      } else {
        filters.push(sql`${tasks.projectId} IN (${accessibleProjectIds.join(",")})`);
      }

      if (input?.status) filters.push(eq(tasks.status, input.status));
      if (input?.priority) filters.push(eq(tasks.priority, input.priority));
      if (input?.assigneeId) filters.push(eq(tasks.assigneeId, input.assigneeId));

      const whereClause = filters.length > 1 ? and(...filters) : filters[0];

      const offset = ((input?.page || 1) - 1) * (input?.limit || 20);

      const taskList = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          projectId: tasks.projectId,
          assigneeId: tasks.assigneeId,
          creatorId: tasks.creatorId,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(whereClause)
        .orderBy(desc(tasks.updatedAt))
        .limit(input?.limit || 20)
        .offset(offset);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(tasks)
        .where(whereClause);

      // Enrich with assignee and project names
      const enriched = await Promise.all(
        taskList.map(async (task) => {
          const [project] = task.projectId
            ? await db.select({ name: projects.name }).from(projects).where(eq(projects.id, task.projectId))
            : [null];

          const [assignee] = task.assigneeId
            ? await db
                .select({ name: users.name, avatar: users.avatar })
                .from(users)
                .where(eq(users.id, task.assigneeId))
            : [null];

          return {
            ...task,
            projectName: project?.name || "Unknown",
            assigneeName: assignee?.name || "Unassigned",
            assigneeAvatar: assignee?.avatar || null,
          };
        })
      );

      return { tasks: enriched, total: totalResult.count };
    }),

  // ─── Get single task ───
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.id));

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Check access
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, task.projectId),
            eq(projectMembers.userId, ctx.user.id)
          )
        );

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No access to this task" });
      }

      // Get related data
      const [project] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, task.projectId));

      const [assignee] = task.assigneeId
        ? await db
            .select({ name: users.name, avatar: users.avatar })
            .from(users)
            .where(eq(users.id, task.assigneeId))
        : [null];

      const [creator] = await db
        .select({ name: users.name, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, task.creatorId));

      return {
        ...task,
        projectName: project?.name || "Unknown",
        assigneeName: assignee?.name || "Unassigned",
        assigneeAvatar: assignee?.avatar || null,
        creatorName: creator?.name || "Unknown",
        creatorAvatar: creator?.avatar || null,
      };
    }),

  // ─── Create task ───
  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        status: z.enum(["todo", "in_progress", "done"]).default("todo"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        projectId: z.number(),
        assigneeId: z.number().optional(),
        dueDate: z.string().optional(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check if user is a member of the project
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, userId)
          )
        );

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a project member to create tasks",
        });
      }

      // Validate assignee is a project member
      if (input.assigneeId) {
        const [assigneeMembership] = await db
          .select()
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, input.projectId),
              eq(projectMembers.userId, input.assigneeId)
            )
          );

        if (!assigneeMembership) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Assignee must be a project member",
          });
        }
      }

      const [task] = await db
        .insert(tasks)
        .values({
          title: input.title,
          description: input.description || null,
          status: input.status,
          priority: input.priority,
          projectId: input.projectId,
          assigneeId: input.assigneeId || null,
          creatorId: userId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        });

      return { id: task.insertId, ...input };
    }),

  // ─── Update task ───
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(2000).optional(),
        status: z.enum(["todo", "in_progress", "done"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        assigneeId: z.number().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const { id, ...updates } = input;

      // Get the task
      const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Check access: must be project member, task assignee, or admin
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, task.projectId),
            eq(projectMembers.userId, userId)
          )
        );

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No access to this task" });
      }

      // Members can only update tasks they created or are assigned to
      if (
        membership.role === "member" &&
        task.creatorId !== userId &&
        task.assigneeId !== userId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit tasks you created or are assigned to",
        });
      }

      // Validate assignee is a project member
      if (updates.assigneeId) {
        const [assigneeMembership] = await db
          .select()
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, task.projectId),
              eq(projectMembers.userId, updates.assigneeId)
            )
          );

        if (!assigneeMembership) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Assignee must be a project member",
          });
        }
      }

      const updateData: Record<string, unknown> = { ...updates };
      if (updates.dueDate === null) {
        updateData.dueDate = null;
      } else if (updates.dueDate) {
        updateData.dueDate = new Date(updates.dueDate);
      }

      await db.update(tasks).set(updateData).where(eq(tasks.id, id));

      return { success: true };
    }),

  // ─── Delete task ───
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [task] = await db.select().from(tasks).where(eq(tasks.id, input.id));
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Check access: creator, project admin, or app admin
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, task.projectId),
            eq(projectMembers.userId, userId)
          )
        );

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No access" });
      }

      if (
        task.creatorId !== userId &&
        membership.role !== "admin" &&
        ctx.user.role !== "admin"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only task creators or admins can delete",
        });
      }

      await db.delete(tasks).where(eq(tasks.id, input.id));
      return { success: true };
    }),

  // ─── Update task status (quick action) ───
  updateStatus: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["todo", "in_progress", "done"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [task] = await db.select().from(tasks).where(eq(tasks.id, input.id));
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, task.projectId),
            eq(projectMembers.userId, userId)
          )
        );

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No access" });
      }

      await db
        .update(tasks)
        .set({ status: input.status })
        .where(eq(tasks.id, input.id));

      return { success: true };
    }),
});
