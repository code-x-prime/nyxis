import { Router } from "express";
import multer from "multer";
import { uploadMedia, listMedia, deleteMedia } from "../controllers/admin.media.controller.js";
import { isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for high-quality videos
    }
});

router.use(isAdmin);

router.get("/media", listMedia);
router.post("/media/upload", upload.single("file"), uploadMedia);
router.delete("/media/:id", deleteMedia);

export default router;
