import { Router } from "express";
import { db } from "@workspace/db";
import { analyticsEventsTable } from "@workspace/db/schema";

const router = Router();

router.post("/analytics/events", async (req, res) => {
  const { eventType, eventCategory, eventAction, eventLabel, eventValue, page, route, metadata } = req.body;

  try {
    const userId = req.session?.userId || null;
    await db.insert(analyticsEventsTable).values({
      userId,
      eventType: eventType || "unspecified",
      eventCategory,
      eventAction: eventAction || "click",
      eventLabel,
      eventValue,
      page,
      route,
      metadata: metadata || {},
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to insert analytics event:", err);
    res.status(500).json({ error: err.message || "Failed to log event" });
  }
});

export default router;
