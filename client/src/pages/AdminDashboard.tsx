import { useEffect, useState } from "react";
import { fetchAdminConfig } from "../lib/adminapi"; // Usando la función que creamos antes

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("general");
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchAdminConfig().then(setConfig).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar de navegación */}
      <aside className="w-64 bg-white shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Loyola Panel</h2>
        <nav className="space-y-4">
          <button onClick={() => setActiveTab("general")} className="block w-full text-left p-2 rounded hover:bg-blue-50">General</button>
          <button onClick={() => setActiveTab("users")} className="block w-full text-left p-2 rounded hover:bg-blue-50">Usuarios</button>
          <button onClick={() => setActiveTab("codes")} className="block w-full text-left p-2 rounded hover:bg-blue-50">Códigos Acceso</button>
        </nav>
      </aside>

      {/* Área de contenido principal */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 capitalize">{activeTab}</h1>
        
        {activeTab === "general" && (
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-4">Configuración Institucional</h3>
            {config ? <pre>{JSON.stringify(config, null, 2)}</pre> : <p>Cargando...</p>}
          </div>
        )}

        {/* Aquí irán los otros módulos cuando hagas clic en el sidebar */}
      </main>
    </div>
  );
}