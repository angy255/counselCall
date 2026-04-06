import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { COOKIE_NAME } from "../config/constants";
import { comparePassword, hashPassword, signToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.nativeEnum(Role),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const router = Router();

router.post("/register", validateBody(registerSchema), async (req, res) => {
  const { email, password, name, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      name,
      role,
      attorneyProfile:
        role === Role.ATTORNEY
          ? {
              create: {
                bio: "",
                practiceAreas: [],
                hourlyRate: 0,
                photoUrl: null,
              },
            }
          : undefined,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return res.status(201).json({ user });
});

router.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

router.post("/logout", requireAuth, async (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.json({ success: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
});

export default router;
