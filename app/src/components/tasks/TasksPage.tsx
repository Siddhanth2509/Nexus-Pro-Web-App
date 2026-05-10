import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Filter,
  Search,
  Trash2,
  Pencil,
} from "lucide-react";
import { format, isPast } from "date-fns";
import TaskDialog from "./TaskDialog";

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

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function TasksPage() {
  const utils = trpc.useUtils();

  const [filters, setFilters] = useState<{
    status: "todo" | "in_progress" | "done" | undefined;
    priority: "low" | "medium" | "high" | undefined;
    projectId: number | undefined;
    search: string;
  }>({
    status: undefined,
    priority: undefined,
    projectId: undefined,
    search: "",
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState<number | null>(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo" as "todo" | "in_progress" | "done",
    priority: "medium" as "low" | "medium" | "high",
    projectId: undefined as number | undefined,
    assigneeId: undefined as number | undefined,
    dueDate: "",
  });

  const { data: taskData, isLoading } = trpc.task.list.useQuery(
    filters.status || filters.priority || filters.projectId || filters.search
      ? {
          status: filters.status,
          priority: filters.priority,
          projectId: filters.projectId,
          search: filters.search || undefined,
        }
      : undefined
  );

  const { data: projectList } = trpc.project.list.useQuery();
  const { data: teamMembers } = trpc.team.search.useQuery({ query: "" });

  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.project.list.invalidate();
      setShowCreate(false);
      resetForm();
    },
  });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowEdit(null);
    },
  });

  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.project.list.invalidate();
      setShowDelete(null);
    },
  });

  const resetForm = () => {
    setTaskForm({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      projectId: undefined,
      assigneeId: undefined,
      dueDate: "",
    });
  };

  const openEdit = (task: {
    id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    projectId: number;
    assigneeId: number | null;
    dueDate: Date | null;
  }) => {
    setTaskForm({
      title: task.title,
      description: task.description || "",
      status: task.status as "todo" | "in_progress" | "done",
      priority: task.priority as "low" | "medium" | "high",
      projectId: task.projectId,
      assigneeId: task.assigneeId || undefined,
      dueDate: task.dueDate
        ? format(new Date(task.dueDate), "yyyy-MM-dd")
        : "",
    });
    setShowEdit(task.id);
  };

  const handleCreate = () => {
    if (!taskForm.title.trim() || !taskForm.projectId) return;
    createMutation.mutate({
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      status: taskForm.status,
      priority: taskForm.priority,
      projectId: taskForm.projectId,
      assigneeId: taskForm.assigneeId,
      dueDate: taskForm.dueDate || undefined,
    });
  };

  const handleUpdate = () => {
    if (!showEdit || !taskForm.title.trim()) return;
    updateMutation.mutate({
      id: showEdit,
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      status: taskForm.status,
      priority: taskForm.priority,
      assigneeId: taskForm.assigneeId,
      dueDate: taskForm.dueDate || undefined,
    });
  };

  const tasks = taskData?.tasks || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {taskData?.total || 0} task{taskData?.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="h-9 px-4 bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/50 rounded-lg border border-border/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            placeholder="Search tasks..."
            className="pl-9 h-8 text-sm bg-card"
          />
        </div>

        <Select
          value={filters.status || "all"}
          onValueChange={(v: string) =>
            setFilters((p) => ({
              ...p,
              status: v === "all" ? undefined : (v as "todo" | "in_progress" | "done"),
            }))
          }
        >
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.priority || "all"}
          onValueChange={(v: string) =>
            setFilters((p) => ({
              ...p,
              priority: v === "all" ? undefined : (v as "low" | "medium" | "high"),
            }))
          }
        >
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.projectId ? String(filters.projectId) : "all"}
          onValueChange={(v: string) =>
            setFilters((p) => ({
              ...p,
              projectId: v === "all" ? undefined : Number(v),
            }))
          }
        >
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projectList?.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() =>
            setFilters({
              status: undefined,
              priority: undefined,
              projectId: undefined,
              search: "",
            })
          }
        >
          <Filter className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      </div>

      {/* Task Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 w-8">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Task
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Project
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Assignee
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Priority
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Due Date
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm text-muted-foreground">
                    {isLoading ? "Loading..." : "No tasks found. Create your first task."}
                  </td>
                </tr>
              )}
              {tasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  task.status !== "done" &&
                  isPast(new Date(task.dueDate));
                return (
                  <tr
                    key={task.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">{task.title}</span>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {task.projectName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={task.assigneeAvatar || ""} />
                          <AvatarFallback className="text-[8px] bg-muted">
                            {task.assigneeName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {task.assigneeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${STATUS_BADGES[task.status]}`}
                      >
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[task.priority]}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-mono ${
                          isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {task.dueDate
                          ? format(new Date(task.dueDate), "MMM d, yyyy")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(task)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDelete(task.id)}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Task Dialogs ─── */}
      <TaskDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="New Task"
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        projectList={projectList || []}
        teamMembers={teamMembers || []}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        submitLabel="Create Task"
      />

      <TaskDialog
        open={!!showEdit}
        onOpenChange={(v: boolean) => !v && setShowEdit(null)}
        title="Edit Task"
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        projectList={projectList || []}
        teamMembers={teamMembers || []}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        submitLabel="Save Changes"
        disableProjectSelect
      />

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDelete && deleteMutation.mutate({ id: showDelete })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
