import { Router } from "express";
import {
  createPurchase,
  deletePurchase,
  getPurchases,
  updatePurchase,
} from "../controllers/purchaseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getPurchases);
router.post("/", createPurchase);
router.put("/:id", updatePurchase);
router.delete("/:id", deletePurchase);

export default router;
