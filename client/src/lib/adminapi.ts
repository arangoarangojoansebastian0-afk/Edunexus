import { apiRequest } from "./queryClient"; // Importamos la función centralizada

export async function fetchAdminConfig() {
  const res = await apiRequest("GET", "/api/admin/config");
  return res.json();
}

export async function verifyAdminCode(code: string) {
  const res = await apiRequest("POST", "/api/admin/verify-code", { code });
  return res.json();
}