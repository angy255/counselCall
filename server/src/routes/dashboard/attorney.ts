import { Router } from "express";
import { BookingStatus, Role } from "@prisma/client";
import { z } from "zod";
import { invalidateAttorneyAvailabilityCache } from "../../cache/redis";
import { PRACTICE_AREAS } from "../../config/constants";
import { prisma } from "../../lib/prisma";
import { requireStripe } from "../../lib/stripe";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";

const router = Router();

const profileSchema = z.object({
  bio: z.string().max(2000),
  practiceAreas: z.array(z.enum(PRACTICE_AREAS)).min(1),
  hourlyRate: z.number().nonnegative(),
  photoUrl: z.string().url().nullable().optional(),
});

const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const bookingStatusSchema = z.object({
  status: z.enum([BookingStatus.CONFIRMED, BookingStatus.CANCELLED]),
});

function errorMessage(
  error: unknown,
  fallback: string,
) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}

router.use(requireAuth, requireRole(Role.ATTORNEY));

router.get("/profile", async (req, res) => {
  const profile = await prisma.attorneyProfile.findUnique({
    where: { userId: req.user!.id },
  });

  if (!profile) {
    return res.status(404).json({ error: "Attorney profile not found" });
  }

  return res.json({ profile });
});

router.put("/profile", validateBody(profileSchema), async (req, res) => {
  const { bio, practiceAreas, hourlyRate, photoUrl } = req.body;

  const profile = await prisma.attorneyProfile.upsert({
    where: { userId: req.user!.id },
    create: {
      userId: req.user!.id,
      bio,
      practiceAreas,
      hourlyRate,
      photoUrl: photoUrl ?? null,
    },
    update: {
      bio,
      practiceAreas,
      hourlyRate,
      photoUrl: photoUrl ?? null,
    },
  });

  return res.json({ profile });
});

router.get("/availability", async (req, res) => {
  const availability = await prisma.availability.findMany({
    where: { attorneyId: req.user!.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return res.json({ availability });
});

router.post(
  "/availability",
  validateBody(availabilitySchema),
  async (req, res) => {
    const { dayOfWeek, startTime, endTime } = req.body;

    if (startTime >= endTime) {
      return res
        .status(400)
        .json({ error: "startTime must be before endTime" });
    }

    const created = await prisma.availability.create({
      data: {
        attorneyId: req.user!.id,
        dayOfWeek,
        startTime,
        endTime,
      },
    });
    await invalidateAttorneyAvailabilityCache(req.user!.id);

    return res.status(201).json({ availability: created });
  },
);

router.put(
  "/availability/:id",
  validateBody(availabilitySchema),
  async (req, res) => {
    const availabilityId = String(req.params.id);
    const existing = await prisma.availability.findFirst({
      where: {
        id: availabilityId,
        attorneyId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Availability entry not found" });
    }

    const { dayOfWeek, startTime, endTime } = req.body;
    if (startTime >= endTime) {
      return res
        .status(400)
        .json({ error: "startTime must be before endTime" });
    }

    const updated = await prisma.availability.update({
      where: { id: availabilityId },
      data: { dayOfWeek, startTime, endTime },
    });
    await invalidateAttorneyAvailabilityCache(req.user!.id);

    return res.json({ availability: updated });
  },
);

router.delete("/availability/:id", async (req, res) => {
  const availabilityId = String(req.params.id);
  const existing = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      attorneyId: req.user!.id,
    },
  });
  if (!existing) {
    return res.status(404).json({ error: "Availability entry not found" });
  }

  await prisma.availability.delete({ where: { id: availabilityId } });
  await invalidateAttorneyAvailabilityCache(req.user!.id);
  return res.status(204).send();
});

router.get("/blocked-dates", async (req, res) => {
  const blockedDates = await prisma.blockedDate.findMany({
    where: { attorneyId: req.user!.id },
    orderBy: { date: "asc" },
  });

  return res.json({ blockedDates });
});

router.post(
  "/blocked-dates",
  validateBody(blockedDateSchema),
  async (req, res) => {
    const { date } = req.body;
    const blockedDate = await prisma.blockedDate.create({
      data: {
        attorneyId: req.user!.id,
        date: new Date(date),
      },
    });
    await invalidateAttorneyAvailabilityCache(req.user!.id);

    return res.status(201).json({ blockedDate });
  },
);

router.delete("/blocked-dates/:id", async (req, res) => {
  const blockedDateId = String(req.params.id);
  const existing = await prisma.blockedDate.findFirst({
    where: { id: blockedDateId, attorneyId: req.user!.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "Blocked date not found" });
  }

  await prisma.blockedDate.delete({ where: { id: blockedDateId } });
  await invalidateAttorneyAvailabilityCache(req.user!.id);
  return res.status(204).send();
});

router.get("/bookings", async (req, res) => {
  const now = new Date();
  const scope = req.query.scope === "history" ? "history" : "upcoming";

  const bookings = await prisma.booking.findMany({
    where: {
      attorneyId: req.user!.id,
      ...(scope === "upcoming"
        ? { date: { gte: now } }
        : { date: { lt: now } }),
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ date: scope === "upcoming" ? "asc" : "desc" }, { startTime: "asc" }],
  });

  return res.json({ bookings });
});

router.patch(
  "/bookings/:id/status",
  validateBody(bookingStatusSchema),
  async (req, res) => {
    const bookingId = String(req.params.id);
    const existing = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        attorneyId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (existing.status === req.body.status) {
      return res.json({ booking: existing });
    }

    if (
      existing.status === BookingStatus.CANCELLED &&
      req.body.status === BookingStatus.CONFIRMED
    ) {
      return res.status(400).json({
        error: "This booking has already been cancelled and cannot be confirmed.",
      });
    }

    if (
      existing.status === BookingStatus.CONFIRMED &&
      req.body.status === BookingStatus.CANCELLED
    ) {
      return res.status(400).json({
        error: "This booking has already been confirmed. Payment cannot be reversed.",
      });
    }

    if (
      req.body.status === BookingStatus.CONFIRMED &&
      existing.paymentIntentId
    ) {
      try {
        const stripe = requireStripe();
        await stripe.paymentIntents.capture(existing.paymentIntentId);
      } catch (error) {
        console.error("Failed to capture booking payment", error);
        return res.status(400).json({
          error: errorMessage(
            error,
            "Unable to capture payment for this booking.",
          ),
        });
      }
    }

    if (
      req.body.status === BookingStatus.CANCELLED &&
      existing.paymentIntentId
    ) {
      try {
        const stripe = requireStripe();
        await stripe.paymentIntents.cancel(existing.paymentIntentId);
      } catch (error) {
        console.error("Failed to cancel booking payment intent", error);
        return res.status(400).json({
          error: errorMessage(
            error,
            "Unable to release payment hold for this booking.",
          ),
        });
      }
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: req.body.status,
      },
    });

    return res.json({ booking });
  },
);

router.get("/reviews", async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { attorneyId: req.user!.id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ reviews });
});

export default router;
