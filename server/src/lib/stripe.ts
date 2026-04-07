import Stripe = require("stripe");
import { env } from "../config/env";

type StripeClient = Stripe.Stripe;

export const stripe: StripeClient | null = env.STRIPE_SECRET_KEY
  ? Stripe(env.STRIPE_SECRET_KEY)
  : null;

export function requireStripe(): StripeClient {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  return stripe;
}
