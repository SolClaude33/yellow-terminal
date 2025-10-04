import { type User, type InsertUser, type WalletProfile, type InsertWalletProfile } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet Profile CRUD operations
  getWalletProfile(walletAddress: string): Promise<WalletProfile | undefined>;
  getWalletProfileByUsername(username: string): Promise<WalletProfile | undefined>;
  createWalletProfile(profile: InsertWalletProfile): Promise<WalletProfile>;
  updateWalletProfile(walletAddress: string, updates: Partial<InsertWalletProfile>): Promise<WalletProfile | undefined>;
  deleteWalletProfile(walletAddress: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private walletProfiles: Map<string, WalletProfile>;

  constructor() {
    this.users = new Map();
    this.walletProfiles = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Wallet Profile Methods
  async getWalletProfile(walletAddress: string): Promise<WalletProfile | undefined> {
    return this.walletProfiles.get(walletAddress);
  }

  async getWalletProfileByUsername(username: string): Promise<WalletProfile | undefined> {
    return Array.from(this.walletProfiles.values()).find(
      (profile) => profile.username === username,
    );
  }

  async createWalletProfile(insertProfile: InsertWalletProfile): Promise<WalletProfile> {
    // Check for duplicate wallet address
    if (this.walletProfiles.has(insertProfile.walletAddress)) {
      throw new Error(`Wallet address ${insertProfile.walletAddress} already exists`);
    }

    // Check for duplicate username
    const existingUsername = Array.from(this.walletProfiles.values()).find(
      (p) => p.username === insertProfile.username
    );
    if (existingUsername) {
      throw new Error(`Username ${insertProfile.username} already exists`);
    }

    const id = randomUUID();
    const now = new Date();
    const profile: WalletProfile = {
      id,
      walletAddress: insertProfile.walletAddress,
      username: insertProfile.username,
      solBalance: insertProfile.solBalance ?? "0",
      usdBalance: insertProfile.usdBalance ?? "0",
      pnl24h: insertProfile.pnl24h ?? "0",
      topHoldings: (insertProfile.topHoldings ?? []) as Array<{
        symbol: string;
        name: string;
        balance: string;
        usdValue: string;
      }>,
      createdAt: now,
      updatedAt: now,
    };
    this.walletProfiles.set(insertProfile.walletAddress, profile);
    return profile;
  }

  async updateWalletProfile(
    walletAddress: string,
    updates: Partial<InsertWalletProfile>
  ): Promise<WalletProfile | undefined> {
    const existing = this.walletProfiles.get(walletAddress);
    if (!existing) return undefined;

    // Check for username uniqueness if updating username
    if (updates.username && updates.username !== existing.username) {
      const existingUsername = Array.from(this.walletProfiles.values()).find(
        (p) => p.username === updates.username
      );
      if (existingUsername) {
        throw new Error(`Username ${updates.username} already exists`);
      }
    }

    const updated: WalletProfile = {
      ...existing,
      ...updates,
      topHoldings: (updates.topHoldings ?? existing.topHoldings) as Array<{
        symbol: string;
        name: string;
        balance: string;
        usdValue: string;
      }>,
      walletAddress: existing.walletAddress,
      updatedAt: new Date(),
    };
    this.walletProfiles.set(walletAddress, updated);
    return updated;
  }

  async deleteWalletProfile(walletAddress: string): Promise<boolean> {
    return this.walletProfiles.delete(walletAddress);
  }
}

export const storage = new MemStorage();
