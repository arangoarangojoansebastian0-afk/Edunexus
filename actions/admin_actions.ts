export async function upsertSubject(data: { id?: string, code: string, name: string, description?: string }) {
  const res = await fetch("/api/admin/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save subject");
  return res.json();
}