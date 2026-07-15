import fs from 'fs';

const bundlePath = 'c:/Users/PC/Desktop/LoyolaCommunity/dist/public/assets/index-J8d8jM5W.js';
if (!fs.existsSync(bundlePath)) {
  console.log("Bundle not found!");
  process.exit(1);
}

const content = fs.readFileSync(bundlePath, 'utf8');

// We want to find the minified function names for:
// 1. AppSidebar ("Horarios", "Aula Virtual", "Mensajes")
// 2. Schedules ("Horarios institucionales", "Por grupo")
// 3. CourseDetail ("all-submissions", "Entregas")
// 4. CallUI ("Llamando...", "En llamada", "Llamada de video")

const targets = [
  { name: 'AppSidebar', keyword: 'Mi Perfil' },
  { name: 'Schedules', keyword: 'Horarios institucionales' },
  { name: 'CourseDetail', keyword: 'matriz de calificaciones' },
  { name: 'CallUI / IncomingCallToast', keyword: 'Llamada de video' },
  { name: 'CallUI / OutgoingCallOverlay', keyword: 'Llamando...' },
  { name: 'CallUI / ActiveCallScreen', keyword: 'En llamada' },
  { name: 'FileViewer', keyword: 'Vista previa no disponible' },
];

targets.forEach(t => {
  const index = content.indexOf(t.keyword);
  if (index === -1) {
    console.log(`Keyword for ${t.name} not found`);
    return;
  }
  
  // Let's find the function defining this component.
  // We can search backwards for function keyword/declarations
  // e.g. function XX(
  const snippet = content.substring(Math.max(0, index - 2000), index + 100);
  
  // Let's print a small snippet around the keyword to analyze.
  console.log(`\n=== ${t.name} ===`);
  console.log("Found keyword at index:", index);
  console.log("Snippet around keyword:\n", content.substring(index - 100, index + 300));
});
