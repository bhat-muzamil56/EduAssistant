import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, chatSessionsTable, chatMessagesTable, passwordResetTokensTable } from "@workspace/db/schema";
import { eq, and, gt, count } from "drizzle-orm";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

const SignupBody = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email(),
  password: z.string().min(6),
});

const LoginBody = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

function signToken(userId: string, username: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.sign({ userId, username, type: "user" }, secret, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { username, email, password } = parsed.data;

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const existingUsername = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existingUsername.length > 0) {
    res.status(409).json({ error: "This username is already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ username, email: email.toLowerCase(), passwordHash })
    .returning();

  const token = signToken(user.id, user.username);
  res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username/email and password are required" });
    return;
  }

  const { usernameOrEmail, password } = parsed.data;

  const isEmail = usernameOrEmail.includes("@");
  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isEmail
        ? eq(usersTable.email, usernameOrEmail.toLowerCase())
        : eq(usersTable.username, usernameOrEmail)
    )
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() });
});

// Change password
router.patch("/password", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Current password and new password (min 6 chars) are required" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Current password is incorrect" }); return; }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

// Forgot password — generates a secure 8-char uppercase token
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "A valid email address is required" }); return;
  }

  const [user] = await db.select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);

  if (!user) {
    res.status(404).json({ error: "No account found with this email address" }); return;
  }

  const token = crypto.randomBytes(4).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });

  res.json({ resetToken: token, message: "Reset token generated. Use it within 1 hour." });
});

// Reset password using the token
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Token and new password (min 6 chars) are required" }); return;
  }

  const [resetEntry] = await db.select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token.trim().toUpperCase()),
        eq(passwordResetTokensTable.used, false),
        gt(passwordResetTokensTable.expiresAt, new Date())
      )
    ).limit(1);

  if (!resetEntry) {
    res.status(400).json({ error: "Invalid or expired reset token. Please request a new one." }); return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, resetEntry.userId));
  await db.update(passwordResetTokensTable).set({ used: true }).where(eq(passwordResetTokensTable.id, resetEntry.id));

  res.json({ success: true, message: "Password reset successfully. You can now sign in." });
});

// Profile stats
router.get("/profile", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [sessionCount] = await db.select({ count: count() }).from(chatSessionsTable).where(eq(chatSessionsTable.userId, userId));
  const userSessions = await db.select({ id: chatSessionsTable.id }).from(chatSessionsTable).where(eq(chatSessionsTable.userId, userId));
  
  let totalMessages = 0;
  if (userSessions.length > 0) {
    const sessionIds = userSessions.map(s => s.id);
    for (const sessionId of sessionIds) {
      const [msgCount] = await db.select({ count: count() }).from(chatMessagesTable).where(eq(chatMessagesTable.sessionId, sessionId));
      totalMessages += Number(msgCount.count);
    }
  }

  res.json({
    username: user.username,
    email: user.email,
    joinedAt: user.createdAt.toISOString(),
    totalSessions: Number(sessionCount.count),
    totalMessages,
  });
});

// Delete account and all associated data
router.delete("/account", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userSessions = await db
    .select({ id: chatSessionsTable.id })
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, userId));

  for (const session of userSessions) {
    await db.delete(chatMessagesTable).where(eq(chatMessagesTable.sessionId, session.id));
  }
  await db.delete(chatSessionsTable).where(eq(chatSessionsTable.userId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  res.json({ success: true });
});

export default router;
