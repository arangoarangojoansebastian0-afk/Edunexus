import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

function reportGlobalError(error: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("edunexus:api-error", { detail: { message: error instanceof Error ? error.message : "No se pudo completar la operación." } }));
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportGlobalError }),
  mutationCache: new MutationCache({ onError: reportGlobalError }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30_000,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.message?.startsWith("401:")) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: 1 },
  },
});
