import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";
import { format } from "date-fns";

export default function TeamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.team.list.useQuery();

  const updateRoleMutation = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
    },
  });

  // Redirect non-admins
  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Shield className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Admin Access Required</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Only administrators can view the team members page.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/")}
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {members?.length || 0} member{members?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">
                Name
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Role
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Projects
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Tasks
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Joined
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {members?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-sm text-muted-foreground">
                  No members found.
                </td>
              </tr>
            )}
            {members?.map((member) => (
              <tr
                key={member.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={member.avatar || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {member.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {member.role === "admin" ? (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-medium"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200 text-xs font-medium"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Member
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {member.projectCount}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {member.taskCount}
                </td>
                <td className="px-4 py-4 text-xs text-muted-foreground">
                  {member.createdAt
                    ? format(new Date(member.createdAt), "MMM d, yyyy")
                    : "—"}
                </td>
                <td className="px-4 py-4">
                  <Select
                    value={member.role}
                    onValueChange={(v) => {
                      if (member.id !== user.id) {
                        updateRoleMutation.mutate({
                          userId: member.id,
                          role: v as "user" | "admin",
                        });
                      }
                    }}
                    disabled={member.id === user.id}
                  >
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
