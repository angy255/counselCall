import { BookingStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import {
  getCachedAvailability,
  setCachedAvailability,
} from "../cache/redis";
import { prisma } from "../lib/prisma";
import { addMinutes, isValidTime, isWithinRange, toDateOnly } from "../lib/time";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

const createBookingSchema = z.object({
  attorneyId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.union([z.literal(30), z.literal(60)]),
  notes: z.string().max(2000).optional(),
});

async function getDailyAvailability(attorneyId: string, date: string) {
  const cached = await getCachedAvailability(attorneyId, date);
  if (cached) {
    return cached;
  }

  const dateObj = new Date(`${date}T00:00:00.000Z`);
  const dayOfWeek = dateObj.getUTCDay();

  const [ranges, blocked] = await Promise.all([
    prisma.availability.findMany({
      where: { attorneyId, dayOfWeek },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedDate.findFirst({
      where: { attorneyId, date: dateObj },
      select: { id: true },
    }),
  ]);

  const value = {
    isBlocked: Boolean(blocked),
    ranges,
  };

  await setCachedAvailability(attorneyId, date, value);
  return value;
}

router.post(
  "/",
  requireAuth,
  requireRole(Role.CLIENT),
  validateBody(createBookingSchema),
  async (req, res) => {
    const { attorneyId, date, startTime, durationMinutes, notes } = req.body;

    if (!isValidTime(startTime)) {
      return res.status(400).json({ error: "Invalid startTime format" });
    }

    const endTime = addMinutes(startTime, durationMinutes);
    const dateOnly = toDateOnly(date);

    const attorney = await prisma.user.findFirst({
      where: { id: attorneyId, role: Role.ATTORNEY },
      select: { id: true },
    });
    if (!attorney) {
      return res.status(404).json({ error: "Attorney not found" });
    }

    const availability = await getDailyAvailability(attorneyId, dateOnly);
    if (availability.isBlocked) {
      return res.status(400).json({ error: "Attorney is unavailable on this date" });
    }

    const slotAllowed = availability.ranges.some((range) =>
      isWithinRange(startTime, endTime, range.startTime, range.endTime),
    );
    if (!slotAllowed) {
      return res
        .status(400)
        .json({ error: "Selected time is outside attorney availability" });
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        attorneyId,
        date: new Date(`${dateOnly}T00:00:00.000Z`),
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });

    if (conflict) {
      return res.status(409).json({
        error: "This time slot is already taken. Please choose another slot.",
      });
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: req.user!.id,
        attorneyId,
        date: new Date(`${dateOnly}T00:00:00.000Z`),
        startTime,
        endTime,
        status: BookingStatus.PENDING,
        notes: notes || null,
      },
    });

    return res.status(201).json({ booking });
  },
);

export default router;
