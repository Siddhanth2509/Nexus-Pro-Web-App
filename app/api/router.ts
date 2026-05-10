import { authRouter } from "./auth-router";
import { projectRouter } from "./project-router";
import { taskRouter } from "./task-router";
import { dashboardRouter } from "./dashboard-router";
import { teamRouter } from "./team-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  project: projectRouter,
  task: taskRouter,
  dashboard: dashboardRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
