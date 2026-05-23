import { Router } from "express";
import {
  createCustomer,
  createSupplier,
  deleteCustomer,
  deleteSupplier,
  getCustomers,
  getSuppliers,
  updateCustomer,
  updateSupplier,
} from "../controllers/peopleController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/customers", getCustomers);
router.post("/customers", createCustomer);
router.put("/customers/:id", updateCustomer);
router.delete("/customers/:id", deleteCustomer);

router.get("/suppliers", getSuppliers);
router.post("/suppliers", createSupplier);
router.put("/suppliers/:id", updateSupplier);
router.delete("/suppliers/:id", deleteSupplier);

export default router;
