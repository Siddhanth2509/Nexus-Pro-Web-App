import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Bell, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [name, setName] = useState(user?.name || "");
  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    dueDates: true,
    projectUpdates: false,
    push: false,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="profile" className="text-sm">
            <User className="w-4 h-4 mr-1.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm">
            <Bell className="w-4 h-4 mr-1.5" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* ─── Profile Tab ─── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.avatar || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-muted border border-border rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="mt-2">
                    {isAdmin ? (
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-700 border-gray-200"
                      >
                        <User className="w-3 h-3 mr-1" />
                        Member
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Name field */}
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 max-w-sm"
                  placeholder="Your name"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  This is how your name will appear across the app.
                </p>
              </div>

              {/* Email field (read-only) */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1.5 max-w-sm bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Email is managed through your OAuth provider.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  disabled={name === (user?.name || "")}
                  className="h-9"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Notifications Tab ─── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Task Assignments</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when you're assigned a new task
                  </p>
                </div>
                <Switch
                  checked={notifications.taskAssigned}
                  onCheckedChange={(v) =>
                    setNotifications((p) => ({ ...p, taskAssigned: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Due Date Reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Receive reminders before task due dates
                  </p>
                </div>
                <Switch
                  checked={notifications.dueDates}
                  onCheckedChange={(v) =>
                    setNotifications((p) => ({ ...p, dueDates: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Project Updates</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified about project changes and new members
                  </p>
                </div>
                <Switch
                  checked={notifications.projectUpdates}
                  onCheckedChange={(v) =>
                    setNotifications((p) => ({ ...p, projectUpdates: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Browser Push</p>
                  <p className="text-xs text-muted-foreground">
                    Enable push notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(v) =>
                    setNotifications((p) => ({ ...p, push: v }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
