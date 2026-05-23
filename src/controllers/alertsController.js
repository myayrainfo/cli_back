import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Supplier from "../models/Supplier.js";

export const getAlerts = async (req, res) => {
  const { tenantId } = req.user;
  const medicines = await Medicine.find({ tenantId });
  const batches = await MedicineBatch.find({ tenantId }).populate("medicineId", "name minimumStock rackLocation");
  const suppliers = await Supplier.find({ tenantId });

  const stockByMedicine = new Map();
  batches.forEach((batch) => {
    const key = String(batch.medicineId?._id || batch.medicineId);
    stockByMedicine.set(key, (stockByMedicine.get(key) || 0) + batch.quantity);
  });

  const lowStock = medicines
    .filter((medicine) => (stockByMedicine.get(String(medicine._id)) || 0) <= medicine.minimumStock)
    .map((medicine) => ({
      name: medicine.name,
      stock: stockByMedicine.get(String(medicine._id)) || 0,
      minimumStock: medicine.minimumStock,
      rackLocation: medicine.rackLocation,
    }));

  const now = new Date();
  const nearDate = new Date();
  nearDate.setDate(nearDate.getDate() + 90);

  const nearExpiry = batches.filter((batch) => batch.expiryDate >= now && batch.expiryDate <= nearDate);
  const expired = batches.filter((batch) => batch.expiryDate < now);

  res.json({
    alertCards: [
      { title: "Low-stock reorder alerts", value: lowStock.length, tone: "warning" },
      { title: "Near-expiry medicines", value: nearExpiry.length, tone: "info" },
      { title: "Expired stock", value: expired.length, tone: "danger" },
      {
        title: "Supplier return alerts",
        value: suppliers.filter((supplier) => supplier.paymentDue > 0).length,
        tone: "warning",
      },
    ],
    lowStock,
    nearExpiry,
    expired,
    damagedStock: [
      {
        title: "Damaged stock placeholder",
        status: "Review",
        note: "Use this placeholder to mark damaged or disposed items in a later phase.",
      },
    ],
    expiryLossReport: expired.map((batch) => ({
      medicine: batch.medicineId?.name,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
    })),
    info: {
      autoExpiryBlocking: "Expired batches are blocked during billing.",
      expiryClearanceDiscount: "Create discount campaigns for near-expiry items.",
    },
  });
};
