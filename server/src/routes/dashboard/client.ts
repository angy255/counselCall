import { BookingStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";

const router = Router();

const createReviewSchema = z.object({
  attorneyId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

router.use(requireAuth, requireRole(Role.CLIENT));

router.get("/bookings", async (req, res) => {
  const scope = req.query.scope === "past" ? "past" : "upcoming";
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: {
      clientId: req.user!.id,
      ...(scope === "upcoming"
        ? { date: { gte: now } }
        : { date: { lt: now } }),
    },
    include: {
      attorney: {
        select: {
          id: true,
          name: true,
          email: true,
          attorneyProfile: {
            select: {
              photoUrl: true,
              hourlyRate: true,
              practiceAreas: true,
            },
          },
        },
      },
    },
    orderBy: [{ date: scope === "upcoming" ? "asc" : "desc" }, { startTime: "asc" }],
  });

  return res.json({ bookings });
});

router.patch("/bookings/:id/cancel", async (req, res) => {
  const bookingId = String(req.params.id);
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, clientId: req.user!.id },
  });

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const bookingDateTime = new Date(
    `${booking.date.toISOString().slice(0, 10)}T${booking.startTime}:00.000Z`,
  );
  const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 24) {
    return res.status(400).json({
      error: "Bookings can only be cancelled more than 24 hours in advance",
    });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.CANCELLED },
  });

  return res.json({ booking: updated });
});

router.post("/reviews", validateBody(createReviewSchema), async (req, res) => {
  const { attorneyId, rating, comment } = req.body;

  const completedBooking = await prisma.booking.findFirst({
    where: {
      clientId: req.user!.id,
      attorneyId,
      status: BookingStatus.CONFIRMED,
      date: { lt: new Date() },
    },
    select: { id: true },
  });

  if (!completedBooking) {
    return res.status(400).json({
      error: "You can only review attorneys after a completed confirmed booking",
    });
  }

  const review = await prisma.review.create({
    data: {
      clientId: req.user!.id,
      attorneyId,
      rating,
      comment,
    },
  });

  return res.status(201).json({ review });
});

export default router;
