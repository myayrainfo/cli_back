import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Purchase from "../models/Purchase.js";
import ReturnModel from "../models/Return.js";
import StockMovement from "../models/StockMovement.js";
import Supplier from "../models/Supplier.js";

const buildPurchaseNumber = () => `PO-${Date.now()}`;

export const getPurchases = async (req, res) => {
  const purchases = await Purchase.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
  res.json(purchases);
};

export const createPurchase = async (req, res) => {
  const { tenantId, userId } = req.user;
  const {
    supplierId,
    supplierName = "",
    items = [],
    amountPaid = 0,
    paymentStatus = "Paid",
    notes = "",
  } = req.body;

  if (!supplierId || !items.length) {
    return res.status(400).json({ message: "Supplier and items are required." });
  }

  const purchaseItems = [];
  let subtotal = 0;
  let gstTotal = 0;
  let grandTotal = 0;

  for (const item of items) {
    const medicine = await Medicine.findOne({ _id: item.medicineId, tenantId });
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found for purchase item." });
    }

    const batch = await MedicineBatch.create({
      tenantId,
      medicineId: medicine._id,
      batchNumber: item.batchNumber,
      manufacturingDate: item.manufacturingDate,
      expiryDate: item.expiryDate,
      quantity: item.quantity,
    });

    const lineBase = item.quantity * item.purchasePrice;
    const lineGst = lineBase * ((item.gst || 0) / 100);
    const lineTotal = lineBase + lineGst;

    subtotal += lineBase;
    gstTotal += lineGst;
    grandTotal += lineTotal;

    purchaseItems.push({
      medicineId: medicine._id,
      batchId: batch._id,
      medicineName: medicine.name,
      batchNumber: item.batchNumber,
      manufacturingDate: item.manufacturingDate,
      expiryDate: item.expiryDate,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      gst: item.gst,
      lineTotal,
    });

    await StockMovement.create({
      tenantId,
      medicineId: medicine._id,
      batchId: batch._id,
      type: "IN",
      quantity: item.quantity,
      reason: "Purchase stock in",
      createdBy: userId,
    });
  }

  const amountDue = Math.max(grandTotal - amountPaid, 0);
  const purchase = await Purchase.create({
    tenantId,
    purchaseNumber: buildPurchaseNumber(),
    supplierId,
    supplierName,
    items: purchaseItems,
    subtotal,
    gstTotal,
    grandTotal,
    amountPaid,
    amountDue,
    paymentStatus,
    notes,
  });

  await Supplier.findOneAndUpdate(
    { _id: supplierId, tenantId },
    { $set: { paymentDue: amountDue } }
  );

  res.status(201).json(purchase);
};

export const updatePurchase = async (req, res) => {
  const purchase = await Purchase.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    req.body,
    { new: true }
  );

  if (!purchase) {
    return res.status(404).json({ message: "Purchase not found." });
  }

  res.json(purchase);
};

export const deletePurchase = async (req, res) => {
  const purchase = await Purchase.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.user.tenantId,
  });
  if (!purchase) {
    return res.status(404).json({ message: "Purchase not found." });
  }

  await ReturnModel.create({
    tenantId: req.user.tenantId,
    type: "PURCHASE_RETURN",
    referenceId: purchase._id,
    supplierId: purchase.supplierId,
    amount: purchase.grandTotal,
    reason: "Purchase deletion placeholder",
  });

  res.json({ message: "Purchase deleted." });
};
