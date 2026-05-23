import { Router } from "express";
import { createSale, deleteSale, getSales, updateSale } from "../controllers/billingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/sales", getSales);
router.post("/sales", createSale);
router.put("/sales/:id", updateSale);
router.delete("/sales/:id", deleteSale);

export default router;
