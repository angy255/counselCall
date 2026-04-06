import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
  const { practiceArea } = req.query;
  const practiceAreaFilter =
    typeof practiceArea === "string" && practiceArea.trim().length > 0
      ? practiceArea.trim()
      : null;

  const attorneys = await prisma.user.findMany({
    where: {
      role: "ATTORNEY",
      attorneyProfile: {
        is: practiceAreaFilter
          ? {
              practiceAreas: {
                array_contains: [practiceAreaFilter],
              },
            }
          : {},
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      attorneyProfile: {
        select: {
          bio: true,
          practiceAreas: true,
          hourlyRate: true,
          photoUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json({ attorneys });
});

router.get("/:attorneyId", async (req, res) => {
  const { attorneyId } = req.params;

  const attorney = await prisma.user.findFirst({
    where: {
      id: attorneyId,
      role: "ATTORNEY",
    },
    select: {
      id: true,
      name: true,
      email: true,
      attorneyProfile: {
        select: {
          bio: true,
          practiceAreas: true,
          hourlyRate: true,
          photoUrl: true,
          createdAt: true,
        },
      },
      availability: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      blockedDates: {
        select: {
          id: true,
          date: true,
        },
        orderBy: { date: "asc" },
      },
      reviewsAsAttorney: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!attorney) {
    return res.status(404).json({ error: "Attorney not found" });
  }

  return res.json({ attorney });
});

export default router;
