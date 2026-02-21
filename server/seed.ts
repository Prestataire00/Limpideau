import { db } from "./db";
import { missions, users } from "@shared/schema";
import { hashPassword } from "./auth";
import { storage } from "./storage";

const seedMissions = [
  {
    title: "Refonte site e-commerce",
    clientName: "Boutique Élégance",
    clientEmail: "contact@boutique-elegance.fr",
    clientPhone: "+33 1 42 36 78 90",
    description: "Refonte complète du site e-commerce avec nouveau design responsive, intégration du système de paiement Stripe, et optimisation SEO. Le client souhaite un design moderne et épuré avec une expérience utilisateur améliorée.",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-03-30"),
    budget: 15000,
    status: "in_progress",
    location: "Paris, France",
    notes: "Client très exigeant sur les délais. Réunion hebdomadaire le mardi à 10h.",
  },
  {
    title: "Application mobile de livraison",
    clientName: "FastFood Express",
    clientEmail: "tech@fastfood-express.com",
    clientPhone: "+33 6 12 34 56 78",
    description: "Développement d'une application mobile iOS et Android pour la commande et le suivi de livraison en temps réel. Intégration avec le système POS existant.",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-06-15"),
    budget: 45000,
    status: "pending",
    location: "Lyon, France",
    notes: "Attente de la validation du cahier des charges par le directeur technique.",
  },
  {
    title: "Audit sécurité infrastructure",
    clientName: "Banque Sécurité Plus",
    clientEmail: "securite@bsp-banque.fr",
    clientPhone: "+33 1 55 66 77 88",
    description: "Audit complet de l'infrastructure informatique, tests de pénétration, et rédaction d'un rapport détaillé avec recommandations de sécurité.",
    startDate: new Date("2023-11-01"),
    endDate: new Date("2023-12-15"),
    budget: 25000,
    status: "completed",
    location: "Marseille, France",
    notes: "Mission terminée avec succès. Rapport final livré le 10 décembre.",
  },
  {
    title: "Formation équipe développement",
    clientName: "StartupTech Innovation",
    clientEmail: "rh@startuptech.io",
    clientPhone: "+33 7 89 01 23 45",
    description: "Formation intensive de 5 jours sur les bonnes pratiques de développement React et TypeScript pour une équipe de 8 développeurs.",
    startDate: new Date("2024-03-04"),
    endDate: new Date("2024-03-08"),
    budget: 8000,
    status: "pending",
    location: "Bordeaux, France",
    notes: "Prévoir supports de formation et exercices pratiques.",
  },
  {
    title: "Maintenance site vitrine",
    clientName: "Cabinet Avocat Martin",
    clientEmail: "cabinet@avocat-martin.fr",
    clientPhone: "+33 5 56 78 90 12",
    description: "Maintenance mensuelle du site vitrine incluant mises à jour de sécurité, backup, et modifications mineures de contenu.",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    budget: 3600,
    status: "in_progress",
    location: "Toulouse, France",
    notes: "Contrat annuel renouvelable. Facturation mensuelle de 300€.",
  },
];

export async function seed() {
  try {
    // Seed admin user if no users exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log("Seeding default admin user...");
      await storage.createUser({
        username: "admin",
        password: hashPassword("admin123"),
        role: "admin",
        fullName: "Administrateur",
      });
      console.log("Admin user created (admin / admin123)");
    }

    const existingMissions = await db.select().from(missions).limit(1);
    if (existingMissions.length > 0) {
      console.log("Database already seeded, skipping missions...");
      return;
    }

    console.log("Seeding database with sample missions...");
    await db.insert(missions).values(seedMissions);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
