import { Router } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { paymentsTable, jobsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
const router = Router();
// Create a checkout session for a featured job posting
router.post("/create-checkout-session", requireAuth, async (req, res) => {
    const { jobId } = req.body;
    const userId = req.session?.userId;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
        if (!job) {
            res.status(404).json({ error: "Job not found" });
            return;
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Featured Job Posting: ${job.title}`,
                            description: `Upgrade ${job.title} at ${job.company} to a featured listing.`,
                        },
                        unit_amount: 4900, // $49.00
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/jobs/${jobId}`,
            metadata: {
                jobId: jobId.toString(),
                userId: userId.toString(),
            },
        });
        // Save initial payment record
        await db.insert(paymentsTable).values({
            userId: userId,
            jobId: jobId,
            stripeSessionId: session.id,
            amount: 4900,
            status: "pending",
        });
        res.json({ url: session.url });
    }
    catch (err) {
        console.error("Stripe error:", err);
        res.status(500).json({ error: err.message });
    }
});
// Webhook to handle successful payments
router.post("/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
    }
    catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        // Update payment status
        await db.update(paymentsTable)
            .set({ status: "completed", updatedAt: new Date() })
            .where(eq(paymentsTable.stripeSessionId, session.id));
        // Update job to be featured
        if (session.metadata?.jobId) {
            const jobId = parseInt(session.metadata.jobId);
            await db.update(jobsTable)
                .set({ isFeatured: true, updatedAt: new Date() })
                .where(eq(jobsTable.id, jobId));
        }
    }
    res.json({ received: true });
});
export default router;
