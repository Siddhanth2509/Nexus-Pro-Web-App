import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  FolderKanban,
  Users,
} from "lucide-react";

const PROJECT_COLORS: Record<string, { bg: string; bar: string; banner: string }> = {
  blue: { bg: "bg-blue-50", bar: "bg-blue-500", banner: "bg-blue-500" },
  green: { bg: "bg-green-50", bar: "bg-green-500", banner: "bg-green-500" },
  purple: { bg: "bg-purple-50", bar: "bg-purple-500", banner: "bg-purple-500" },
  amber: { bg: "bg-amber-50", bar: "bg-amber-500", banner: "bg-amber-500" },
  red: { bg: "bg-red-50", bar: "bg-red-500", banner: "bg-red-500" },
  teal: { bg: "bg-teal-50", bar: "bg-teal-500", banner: "bg-teal-500" },
};

const COLOR_OPTIONS = ["blue", "green", "purple", "amber", "red", "teal"] as const;

export default function ProjectsPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "blue" as (typeof COLOR_OPTIONS)[number],
  });
  const [formError, setFormError] = useState("");

  const { data: projectList, isLoading } = trpc.project.list.useQuery();
  const createMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      setShowCreate(false);
      setFormData({ name: "", description: "", color: "blue" });
      setFormError("");
    },
  });
  const deleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      setShowDeleteConfirm(null);
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      setFormError("Project name is required");
      return;
    }
    createMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projectList?.length || 0} project{projectList?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Project
        </Button>
      </div>

      {/* Empty state */}
      {projectList?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first project to start organizing tasks and collaborating with your team
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="mt-4 h-9 px-4 bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Project
          </Button>
        </div>
      )}

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectList?.map((project) => {
          const colors = PROJECT_COLORS[project.color] || PROJECT_COLORS.blue;
          const progress =
            project.taskCount > 0
              ? Math.round((project.doneCount / project.taskCount) * 100)
              : 0;

          return (
            <div
              key={project.id}
              className="group bg-card border border-border rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {/* Color banner */}
              <div className={`h-2 ${colors.banner}`} />

              <div className="p-5">
                <h3 className="text-base font-semibold text-foreground group-hover:text-[#2563eb] transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {project.description || "No description"}
                </p>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{project.taskCount} tasks</span>
                    <span>·</span>
                    <span>{project.doneCount} done</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project.memberCount}
                    </span>
                  </div>

                  {/* Avatar stack */}
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 4).map((m, i) => (
                      <Avatar key={i} className="w-6 h-6 border-2 border-card">
                        <AvatarImage src={m.avatar || ""} />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {m.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(project.memberCount || 0) > 4 && (
                      <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
                        +{(project.memberCount || 0) - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Create Project Dialog ─── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Start a new project to organize your team's work
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, name: e.target.value }));
                  setFormError("");
                }}
                placeholder="e.g., Website Redesign"
                className="mt-1.5"
                maxLength={100}
              />
              {formError && (
                <p className="text-xs text-red-500 mt-1">{formError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description of the project..."
                className="mt-1.5 resize-none"
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1.5">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData((p) => ({ ...p, color }))}
                    className={`w-8 h-8 rounded-full ${PROJECT_COLORS[color].bar} transition-all ${
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure? This project and all its tasks will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteConfirm && deleteMutation.mutate({ id: showDeleteConfirm })
              }
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
