import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMissionSchema } from "@shared/schema";

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

  return httpServer;
}
