import { type Mission, type InsertMission, missions, type Document, type InsertDocument, documents, type Signature, signatures } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAllMissions(): Promise<Mission[]>;
  getMission(id: string): Promise<Mission | undefined>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, mission: Partial<InsertMission>): Promise<Mission | undefined>;
  deleteMission(id: string): Promise<boolean>;

  getAllDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  getSignatureByName(name: string): Promise<Signature | undefined>;
  upsertSignature(name: string, data: string): Promise<Signature>;
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

  async getAllDocuments(): Promise<Document[]> {
    return db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSignatureByName(name: string): Promise<Signature | undefined> {
    const normalized = name.trim().toLowerCase();
    const [sig] = await db.select().from(signatures).where(eq(signatures.name, normalized));
    return sig;
  }

  async upsertSignature(name: string, data: string): Promise<Signature> {
    const normalized = name.trim().toLowerCase();
    const existing = await this.getSignatureByName(normalized);
    if (existing) {
      const [updated] = await db
        .update(signatures)
        .set({ data, updatedAt: new Date() })
        .where(eq(signatures.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(signatures).values({ name: normalized, data }).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
