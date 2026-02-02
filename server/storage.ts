import { type Mission, type InsertMission, missions } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAllMissions(): Promise<Mission[]>;
  getMission(id: string): Promise<Mission | undefined>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, mission: Partial<InsertMission>): Promise<Mission | undefined>;
  deleteMission(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAllMissions(): Promise<Mission[]> {
    return db.select().from(missions).orderBy(desc(missions.createdAt));
  }

  async getMission(id: string): Promise<Mission | undefined> {
    const [mission] = await db.select().from(missions).where(eq(missions.id, id));
    return mission;
  }

  async createMission(mission: InsertMission): Promise<Mission> {
    const [created] = await db.insert(missions).values(mission).returning();
    return created;
  }

  async updateMission(id: string, mission: Partial<InsertMission>): Promise<Mission | undefined> {
    const [updated] = await db
      .update(missions)
      .set({ ...mission, updatedAt: new Date() })
      .where(eq(missions.id, id))
      .returning();
    return updated;
  }

  async deleteMission(id: string): Promise<boolean> {
    const result = await db.delete(missions).where(eq(missions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
