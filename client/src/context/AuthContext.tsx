import { createContext, useContext, useEffect, useState } from "react";
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
      const data = await res.json();
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUser = async () => {
    const userData = await fetchAuthUser();
    setUser(userData);
    if (userData) {
      localStorage.setItem("communidad_loyola_user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("communidad_loyola_user");
    }
  };

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem("communidad_loyola_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem("communidad_loyola_user");
        }
      }

      await refetchUser();
      setIsLoading(false);
    };

    init();
  }, []);

  // Re-verify session when page regains focus
  useEffect(() => {
    const handleFocus = () => {
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
