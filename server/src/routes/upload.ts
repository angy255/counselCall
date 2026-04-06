import { randomUUID } from "crypto";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed"));
      return;
    }
    callback(null, true);
  },
});

router.post("/photo", requireAuth, upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Photo file is required" });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase upload is not configured" });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const extension = path.extname(req.file.originalname) || ".jpg";
  const objectPath = `${req.user!.id}/${Date.now()}-${randomUUID()}${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(objectPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    return res.status(500).json({ error: "Photo upload failed" });
  }

  const { data } = supabase.storage.from("photos").getPublicUrl(objectPath);
  return res.status(201).json({ url: data.publicUrl });
});

export default router;
