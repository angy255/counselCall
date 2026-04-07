import { BookingStatus, Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { requireStripe } from "../lib/stripe";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

export async function stripeWebhookHandler(req: Request, res: Response) {
  const signatureHeader = req.headers["stripe-signature"];
  if (typeof signatureHeader !== "string") {
    return res.status(400).json({ error: "Missing Stripe signature header" });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Stripe webhook secret is not configured" });
  }

  let event: { type: string; data: { object: unknown } };
  try {
    const stripe = requireStripe();
    event = stripe.webhooks.constructEvent(req.body, signatureHeader, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return res.status(400).json({ error: "Invalid Stripe webhook signature" });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as { id: string };
        await prisma.booking.updateMany({
          where: {
            paymentIntentId: paymentIntent.id,
            status: BookingStatus.PENDING,
          },
          data: {
            status: BookingStatus.CONFIRMED,
          },
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as { id: string };
        await prisma.booking.updateMany({
          where: {
            paymentIntentId: paymentIntent.id,
            status: BookingStatus.PENDING,
          },
          data: {
            status: BookingStatus.CANCELLED,
          },
        });
        break;
      }
      case "account.updated": {
        const account = event.data.object as { id: string; charges_enabled?: boolean };
        if (account.charges_enabled) {
          await prisma.attorneyProfile.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboardingComplete: true },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return res.status(500).json({ error: "Failed to process webhook event" });
  }

  return res.json({ received: true });
}

router.get("/connect/return", async (req, res) => {
  try {
    const stripeAccountId = typeof req.query.account === "string" ? req.query.account : "";
    if (!stripeAccountId) {
      return res.redirect(`${env.CLIENT_URL}/dashboard/attorney?stripe=missing_account`);
    }

    const stripe = requireStripe();
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const onboardingComplete = Boolean(account.charges_enabled);

    await prisma.attorneyProfile.updateMany({
      where: { stripeAccountId },
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
        business_profile: {
          name: "COUNSELCALL",
          product_description: "Legal consultation services",
        },
        settings: {
          payments: {
            statement_descriptor: "COUNSELCALL",
          },
        },
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

    await stripe.accounts.update(stripeAccountId, {
      business_profile: {
        name: "COUNSELCALL",
        product_description: "Legal consultation services",
      },
      settings: {
        payments: {
          statement_descriptor: "COUNSELCALL",
        },
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${env.CLIENT_URL}/dashboard/attorney?stripe=refresh`,
      return_url: `${env.CLIENT_URL}/api/stripe/connect/return?account=${encodeURIComponent(stripeAccountId)}`,
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

export default router;
