import { Role } from "@prisma/client";
import { Router } from "express";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { requireStripe } from "../lib/stripe";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireRole(Role.ATTORNEY));

router.post("/connect", async (req, res) => {
  try {
    const stripe = requireStripe();

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        attorneyProfile: {
          select: {
            stripeAccountId: true,
          },
        },
      },
    });

    if (!user || !user.attorneyProfile) {
      return res.status(404).json({ error: "Attorney profile not found" });
    }

    let stripeAccountId = user.attorneyProfile.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;
      await prisma.attorneyProfile.update({
        where: { userId: user.id },
        data: { stripeAccountId, stripeOnboardingComplete: false },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${env.CLIENT_URL}/dashboard/attorney?stripe=refresh`,
      return_url: `${env.CLIENT_URL}/api/stripe/connect/return`,
      type: "account_onboarding",
    });

    return res.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe connect error", error);
    return res.status(500).json({ error: "Failed to start Stripe onboarding" });
  }
});

router.get("/connect/status", async (req, res) => {
  const profile = await prisma.attorneyProfile.findUnique({
    where: { userId: req.user!.id },
    select: { stripeOnboardingComplete: true },
  });

  if (!profile) {
    return res.status(404).json({ error: "Attorney profile not found" });
  }

  return res.json({
    stripeOnboardingComplete: profile.stripeOnboardingComplete,
  });
});

router.get("/connect/return", async (req, res) => {
  try {
    const stripe = requireStripe();
    const profile = await prisma.attorneyProfile.findUnique({
      where: { userId: req.user!.id },
      select: { stripeAccountId: true },
    });

    if (!profile?.stripeAccountId) {
      return res.redirect(`${env.CLIENT_URL}/dashboard/attorney?stripe=missing_account`);
    }

    const account = await stripe.accounts.retrieve(profile.stripeAccountId);
    const onboardingComplete = Boolean(account.charges_enabled);

    await prisma.attorneyProfile.update({
      where: { userId: req.user!.id },
      data: { stripeOnboardingComplete: onboardingComplete },
    });

    return res.redirect(
      `${env.CLIENT_URL}/dashboard/attorney?stripe=${onboardingComplete ? "connected" : "pending"}`,
    );
  } catch (error) {
    console.error("Stripe return error", error);
    return res.redirect(`${env.CLIENT_URL}/dashboard/attorney?stripe=error`);
  }
});

export default router;
