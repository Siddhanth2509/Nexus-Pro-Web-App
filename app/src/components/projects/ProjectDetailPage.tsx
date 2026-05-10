import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format, isPast } from "date-fns";

const STATUS_BADGES: Record<string, string> = {
  todo: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  done: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_DOTS: Record<string, string> = {
  low: "bg-green-400",
  medium: "bg-amber-400",
  high: "bg-red-400",
};

const COLUMNS = [
  { key: "todo", label: "To Do", headerColor: "border-t-blue-500" },
  { key: "in_progress", label: "In Progress", headerColor: "border-t-amber-500" },
  { key: "done", label: "Done", headerColor: "border-t-green-500" },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const projectId = Number(id);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo" as "todo" | "in_progress" | "done",
    priority: "medium" as "low" | "medium" | "high",
    assigneeId: "" as string,
    dueDate: "",
  });

  const { data: project, isLoading } = trpc.project.getById.useQuery(
    { id: projectId },
    { enabled: !isNaN(projectId) }
  );

  const createTaskMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: projectId });
      utils.dashboard.stats.invalidate();
      setShowTaskForm(false);
      setTaskForm({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assigneeId: "",
        dueDate: "",
      });
    },
  });

  const updateStatusMutation = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: projectId });
      utils.dashboard.stats.invalidate();
    },
  });

  const deleteProjectMutation = trpc.project.delete.useMutation({
    onSuccess: () => {
      navigate("/projects");
    },
  });

  const handleCreateTask = () => {
    if (!taskForm.title.trim()) return;
    createTaskMutation.mutate({
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      status: taskForm.status,
      priority: taskForm.priority,
      projectId,
      assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : undefined,
      dueDate: taskForm.dueDate || undefined,
    });
  };

  const isAdmin =
    project?.myRole === "admin" || user?.role === "admin";

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="h-4 w-72 bg-muted rounded animate-pulse mb-8" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Project not found</h2>
          <Button variant="ghost" onClick={() => navigate("/projects")} className="mt-4">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const tasksByStatus = {
    todo: project.tasks?.filter((t) => t.status === "todo") || [],
    in_progress: project.tasks?.filter((t) => t.status === "in_progress") || [],
    done: project.tasks?.filter((t) => t.status === "done") || [],
  };

  const totalTasks = project.tasks?.length || 0;
  const doneCount = tasksByStatus.done.length;
  const activeCount = tasksByStatus.todo.length + tasksByStatus.in_progress.length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Breadcrumb + Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Projects
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.description || "No description"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 bg-primary text-primary-foreground"
              onClick={() => setShowTaskForm(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 py-3 border-y border-border mb-6 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{totalTasks} tasks</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-muted-foreground">{activeCount} active</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-muted-foreground">{doneCount} done</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {project.members?.slice(0, 3).map((m, i) => (
              <Avatar key={i} className="w-5 h-5 border border-background">
                <AvatarImage src={m.avatar || ""} />
                <AvatarFallback className="text-[8px] bg-muted">
                  {m.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-muted-foreground">
            {project.members?.length || 0} members
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus[col.key as keyof typeof tasksByStatus];
          return (
            <div
              key={col.key}
              className={`bg-muted/30 border border-border rounded-lg border-t-2 ${col.headerColor}`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {colTasks.length}
                </Badge>
              </div>
              <div className="px-3 pb-3 space-y-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={project.members || []}
                    onStatusChange={(status) =>
                      updateStatusMutation.mutate({ id: task.id, status })
                    }
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Create Task Dialog ─── */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>
              Add a task to {project.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="task-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Task title..."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Add details..."
                className="mt-1.5 resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(v) =>
                    setTaskForm((p) => ({
                      ...p,
                      status: v as "todo" | "in_progress" | "done",
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) =>
                    setTaskForm((p) => ({
                      ...p,
                      priority: v as "low" | "medium" | "high",
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assignee</Label>
                <Select
                  value={taskForm.assigneeId}
                  onValueChange={(v) =>
                    setTaskForm((p) => ({ ...p, assigneeId: v }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {project.members?.map((m) => (
                      <SelectItem key={m.userId} value={String(m.userId)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) =>
                    setTaskForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTaskForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!taskForm.title.trim() || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure? This will permanently delete "{project.name}" and all its tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteProjectMutation.mutate({ id: projectId })}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({
  task,
  members,
  onStatusChange,
}: {
  task: {
    id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigneeId: number | null;
    dueDate: Date | null;
  };
  members: Array<{
    userId: number;
    name: string | null;
    avatar: string | null;
  }>;
  onStatusChange: (status: "todo" | "in_progress" | "done") => void;
}) {
  const assignee = members.find((m) => m.userId === task.assigneeId);
  const isOverdue =
    task.dueDate && task.status !== "done" && isPast(new Date(task.dueDate));

  return (
    <div className="bg-card border border-border rounded-md p-3 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[task.priority]}`}
            />

            {assignee && (
              <Avatar className="w-5 h-5 ml-auto">
                <AvatarImage src={assignee.avatar || ""} />
                <AvatarFallback className="text-[8px] bg-muted">
                  {assignee.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {task.dueDate && (
            <div
              className={`flex items-center gap-1 mt-1.5 text-xs ${
                isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {format(new Date(task.dueDate), "MMM d")}
              {isOverdue && " (Overdue)"}
            </div>
          )}

          {/* Status quick change */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {(["todo", "in_progress", "done"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  task.status === s
                    ? STATUS_BADGES[s]
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
