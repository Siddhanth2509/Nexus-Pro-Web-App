import { z } from "zod";
import { eq, and, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, projectMembers, tasks } from "@db/schema";

export const teamRouter = createRouter({
  // ─── List all users (admin only) ───
  list: adminQuery.query(async () => {
    const db = getDb();

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} desc`);

    // Enrich with task counts
    const enriched = await Promise.all(
      allUsers.map(async (user) => {
        const [taskCount] = await db
          .select({ count: count() })
          .from(tasks)
          .where(eq(tasks.assigneeId, user.id));

        const [projectCount] = await db
          .select({ count: count() })
          .from(projectMembers)
          .where(eq(projectMembers.userId, user.id));

        return {
          ...user,
          taskCount: taskCount.count,
          projectCount: projectCount.count,
        };
      })
    );

    return enriched;
  }),

  // ─── Search users (for adding to projects) ───
  search: authedQuery
    .input(z.object({ query: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();

      const query = input?.query?.toLowerCase() || "";

      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          role: users.role,
        })
        .from(users);

      const filtered = allUsers.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );

      return filtered.slice(0, 20);
    }),

  // ─── Update user role (admin only) ───
  updateRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // ─── Get project members ───
  getProjectMembers: authedQuery
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Check access
      const [membership] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, ctx.user.id)
          )
        );

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No access to this project" });
      }

      const members = await db
        .select({
          userId: projectMembers.userId,
          projectRole: projectMembers.role,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          globalRole: users.role,
          createdAt: projectMembers.createdAt,
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, input.projectId));

      return members;
    }),
});
