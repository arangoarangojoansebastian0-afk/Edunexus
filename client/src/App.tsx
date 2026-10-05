import { lazy, Suspense } from "react";
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
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import SetupSuperAdmin from "@/pages/SetupSuperAdmin";
import Register from "@/pages/Register";
const Home = lazy(() => import("@/pages/Home"));
const Groups = lazy(() => import("@/pages/Groups"));
const GroupDetail = lazy(() => import("@/pages/GroupDetail"));
const Library = lazy(() => import("@/pages/Library"));
const Tutoring = lazy(() => import("@/pages/Tutoring"));
const Meet = lazy(() => import("@/pages/Meet"));
const MeetRoom = lazy(() => import("@/pages/MeetRoom"));
const ParentPortal = lazy(() => import("@/pages/ParentPortal"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Profile = lazy(() => import("@/pages/Profile"));
const Admin = lazy(() => import("@/pages/Admin"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Settings = lazy(() => import("@/pages/Settings"));
const Classroom = lazy(() => import("@/pages/Classroom"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const MyGroup = lazy(() => import("@/pages/MyGroup"));
const Schedules = lazy(() => import("@/pages/Schedules"));
const DirectMessages = lazy(() => import("@/pages/DirectMessages"));
import { CallProvider } from "@/context/CallContext";
import { GlobalCallUI } from "@/components/calls/CallUI";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const canOpenAdmin = ["admin", "director", "coordinator", "secretary", "super_admin"].includes(user?.role || "");
  const isParent = user?.role === "parent";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader text="Cargando..." />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><PageLoader text="Cargando sección..." /></div>}>
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/setup-super-admin" component={SetupSuperAdmin} />
      <Route path="/register" component={Register} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={user?.role === "super_admin" ? SuperAdmin : user?.role === "parent" ? ParentPortal : Home} />
          <Route path="/groups" component={isParent ? NotFound : Groups} />
          <Route path="/groups/:id" component={isParent ? NotFound : GroupDetail} />
          <Route path="/library" component={isParent ? NotFound : Library} />
          <Route path="/tutoring" component={isParent ? NotFound : Tutoring} />
          <Route path="/meet" component={isParent ? NotFound : Meet} />
          <Route path="/parent" component={isParent ? ParentPortal : NotFound} />
          <Route path="/meet/:id" component={isParent ? NotFound : MeetRoom} />
          <Route path="/calendar" component={isParent ? NotFound : Calendar} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/admin" component={canOpenAdmin ? Admin : NotFound} />
          <Route path="/super-admin" component={user?.role === "super_admin" ? SuperAdmin : NotFound} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/settings" component={Settings} />
          <Route path="/classroom" component={isParent ? NotFound : Classroom} />
          <Route path="/classroom/:id" component={isParent ? NotFound : CourseDetail} />
          <Route path="/my-group" component={user?.role === "teacher" ? MyGroup : NotFound} />
          <Route path="/schedules" component={isParent ? NotFound : Schedules} />
          <Route path="/messages" component={DirectMessages} />
          <Route path="/messages/group/:groupId" component={DirectMessages} />
          <Route path="/messages/:userId" component={DirectMessages} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
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
