import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("communidad_loyola_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to restore session from localStorage:", error);
        localStorage.removeItem("communidad_loyola_user");
      }
    }

    // Verify session is still valid with backend
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Unauthorized");
      })
      .then((data) => {
        setUser(data);
        localStorage.setItem("communidad_loyola_user", JSON.stringify(data));
      })
      .catch(() => {
        // User not authenticated
        localStorage.removeItem("communidad_loyola_user");
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Save to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("communidad_loyola_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("communidad_loyola_user");
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
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
