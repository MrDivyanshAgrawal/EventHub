import express from "express";
import { signup, login, logout, refreshToken, getProfile, updateProfile } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/logout", logout);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
