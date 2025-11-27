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

  // Create users
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

  // Create badges
  const badgeIntellect = await db.insert(badges).values({
    id: "badge-1",
    name: "Intelectual",
    description: "Creaste 10 publicaciones",
    icon: "🧠",
  }).returning().then(r => r[0]);

  const badgeCollab = await db.insert(badges).values({
    id: "badge-2",
    name: "Colaborador",
    description: "Participaste en 5 grupos",
    icon: "🤝",
  }).returning().then(r => r[0]);

  console.log("✅ Badges creados");

  // Create groups
  const courseGroup = await db.insert(groups).values({
    id: "group-1",
    name: "11° Grado - Curso General",
    description: "Grupo oficial para estudiantes de 11° grado",
    type: "course",
    createdBy: adminUser.id,
    grade: "11",
    visibility: "public",
  }).returning().then(r => r[0]);

  const clubGroup = await db.insert(groups).values({
    id: "group-2",
    name: "Club de Programación",
    description: "Proyecto y desarrollo de aplicaciones",
    type: "club",
    createdBy: teacherUser.id,
    visibility: "public",
  }).returning().then(r => r[0]);

  const sportsGroup = await db.insert(groups).values({
    id: "group-3",
    name: "Club de Deportes",
    description: "Actividades deportivas y entrenamiento",
    type: "club",
    createdBy: adminUser.id,
    visibility: "public",
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
  ]);

  console.log("✅ Miembros de grupos agregados");

  // Create posts
  const post1 = await db.insert(posts).values({
    id: "post-1",
    content: "¡Hola a todos! Bienvenidos a Comunidad Loyola. Este es el lugar perfecto para compartir ideas y colaborar.",
    authorId: adminUser.id,
    grade: "11",
    visibility: "public",
  }).returning().then(r => r[0]);

  const post2 = await db.insert(posts).values({
    id: "post-2",
    content: "Les comparto mis apuntes de matemáticas. ¡Espero que les sean útiles para estudiar para el parcial!",
    authorId: teacherUser.id,
    groupId: courseGroup.id,
    visibility: "public",
  }).returning().then(r => r[0]);

  const post3 = await db.insert(posts).values({
    id: "post-3",
    content: "¿Alguien quiere iniciar un proyecto de programación? Busco compañeros para desarrollar una app.",
    authorId: student1.id,
    groupId: clubGroup.id,
    visibility: "public",
  }).returning().then(r => r[0]);

  const post4 = await db.insert(posts).values({
    id: "post-4",
    content: "Acabo de terminar la lectura del libro asignado. Las preguntas de reflexión están muy interesantes.",
    authorId: student2.id,
    grade: "10",
    visibility: "public",
  }).returning().then(r => r[0]);

  const post5 = await db.insert(posts).values({
    id: "post-5",
    content: "Practicamos fútbol ayer y fue genial. ¡Los próximos entrenamientos serán aún mejores!",
    authorId: student3.id,
    groupId: sportsGroup.id,
    visibility: "public",
  }).returning().then(r => r[0]);

  console.log("✅ Posts creados");

  // Create comments
  await db.insert(comments).values([
    {
      id: "comment-1",
      content: "¡Excelente iniciativa! Estoy emocionado de ser parte de esta comunidad.",
      postId: post1.id,
      authorId: student1.id,
    },
    {
      id: "comment-2",
      content: "Gracias por los apuntes, profesor. Son muy claros.",
      postId: post2.id,
      authorId: student2.id,
    },
    {
      id: "comment-3",
      content: "Yo estoy interesado. ¿Qué tipo de proyecto tenías en mente?",
      postId: post3.id,
      authorId: student3.id,
    },
  ]);

  console.log("✅ Comentarios creados");

  // Create reactions
  await db.insert(reactions).values([
    { id: "react-1", postId: post1.id, userId: student1.id, type: "like" },
    { id: "react-2", postId: post1.id, userId: student2.id, type: "like" },
    { id: "react-3", postId: post2.id, userId: student1.id, type: "like" },
    { id: "react-4", postId: post3.id, userId: student2.id, type: "like" },
    { id: "react-5", postId: post5.id, userId: student1.id, type: "like" },
  ]);

  console.log("✅ Reacciones creadas");

  // Create files
  await db.insert(files).values([
    {
      id: "file-1",
      fileName: "Apuntes_Matematicas_Unidad1.pdf",
      fileUrl: "/uploads/apuntes-math-1.pdf",
      storageKey: "apuntes-math-1",
      fileType: "pdf",
      fileSize: 2048,
      subject: "Matemáticas",
      description: "Apuntes de la unidad 1 de matemáticas",
      uploaderId: teacherUser.id,
      visibility: "public",
      approved: true,
    },
    {
      id: "file-2",
      fileName: "Guia_Estudio_Historia.docx",
      fileUrl: "/uploads/guide-history.docx",
      storageKey: "guide-history",
      fileType: "docx",
      fileSize: 1024,
      subject: "Historia",
      description: "Guía de estudio para el parcial",
      uploaderId: student1.id,
      visibility: "public",
      approved: true,
    },
  ]);

  console.log("✅ Archivos creados");

  // Create events (tutoring sessions)
  const event1 = await db.insert(events).values({
    id: "event-1",
    title: "Asesoría de Matemáticas",
    description: "Repaso de ecuaciones cuadráticas",
    hostId: teacherUser.id,
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 90000000),
    capacity: 5,
    videoUrl: "https://meet.google.com/abc-xyz",
  }).returning().then(r => r[0]);

  const event2 = await db.insert(events).values({
    id: "event-2",
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
    { id: "participant-1", eventId: event1.id, userId: student1.id },
    { id: "participant-2", eventId: event1.id, userId: student2.id },
    { id: "participant-3", eventId: event2.id, userId: student3.id },
  ]);

  console.log("✅ Participantes de eventos agregados");

  // Assign badges
  await db.insert(userBadges).values([
    { id: "ub-1", userId: student1.id, badgeId: badgeIntellect.id },
    { id: "ub-2", userId: student1.id, badgeId: badgeCollab.id },
    { id: "ub-3", userId: student2.id, badgeId: badgeCollab.id },
  ]);

  console.log("✅ Badges asignados a usuarios");

  console.log("🎉 ¡Seed completado exitosamente!");
}

seed().catch(console.error);
