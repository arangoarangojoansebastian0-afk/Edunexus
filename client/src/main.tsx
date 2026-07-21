import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Registrar el service worker en el arranque (no solo al abrir Configuración)
// para que el navegador reconozca la app como instalable (criterio de PWA)
// desde el primer ingreso. usePushNotifications() reutiliza este mismo
// registro cuando el usuario activa las notificaciones.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
