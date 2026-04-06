import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  adminUser?: { username: string };
  userId?: string;
  userUsername?: string;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server misconfiguration: JWT_SECRET missing" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as {
      username?: string;
      userId?: string;
      type?: string;
    };

    if (payload.type === "user" && payload.userId) {
      req.userId = payload.userId;
      req.userUsername = payload.username;
    } else if (payload.username) {
      req.adminUser = { username: payload.username };
    }

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Allows unauthenticated requests through — just sets userId if a valid token is present
export function optionalAuthMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // guest — no userId set
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) return next();

  try {
    const payload = jwt.verify(token, secret) as {
      username?: string;
      userId?: string;
      type?: string;
    };
    if (payload.type === "user" && payload.userId) {
      req.userId = payload.userId;
      req.userUsername = payload.username;
    }
  } catch {
    // invalid token — treat as guest
  }
  next();
}

export function adminAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  authMiddleware(req, res, () => {
    if (!req.adminUser) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}
