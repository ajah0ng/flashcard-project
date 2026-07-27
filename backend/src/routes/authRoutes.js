import express from "express";
import { googleSignIn, getCurrentUser, signOut } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/google", googleSignIn);
router.post("/logout", signOut);
router.get("/me", requireAuth, getCurrentUser);

export default router;
