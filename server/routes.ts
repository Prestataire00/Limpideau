import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMissionSchema, insertDocumentSchema, templateDataSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all missions
  app.get("/api/missions", async (req, res) => {
    try {
      const missions = await storage.getAllMissions();
      res.json(missions);
    } catch (error) {
      console.error("Error fetching missions:", error);
      res.status(500).json({ error: "Failed to fetch missions" });
    }
  });

  // Get single mission
  app.get("/api/missions/:id", async (req, res) => {
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
  app.post("/api/missions", async (req, res) => {
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
  app.patch("/api/missions/:id", async (req, res) => {
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
  app.get("/api/missions/:id/template-data", async (req, res) => {
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
  app.put("/api/missions/:id/template-data", async (req, res) => {
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
  app.delete("/api/missions/:id", async (req, res) => {
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
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get single document
  app.get("/api/documents/:id", async (req, res) => {
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
  app.post("/api/documents", async (req, res) => {
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
  app.patch("/api/documents/:id", async (req, res) => {
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
  app.delete("/api/documents/:id", async (req, res) => {
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
  app.get("/api/signatures/:name", async (req, res) => {
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
  app.put("/api/signatures/:name", async (req, res) => {
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
  app.get("/api/extractions/daily", async (req, res) => {
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

  return httpServer;
}
