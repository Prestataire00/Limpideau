import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("salarie"),
  fullName: text("full_name").notNull().default(""),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  fullName: true,
  email: true,
  phone: true,
  address: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Liste des équipements pour la visite des réservoirs (conforme EP 9001-1)
export const visiteEquipements = [
  "Gouttières",
  "Portes",
  "Fenêtres",
  "Echelles",
  "Rambardes",
  "Trappes d'accès",
  "Canalisations",
  "Vannes",
  "Crépines",
  "Grilles de ventilation",
  "Flotteur",
  "Poires de niveau",
  "Sondes de niveau",
  "Eclairages",
  "Equipements tiers",
  "Equipements sécurité",
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
  produitsEmployes: z.preprocess(
    (val) => Array.isArray(val) ? val : typeof val === "string" && val ? [val] : [],
    z.array(z.string())
  ).default([]),
  quantite: z.string().default(""),

  // Intervenants
  equipeLDE: z.boolean().default(false),
  sousTraitant: z.boolean().default(false),
  nomsAgents: z.preprocess(
    (val) => Array.isArray(val) ? val : typeof val === "string" && val ? [val] : [],
    z.array(z.string())
  ).default([]),
  nomsEntreprises: z.preprocess(
    (val) => Array.isArray(val) ? val : typeof val === "string" && val ? [val] : ["Limpid'EAU"],
    z.array(z.string())
  ).default(["Limpid'EAU"]),

  // Observations
  etatEncrassement: z.number().min(1).max(5).default(1),
  observations: z.string().default(""),

  // Établi par (nettoyage)
  etabliParNettoyage: z.string().default(""),
  signatureNettoyage: z.string().default(""), // base64 PNG data URL

  // Contrôles qualité
  dateAnalyse: z.string().default(""),
  chloreResiduel: z.string().default(""),
  observationsControle: z.string().default(""),
  bacterioConforme: z.boolean().default(false),
  bacterioNonConforme: z.boolean().default(false),

  // Établi par (contrôles)
  etabliParControles: z.string().default(""),
  signatureControles: z.string().default(""), // base64 PNG data URL

  // Photos avant/après (base64 data URLs, 2 max chaque)
  photosAvant: z.array(z.string()).default([]),
  photosApres: z.array(z.string()).default([]),

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

// Table des signatures mémorisées par nom
export const signatures = pgTable("signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  data: text("data").notNull(), // base64 PNG data URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Signature = typeof signatures.$inferSelect;

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
