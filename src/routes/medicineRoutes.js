import { Router } from "express";
import {
  createMedicine,
  deleteMedicine,
  getMedicines,
  updateMedicine,
} from "../controllers/medicineController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getMedicines);
router.post("/", createMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

export default router;
