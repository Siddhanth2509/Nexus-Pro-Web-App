import { z } from "zod";
import { eq, and, count, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { projects, projectMembers, tasks, users } from "@db/schema";

export const projectRouter = createRouter({
  // ─── List all projects user has access to ───
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Get project IDs where user is a member
    const memberRows = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    const projectIds = memberRows.map((r) => r.projectId);

    if (projectIds.length === 0) {
      return [];
    }

    const projectList = await db
      .select()
      .from(projects)
      .where(inArray(projects.id, projectIds))
      .orderBy(sql`${projects.updatedAt} desc`);

    // Get member counts and task counts for each project
    const result = await Promise.all(
      projectList.map(async (project) => {
        const [memberCount] = await db
          .select({ count: count() })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, project.id));

        const [taskCount] = await db
          .select({ count: count() })
          .from(tasks)
          .where(eq(tasks.projectId, project.id));

        const [doneCount] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.projectId, project.id),
              eq(tasks.status, "done")
            )
          );

        // Get member avatars
        const members = await db
          .select({
            userId: projectMembers.userId,
            name: users.name,
            avatar: users.avatar,
          })
          .from(projectMembers)
          .innerJoin(users, eq(projectMembers.userId, users.id))
          .where(eq(projectMembers.projectId, project.id))
          .limit(4);

        return {
          ...project,
          memberCount: memberCount.count,
          taskCount: taskCount.count,
          doneCount: doneCount.count,
          members,
        };
      })
    );

    return result;
  }),

  // ─── Get single project with details ───
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check if user is a member
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.id),
            eq(projectMembers.userId, userId)
          )
        );

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this project",
        });
      }

      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.id));

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Get all members
      const members = await db
        .select({
          userId: projectMembers.userId,
          projectRole: projectMembers.role,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          globalRole: users.role,
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, input.id));

      // Get all tasks
      const taskList = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          assigneeId: tasks.assigneeId,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(eq(tasks.projectId, input.id))
        .orderBy(sql`${tasks.updatedAt} desc`);

      return { ...project, members, tasks: taskList, myRole: membership.role };
    }),

  // ─── Create project ───
  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        color: z.enum(["blue", "green", "purple", "amber", "red", "teal"]).default("blue"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [project] = await db
        .insert(projects)
        .values({
          name: input.name,
          description: input.description || null,
          color: input.color,
          ownerId: userId,
          status: "active",
        });

      // Add creator as admin
      await db.insert(projectMembers).values({
        projectId: project.insertId,
        userId: userId,
        role: "admin",
      });

      return { id: project.insertId, ...input, ownerId: userId };
    }),

  // ─── Update project ───
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        color: z.enum(["blue", "green", "purple", "amber", "red", "teal"]).optional(),
        status: z.enum(["active", "archived"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const { id, ...updates } = input;

      // Check admin access
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, id),
            eq(projectMembers.userId, userId),
            eq(projectMembers.role, "admin")
          )
        );

      if (!membership && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project admins can update",
        });
      }

      await db
        .update(projects)
        .set(updates)
        .where(eq(projects.id, id));

      return { success: true };
    }),

  // ─── Delete project ───
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check admin access or app admin
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.id),
            eq(projectMembers.userId, userId),
            eq(projectMembers.role, "admin")
          )
        );

      if (!membership && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project admins can delete",
        });
      }

      // Delete related records first
      await db.delete(tasks).where(eq(tasks.projectId, input.id));
      await db.delete(projectMembers).where(eq(projectMembers.projectId, input.id));
      await db.delete(projects).where(eq(projects.id, input.id));

      return { success: true };
    }),

  // ─── Add member to project ───
  addMember: authedQuery
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(["admin", "member"]).default("member"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const currentUserId = ctx.user.id;

      // Check admin access
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, currentUserId),
            eq(projectMembers.role, "admin")
          )
        );

      if (!membership && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project admins can add members",
        });
      }

      await db.insert(projectMembers).values({
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
      });

      return { success: true };
    }),

  // ─── Remove member from project ───
  removeMember: authedQuery
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const currentUserId = ctx.user.id;

      // Check admin access
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, currentUserId),
            eq(projectMembers.role, "admin")
          )
        );

      if (!membership && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project admins can remove members",
        });
      }

      await db
        .delete(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId)
          )
        );

      return { success: true };
    }),
});
