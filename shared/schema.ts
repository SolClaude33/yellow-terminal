import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
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

// BSC Wallet Profiles (wallet address is the primary identity)
export const walletProfiles = pgTable("wallet_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username").notNull().unique(),
  solBalance: decimal("sol_balance", { precision: 18, scale: 9 }).notNull().default("0"),
  usdBalance: decimal("usd_balance", { precision: 18, scale: 2 }).notNull().default("0"),
  pnl24h: decimal("pnl_24h", { precision: 18, scale: 2 }).notNull().default("0"),
  topHoldings: jsonb("top_holdings").$type<Array<{
    symbol: string;
    name: string;
    balance: string;
    usdValue: string;
  }>>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWalletProfileSchema = createInsertSchema(walletProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWalletProfile = z.infer<typeof insertWalletProfileSchema>;
export type WalletProfile = typeof walletProfiles.$inferSelect;
