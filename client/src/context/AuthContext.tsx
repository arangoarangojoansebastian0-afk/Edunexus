import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchAuthUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error("Auth fetch error:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refetchUser = async () => {
    const userData = await fetchAuthUser();
    setUser(userData);
    if (userData) {
      localStorage.setItem("communidad_loyola_user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("communidad_loyola_user");
    }
    return userData;
  };

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem("communidad_loyola_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch {
          localStorage.removeItem("communidad_loyola_user");
        }
      }

      await refetchUser();
      setIsLoading(false);
    };

    init();
  }, []);

  // Aggressive polling when user is null (waiting for login)
  useEffect(() => {
    if (user !== null) {
      // User is authenticated, stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Check if we're in a post-login state
    const params = new URLSearchParams(window.location.search);
    const isPostLogin = params.has("login");

    if (isPostLogin) {
      console.log("Detected post-login, starting aggressive polling...");
      
      // Start polling immediately
      let pollCount = 0;
      pollingIntervalRef.current = setInterval(async () => {
        pollCount++;
        const userData = await fetchAuthUser();

        if (userData) {
          console.log("Auth user found via polling:", userData.email);
          setUser(userData);
          localStorage.setItem("communidad_loyola_user", JSON.stringify(userData));
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (pollCount >= 15) {
          // Stop after 15 seconds
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }, 1000);
    } else {
      // Regular periodic check when not in login flow
      pollingIntervalRef.current = setInterval(refetchUser, 5000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user]);

  // Re-verify session when page regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focus event, refetching user...");
      refetchUser();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
