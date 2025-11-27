import { useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const { user, isLoading, isAuthenticated } = useAuthContext();

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
