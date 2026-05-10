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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  taskForm: {
    title: string;
    description: string;
    status: "todo" | "in_progress" | "done";
    priority: "low" | "medium" | "high";
    projectId: number | undefined;
    assigneeId: number | undefined;
    dueDate: string;
  };
  setTaskForm: React.Dispatch<React.SetStateAction<any>>;
  projectList: Array<{ id: number; name: string }>;
  teamMembers: Array<{ id: number; name: string | null; email: string | null }>;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
  disableProjectSelect?: boolean;
}

export default function TaskDialog({
  open,
  onOpenChange,
  title,
  taskForm,
  setTaskForm,
  projectList,
  teamMembers,
  onSubmit,
  isPending,
  submitLabel,
  disableProjectSelect,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm((p: any) => ({ ...p, title: e.target.value }))
              }
              placeholder="Task title..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm((p: any) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              placeholder="Add details..."
              className="mt-1.5 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Project <span className="text-red-500">*</span>
              </Label>
              <Select
                value={taskForm.projectId ? String(taskForm.projectId) : ""}
                onValueChange={(v) =>
                  setTaskForm((p: any) => ({ ...p, projectId: Number(v) }))
                }
                disabled={disableProjectSelect}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectList.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={taskForm.status}
                onValueChange={(v: string) =>
                  setTaskForm((p: any) => ({
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select
                value={taskForm.priority}
                onValueChange={(v: string) =>
                  setTaskForm((p: any) => ({
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

            <div>
              <Label>Assignee</Label>
              <Select
                value={taskForm.assigneeId ? String(taskForm.assigneeId) : ""}
                onValueChange={(v: string) =>
                  setTaskForm((p: any) => ({
                    ...p,
                    assigneeId: v ? Number(v) : undefined,
                  }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name || m.email || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) =>
                setTaskForm((p: any) => ({ ...p, dueDate: e.target.value }))
              }
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!taskForm.title.trim() || !taskForm.projectId || isPending}
          >
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
