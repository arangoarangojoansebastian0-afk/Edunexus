import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/LoadingSpinner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import Library from "@/pages/Library";
import Tutoring from "@/pages/Tutoring";
import MeetRoom from "@/pages/MeetRoom";
import Calendar from "@/pages/Calendar";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import SuperAdmin from "@/pages/SuperAdmin";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import Classroom from "@/pages/Classroom";
import CourseDetail from "@/pages/CourseDetail";
import Schedules from "@/pages/Schedules";
import DirectMessages from "@/pages/DirectMessages";
import { CallProvider } from "@/context/CallContext";
import { GlobalCallUI } from "@/components/calls/CallUI";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader text="Cargando..." />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={user?.role === "super_admin" ? SuperAdmin : Home} />
          <Route path="/groups" component={Groups} />
          <Route path="/groups/:id" component={GroupDetail} />
          <Route path="/library" component={Library} />
          <Route path="/tutoring" component={Tutoring} />
          <Route path="/meet/:id" component={MeetRoom} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/admin" component={Admin} />
          <Route path="/super-admin" component={SuperAdmin} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/settings" component={Settings} />
          <Route path="/classroom" component={Classroom} />
          <Route path="/classroom/:id" component={CourseDetail} />
          <Route path="/schedules" component={Schedules} />
          <Route path="/messages" component={DirectMessages} />
          <Route path="/messages/group/:groupId" component={DirectMessages} />
          <Route path="/messages/:userId" component={DirectMessages} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CallProvider>
          <TooltipProvider>
            <Toaster />
            <GlobalCallUI />
            <Router />
          </TooltipProvider>
        </CallProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
