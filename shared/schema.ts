import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Liste des équipements pour la visite des réservoirs
export const visiteEquipements = [
  "Cuve / Réservoir",
  "Couvercle / Trappe",
  "Joint d'étanchéité",
  "Trop-plein",
  "Ventilation",
  "Canalisation d'arrivée",
  "Canalisation de départ",
  "Robinet flotteur",
  "Vanne d'arrêt",
  "Crépine",
  "Échelle / Crosse",
  "Clôture / Portail",
  "Local technique",
  "Compteur",
  "Chloration",
  "Instrumentation",
] as const;

// Schéma Zod pour les données du rapport template
export const visiteItemSchema = z.object({
  bon: z.boolean().default(false),
  observations: z.string().default(""),
});

export const templateDataSchema = z.object({
  // En-tête
  commune: z.string().default(""),
  numeroCuve: z.string().default(""),
  nomReservoir: z.string().default(""),
  volume: z.string().default(""),
  date: z.string().default(""),
  heureDebut: z.string().default(""),
  heureFin: z.string().default(""),

  // Nettoyage
  motifEntretienAnnuel: z.boolean().default(false),
  motifAutres: z.string().default(""),
  typeChimique: z.boolean().default(false),
  typeAutres: z.string().default(""),
  produitsEmployes: z.string().default(""),
  quantite: z.string().default(""),

  // Intervenants
  equipeLDE: z.boolean().default(false),
  sousTraitant: z.boolean().default(false),
  nomsAgents: z.string().default(""),
  nomEntreprise: z.string().default(""),

  // Observations
  etatEncrassement: z.number().min(1).max(5).default(1),
  observations: z.string().default(""),

  // Établi par (nettoyage)
  etabliParNettoyage: z.string().default(""),

  // Contrôles qualité
  dateAnalyse: z.string().default(""),
  chloreResiduel: z.string().default(""),
  observationsControle: z.string().default(""),
  bacterioConforme: z.boolean().default(false),
  bacterioNonConforme: z.boolean().default(false),

  // Établi par (contrôles)
  etabliParControles: z.string().default(""),

  // Visite - 16 équipements
  visite: z.record(z.string(), visiteItemSchema).default({}),
});

export type TemplateData = z.infer<typeof templateDataSchema>;

export const missionStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
export type MissionStatus = typeof missionStatuses[number];

export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  budget: integer("budget"),
  status: text("status").notNull().default("pending"),
  location: text("location"),
  notes: text("notes"),
  templateData: jsonb("template_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMissionSchema = createInsertSchema(missions, {
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  templateData: templateDataSchema.nullable().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

export const documentTypes = ["text", "file"] as const;
export type DocumentType = typeof documentTypes[number];

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("text"),
  content: text("content"),
  fileName: text("file_name"),
  fileData: text("file_data"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
