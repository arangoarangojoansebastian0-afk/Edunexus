import { db } from "./db";
import {
  users,
  groups,
  groupMembers,
  posts,
  comments,
  reactions,
  files,
  events,
  eventParticipants,
  badges,
  userBadges,
} from "@shared/schema";

async function seed() {
  console.log("🌱 Iniciando seed de datos...");

  // Clear existing data
  await db.delete(userBadges);
  await db.delete(badges);
  await db.delete(eventParticipants);
  await db.delete(events);
  await db.delete(reactions);
  await db.delete(comments);
  await db.delete(posts);
  await db.delete(files);
  await db.delete(groupMembers);
  await db.delete(groups);
  await db.delete(users);

  // Create users (without passwords - users must register to create their own)
  const adminUser = await db.insert(users).values({
    id: "admin-001",
    email: "admin@gmail.com",
    firstName: "Admin",
    lastName: "System",
    role: "admin",
    verified: true,
    grade: null,
    bio: "Administrador de la plataforma",
  }).returning().then(r => r[0]);

  const teacherUser = await db.insert(users).values({
    id: "teacher-001",
    email: "teacher@gmail.com",
    firstName: "Profesor",
    lastName: "Garcia",
    role: "teacher",
    verified: true,
    grade: null,
    bio: "Profesor de Matemáticas",
  }).returning().then(r => r[0]);

  const student1 = await db.insert(users).values({
    id: "student-001",
    email: "student1@gmail.com",
    firstName: "Juan",
    lastName: "Pérez",
    role: "student",
    verified: true,
    grade: "11",
    bio: "Estudiante de 11° grado",
    interests: ["deportes", "tecnología"],
  }).returning().then(r => r[0]);

  const student2 = await db.insert(users).values({
    id: "student-002",
    email: "student2@gmail.com",
    firstName: "María",
    lastName: "López",
    role: "student",
    verified: true,
    grade: "10",
    bio: "Estudiante de 10° grado",
    interests: ["arte", "música"],
  }).returning().then(r => r[0]);

  const student3 = await db.insert(users).values({
    id: "student-003",
    email: "student3@gmail.com",
    firstName: "Carlos",
    lastName: "Rodríguez",
    role: "student",
    verified: true,
    grade: "9",
    bio: "Estudiante de 9° grado",
    interests: ["ciencias", "robótica"],
  }).returning().then(r => r[0]);

  console.log("✅ Usuarios creados");

  // Create badges - Academic, Sports, Arts, Leadership, Interactions
  const badgeIntellect = await db.insert(badges).values({
    name: "Intelectual",
    description: "Creaste 10 publicaciones",
  }).returning().then(r => r[0]);

  const badgeCollab = await db.insert(badges).values({
    name: "Colaborador",
    description: "Participaste en 5 grupos",
  }).returning().then(r => r[0]);

  // Academic Badges
  const badgeMathGenius = await db.insert(badges).values({
    name: "Genio Matemático",
    description: "Dominas las matemáticas y ayudas a otros en la materia",
  }).returning().then(r => r[0]);

  const badgeScienceExplorer = await db.insert(badges).values({
    name: "Explorador Científico",
    description: "Destacado en ciencias naturales y experimentación",
  }).returning().then(r => r[0]);

  const badgeLiteraryMaster = await db.insert(badges).values({
    name: "Maestro Literario",
    description: "Excelente en literatura, lectura y escritura",
  }).returning().then(r => r[0]);

  const badgeHistorian = await db.insert(badges).values({
    name: "Historiador",
    description: "Apasionado por la historia y las culturas",
  }).returning().then(r => r[0]);

  const badgeProgrammer = await db.insert(badges).values({
    name: "Programador Hacker",
    description: "Experto en programación e informática",
  }).returning().then(r => r[0]);

  // Sports Badges
  const badgeAthlete = await db.insert(badges).values({
    name: "Atleta Dedicado",
    description: "Participante activo en deportes y entrenamientos",
  }).returning().then(r => r[0]);

  const badgeChampion = await db.insert(badges).values({
    name: "Campeón Deportivo",
    description: "Ganaste competencias deportivas dentro o fuera del colegio",
  }).returning().then(r => r[0]);

  // Arts Badges
  const badgeArtist = await db.insert(badges).values({
    name: "Artista Creativo",
    description: "Talento destacado en artes visuales",
  }).returning().then(r => r[0]);

  const badgeMusician = await db.insert(badges).values({
    name: "Músico Talentoso",
    description: "Experto en música e instrumentos",
  }).returning().then(r => r[0]);

  const badgePerformer = await db.insert(badges).values({
    name: "Actor Destacado",
    description: "Participaste en presentaciones teatrales o eventos",
  }).returning().then(r => r[0]);

  // Leadership Badges
  const badgeLeader = await db.insert(badges).values({
    name: "Líder Natural",
    description: "Asumiste roles de liderazgo en proyectos y grupos",
  }).returning().then(r => r[0]);

  const badgeMentor = await db.insert(badges).values({
    name: "Mentor",
    description: "Ayudas y enseñas a tus compañeros regularmente",
  }).returning().then(r => r[0]);

  const badgeOrganizer = await db.insert(badges).values({
    name: "Organizador",
    description: "Planeaste y coordinaste eventos o actividades",
  }).returning().then(r => r[0]);

  // Interaction & Community Badges
  const badgeSocialButterfly = await db.insert(badges).values({
    name: "Mariposa Social",
    description: "Eres muy activo en la comunidad y conectas con muchos",
  }).returning().then(r => r[0]);

  const badgeHelpingHand = await db.insert(badges).values({
    name: "Mano Amiga",
    description: "Siempre ayudas a quienes lo necesitan",
  }).returning().then(r => r[0]);

  // Special Achievement Badges
  const badgeRising = await db.insert(badges).values({
    name: "Estrella en Ascenso",
    description: "Tu desempeño mejoró notablemente durante el año",
  }).returning().then(r => r[0]);

  const badgeExceptional = await db.insert(badges).values({
    name: "Estudiante Excepcional",
    description: "Desempeño académico y conductual excepcional",
  }).returning().then(r => r[0]);

  const badgeRobot = await db.insert(badges).values({
    name: "Experto en Robótica",
    description: "Destacado en robótica e ingeniería",
  }).returning().then(r => r[0]);

  const badgeEnvironment = await db.insert(badges).values({
    name: "Guardián del Ambiente",
    description: "Promotor de sostenibilidad y cuidado del medio ambiente",
  }).returning().then(r => r[0]);

  const badgeDebater = await db.insert(badges).values({
    name: "Debatidor Perspicaz",
    description: "Excelente en debate y argumentación",
  }).returning().then(r => r[0]);

  const badgeDreamTeam = await db.insert(badges).values({
    name: "Equipo de Ensueño",
    description: "Trabajaste excepcionalmente bien en equipo",
  }).returning().then(r => r[0]);

  console.log("✅ Badges creados (25 insignias)");

  // Create groups
  const courseGroup = await db.insert(groups).values({
    id: "group-1",
    name: "11° Grado - Curso General",
    description: "Grupo oficial para estudiantes de 11° grado",
    type: "course",
    createdBy: adminUser.id,
    grade: "11",
  }).returning().then(r => r[0]);

  const clubGroup = await db.insert(groups).values({
    id: "group-2",
    name: "Club de Programación",
    description: "Proyecto y desarrollo de aplicaciones",
    type: "club",
    createdBy: teacherUser.id,
  }).returning().then(r => r[0]);

  const sportsGroup = await db.insert(groups).values({
    id: "group-3",
    name: "Club de Deportes",
    description: "Actividades deportivas y entrenamiento",
    type: "club",
    createdBy: adminUser.id,
  }).returning().then(r => r[0]);

  console.log("✅ Grupos creados");

  // Add group members
  await db.insert(groupMembers).values([
    { groupId: courseGroup.id, userId: adminUser.id, role: "admin" },
    { groupId: courseGroup.id, userId: teacherUser.id, role: "teacher" },
    { groupId: courseGroup.id, userId: student1.id, role: "member" },
    { groupId: courseGroup.id, userId: student2.id, role: "member" },
    { groupId: courseGroup.id, userId: student3.id, role: "member" },
    { groupId: clubGroup.id, userId: teacherUser.id, role: "admin" },
    { groupId: clubGroup.id, userId: student1.id, role: "member" },
    { groupId: clubGroup.id, userId: student3.id, role: "member" },
    { groupId: sportsGroup.id, userId: adminUser.id, role: "admin" },
    { groupId: sportsGroup.id, userId: student1.id, role: "member" },
    { groupId: sportsGroup.id, userId: student2.id, role: "member" },
  ] as any);

  console.log("✅ Miembros de grupos agregados");

  // Create posts
  const post1 = await db.insert(posts).values({
    content: "¡Hola a todos! Bienvenidos a EduNexus. Este es el lugar perfecto para compartir ideas y colaborar.",
    authorId: adminUser.id,
  }).returning().then(r => r[0]);

  const post2 = await db.insert(posts).values({
    content: "Les comparto mis apuntes de matemáticas. ¡Espero que les sean útiles para estudiar para el parcial!",
    authorId: teacherUser.id,
    groupId: courseGroup.id,
  }).returning().then(r => r[0]);

  const post3 = await db.insert(posts).values({
    content: "¿Alguien quiere iniciar un proyecto de programación? Busco compañeros para desarrollar una app.",
    authorId: student1.id,
    groupId: clubGroup.id,
  }).returning().then(r => r[0]);

  const post4 = await db.insert(posts).values({
    content: "Acabo de terminar la lectura del libro asignado. Las preguntas de reflexión están muy interesantes.",
    authorId: student2.id,
  }).returning().then(r => r[0]);

  const post5 = await db.insert(posts).values({
    content: "Practicamos fútbol ayer y fue genial. ¡Los próximos entrenamientos serán aún mejores!",
    authorId: student3.id,
    groupId: sportsGroup.id,
  }).returning().then(r => r[0]);

  console.log("✅ Posts creados");

  // Create comments
  await db.insert(comments).values([
    {
      content: "¡Excelente iniciativa! Estoy emocionado de ser parte de esta comunidad.",
      postId: post1.id,
      authorId: student1.id,
    },
    {
      content: "Gracias por los apuntes, profesor. Son muy claros.",
      postId: post2.id,
      authorId: student2.id,
    },
    {
      content: "Yo estoy interesado. ¿Qué tipo de proyecto tenías en mente?",
      postId: post3.id,
      authorId: student3.id,
    },
  ] as any);

  console.log("✅ Comentarios creados");

  // Create reactions
  await db.insert(reactions).values([
    { postId: post1.id, userId: student1.id, type: "like" },
    { postId: post1.id, userId: student2.id, type: "like" },
    { postId: post2.id, userId: student1.id, type: "like" },
    { postId: post3.id, userId: student2.id, type: "like" },
    { postId: post5.id, userId: student1.id, type: "like" },
  ] as any);

  console.log("✅ Reacciones creadas");

  // Create files
  await db.insert(files).values([
    {
      fileName: "Apuntes_Matematicas_Unidad1.pdf",
      fileUrl: "/uploads/apuntes-math-1.pdf",
      storageKey: "apuntes-math-1",
      fileType: "pdf",
      fileSize: 2048,
      subject: "Matemáticas",
      description: "Apuntes de la unidad 1 de matemáticas",
      uploaderId: teacherUser.id,
      approved: true,
    },
    {
      fileName: "Guia_Estudio_Historia.docx",
      fileUrl: "/uploads/guide-history.docx",
      storageKey: "guide-history",
      fileType: "docx",
      fileSize: 1024,
      subject: "Historia",
      description: "Guía de estudio para el parcial",
      uploaderId: student1.id,
      approved: true,
    },
  ] as any);

  console.log("✅ Archivos creados");

  // Create events (tutoring sessions)
  const event1 = await db.insert(events).values({
    title: "Asesoría de Matemáticas",
    description: "Repaso de ecuaciones cuadráticas",
    hostId: teacherUser.id,
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 90000000),
    capacity: 5,
    videoUrl: "https://meet.google.com/abc-xyz",
  }).returning().then(r => r[0]);

  const event2 = await db.insert(events).values({
    title: "Tutoría de Programación",
    description: "Introducción a React.js",
    hostId: student1.id,
    startTime: new Date(Date.now() + 172800000), // Day after tomorrow
    endTime: new Date(Date.now() + 176400000),
    capacity: 3,
    videoUrl: "https://meet.google.com/def-uvw",
  }).returning().then(r => r[0]);

  console.log("✅ Eventos creados");

  // Add event participants
  await db.insert(eventParticipants).values([
    { eventId: event1.id, userId: student1.id },
    { eventId: event1.id, userId: student2.id },
    { eventId: event2.id, userId: student3.id },
  ] as any);

  console.log("✅ Participantes de eventos agregados");

  // Assign badges to students
  await db.insert(userBadges).values([
    { userId: student1.id, badgeId: badgeIntellect.id },
    { userId: student1.id, badgeId: badgeCollab.id },
    { userId: student1.id, badgeId: badgeProgrammer.id },
    { userId: student1.id, badgeId: badgeAthlete.id },
    { userId: student1.id, badgeId: badgeLeader.id },
    { userId: student2.id, badgeId: badgeCollab.id },
    { userId: student2.id, badgeId: badgeArtist.id },
    { userId: student2.id, badgeId: badgeMusician.id },
    { userId: student2.id, badgeId: badgeSocialButterfly.id },
    { userId: student3.id, badgeId: badgeScienceExplorer.id },
    { userId: student3.id, badgeId: badgeChampion.id },
    { userId: student3.id, badgeId: badgeRobot.id },
    { userId: student3.id, badgeId: badgeMentor.id },
  ] as any);

  console.log("✅ Badges asignados a usuarios");

  console.log("🎉 ¡Seed completado exitosamente!");
}

seed().catch(console.error);
