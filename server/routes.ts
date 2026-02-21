import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMissionSchema, insertDocumentSchema, templateDataSchema, insertInterventionDaySchema } from "@shared/schema";
import { requireAuth, requireAdmin, hashPassword } from "./auth";
import { sendReportEmail } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all missions
  app.get("/api/missions", requireAuth, async (req, res) => {
    try {
      const missions = await storage.getAllMissions();
      res.json(missions);
    } catch (error) {
      console.error("Error fetching missions:", error);
      res.status(500).json({ error: "Failed to fetch missions" });
    }
  });

  // Get single mission
  app.get("/api/missions/:id", requireAuth, async (req, res) => {
    try {
      const mission = await storage.getMission(req.params.id);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      res.json(mission);
    } catch (error) {
      console.error("Error fetching mission:", error);
      res.status(500).json({ error: "Failed to fetch mission" });
    }
  });

  // Create mission
  app.post("/api/missions", requireAdmin, async (req, res) => {
    try {
      const parsed = insertMissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid mission data", details: parsed.error });
      }
      const mission = await storage.createMission(parsed.data);
      res.status(201).json(mission);
    } catch (error) {
      console.error("Error creating mission:", error);
      res.status(500).json({ error: "Failed to create mission" });
    }
  });

  // Update mission
  app.patch("/api/missions/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = insertMissionSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid mission data", details: parsed.error });
      }
      const mission = await storage.updateMission(req.params.id, parsed.data);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      res.json(mission);
    } catch (error) {
      console.error("Error updating mission:", error);
      res.status(500).json({ error: "Failed to update mission" });
    }
  });

  // Get template data for a mission
  app.get("/api/missions/:id/template-data", requireAuth, async (req, res) => {
    try {
      const mission = await storage.getMission(req.params.id);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      const data = mission.templateData
        ? templateDataSchema.parse(mission.templateData)
        : templateDataSchema.parse({});
      res.json(data);
    } catch (error) {
      console.error("Error fetching template data:", error);
      res.status(500).json({ error: "Failed to fetch template data" });
    }
  });

  // Save template data for a mission
  app.put("/api/missions/:id/template-data", requireAuth, async (req, res) => {
    try {
      const mission = await storage.getMission(req.params.id);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      const parsed = templateDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid template data", details: parsed.error });
      }
      const td = parsed.data;

      // Auto-fill mission fields from rapport data
      const missionUpdate: Record<string, any> = {
        templateData: td,
      };
      if (td.nomReservoir || td.commune) {
        missionUpdate.title = `Nettoyage ${td.nomReservoir || ""}${td.nomReservoir && td.commune ? " - " : ""}${td.commune || ""}`.trim();
      }
      if (td.commune) {
        missionUpdate.location = td.commune;
        missionUpdate.clientName = (td.nomsEntreprises?.length ? td.nomsEntreprises[0] : "") || td.commune;
      }
      if (td.date) {
        const parsedDate = new Date(td.date);
        if (!isNaN(parsedDate.getTime())) {
          missionUpdate.startDate = parsedDate;
        }
      }
      if (td.observations) {
        missionUpdate.description = td.observations;
      }

      const updated = await storage.updateMission(req.params.id, missionUpdate as any);
      res.json(parsed.data);
    } catch (error) {
      console.error("Error saving template data:", error);
      res.status(500).json({ error: "Failed to save template data" });
    }
  });

  // Delete mission
  app.delete("/api/missions/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteMission(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Mission not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mission:", error);
      res.status(500).json({ error: "Failed to delete mission" });
    }
  });

  // Get all documents
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get single document
  app.get("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Create document
  app.post("/api/documents", requireAuth, async (req, res) => {
    try {
      const parsed = insertDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid document data", details: parsed.error });
      }
      const document = await storage.createDocument(parsed.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  // Update document
  app.patch("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertDocumentSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid document data", details: parsed.error });
      }
      const document = await storage.updateDocument(req.params.id, parsed.data);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Get signature by name
  app.get("/api/signatures/:name", requireAuth, async (req, res) => {
    try {
      const sig = await storage.getSignatureByName(req.params.name);
      if (!sig) {
        return res.status(404).json({ error: "Signature not found" });
      }
      res.json(sig);
    } catch (error) {
      console.error("Error fetching signature:", error);
      res.status(500).json({ error: "Failed to fetch signature" });
    }
  });

  // Save signature for a name
  app.put("/api/signatures/:name", requireAuth, async (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: "Missing signature data" });
      }
      const sig = await storage.upsertSignature(req.params.name, data);
      res.json(sig);
    } catch (error) {
      console.error("Error saving signature:", error);
      res.status(500).json({ error: "Failed to save signature" });
    }
  });

  // Get completed missions with reports for a given date
  app.get("/api/extractions/daily", requireAuth, async (req, res) => {
    try {
      const date = req.query.date as string;
      if (!date) {
        return res.status(400).json({ error: "Missing date parameter" });
      }
      const results = await storage.getCompletedMissionsByDate(date);
      res.json(results);
    } catch (error) {
      console.error("Error fetching daily extraction:", error);
      res.status(500).json({ error: "Failed to fetch daily extraction" });
    }
  });

  // Send report by email
  app.post("/api/missions/:id/send-email", requireAuth, async (req, res) => {
    try {
      const mission = await storage.getMission(req.params.id as string);
      if (!mission) {
        return res.status(404).json({ error: "Mission non trouvée" });
      }
      const { to, pdfBase64 } = req.body;
      if (!to || !pdfBase64) {
        return res.status(400).json({ error: "Destinataire et PDF requis" });
      }
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const filename = `Rapport_${mission.title?.replace(/[^a-zA-Z0-9]/g, "_") || "mission"}.pdf`;

      await sendReportEmail({
        to,
        subject: `Rapport de mission - ${mission.title}`,
        text: `Veuillez trouver ci-joint le rapport de la mission "${mission.title}".\n\nCordialement,\nLimpid'EAU`,
        pdfBuffer,
        pdfFilename: filename,
      });

      res.json({ message: "Email envoyé avec succès" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Échec de l'envoi de l'email" });
    }
  });

  // ===== User management routes (admin only) =====

  // Get all users
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const safeUsers = allUsers.map(({ password, ...u }) => u);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create user
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const { username, password, role, fullName, email, phone, address } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Identifiant et mot de passe requis" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ error: "Cet identifiant est déjà utilisé" });
      }
      const user = await storage.createUser({
        username,
        password: hashPassword(password),
        role: role || "salarie",
        fullName: fullName || "",
        email: email || null,
        phone: phone || null,
        address: address || null,
      });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user
  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { username, password, role, fullName, email, phone, address } = req.body;
      const updateData: Record<string, any> = {};
      if (username !== undefined) updateData.username = username;
      if (password) updateData.password = hashPassword(password);
      if (role !== undefined) updateData.role = role;
      if (fullName !== undefined) updateData.fullName = fullName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;

      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      // Prevent deleting self
      if (req.params.id === req.user?.id) {
        return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
      }
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ===== Intervention days routes =====

  // Get intervention days by date range (for calendar view)
  app.get("/api/intervention-days", requireAuth, async (req, res) => {
    try {
      const start = req.query.start as string;
      const end = req.query.end as string;
      if (!start || !end) {
        return res.status(400).json({ error: "Missing start or end parameter" });
      }
      const days = await storage.getInterventionDaysByDateRange(start, end);
      res.json(days);
    } catch (error) {
      console.error("Error fetching intervention days:", error);
      res.status(500).json({ error: "Failed to fetch intervention days" });
    }
  });

  // Get intervention days for a mission
  app.get("/api/missions/:id/intervention-days", requireAuth, async (req, res) => {
    try {
      const days = await storage.getInterventionDaysByMission(req.params.id);
      res.json(days);
    } catch (error) {
      console.error("Error fetching intervention days:", error);
      res.status(500).json({ error: "Failed to fetch intervention days" });
    }
  });

  // Create intervention day (admin only)
  app.post("/api/missions/:id/intervention-days", requireAdmin, async (req, res) => {
    try {
      const parsed = insertInterventionDaySchema.safeParse({
        ...req.body,
        missionId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const day = await storage.createInterventionDay(parsed.data);
      res.status(201).json(day);
    } catch (error) {
      console.error("Error creating intervention day:", error);
      res.status(500).json({ error: "Failed to create intervention day" });
    }
  });

  // Delete intervention day (admin only)
  app.delete("/api/intervention-days/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteInterventionDay(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Intervention day not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting intervention day:", error);
      res.status(500).json({ error: "Failed to delete intervention day" });
    }
  });

  return httpServer;
}
