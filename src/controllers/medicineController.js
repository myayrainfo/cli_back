import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import StockMovement from "../models/StockMovement.js";

const mapExpiryStatus = (batch) => {
  const today = new Date();
  const nearDate = new Date();
  nearDate.setDate(nearDate.getDate() + 90);
  if (batch.expiryDate < today) return "Expired";
  if (batch.expiryDate <= nearDate) return "Near Expiry";
  return "Healthy";
};

export const getMedicines = async (req, res) => {
  const { tenantId } = req.user;
  const medicines = await Medicine.find({ tenantId }).sort({ createdAt: -1 });
  const batches = await MedicineBatch.find({ tenantId });

  const batchMap = batches.reduce((acc, batch) => {
    const key = String(batch.medicineId);
    acc[key] = acc[key] || [];
    acc[key].push(batch);
    return acc;
  }, {});

  const data = medicines.map((medicine) => {
    const linkedBatches = batchMap[String(medicine._id)] || [];
    const totalStock = linkedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
    const nearestExpiry = linkedBatches
      .slice()
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0];

    return {
      ...medicine.toObject(),
      totalStock,
      batches: linkedBatches,
      expiryStatus: nearestExpiry ? mapExpiryStatus(nearestExpiry) : "No Batch",
    };
  });

  res.json(data);
};

export const createMedicine = async (req, res) => {
  const { tenantId, userId } = req.user;
  const { batches = [], ...medicineData } = req.body;

  const medicine = await Medicine.create({ ...medicineData, tenantId });

  const createdBatches = [];
  for (const batch of batches) {
    const newBatch = await MedicineBatch.create({
      ...batch,
      tenantId,
      medicineId: medicine._id,
    });
    createdBatches.push(newBatch);

    await StockMovement.create({
      tenantId,
      medicineId: medicine._id,
      batchId: newBatch._id,
      type: "IN",
      quantity: newBatch.quantity,
      reason: "Initial stock",
      createdBy: userId,
    });
  }

  res.status(201).json({ ...medicine.toObject(), batches: createdBatches });
};

export const updateMedicine = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { batches, ...medicineData } = req.body;

  const medicine = await Medicine.findOneAndUpdate({ _id: id, tenantId }, medicineData, {
    new: true,
  });

  if (!medicine) {
    return res.status(404).json({ message: "Medicine not found." });
  }

  if (Array.isArray(batches)) {
    await MedicineBatch.deleteMany({ medicineId: id, tenantId });
    await MedicineBatch.insertMany(
      batches.map((batch) => ({
        ...batch,
        medicineId: id,
        tenantId,
      }))
    );
  }

  res.json(medicine);
};

export const deleteMedicine = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await Medicine.findOneAndDelete({ _id: id, tenantId });
  await MedicineBatch.deleteMany({ medicineId: id, tenantId });

  res.json({ message: "Medicine deleted successfully." });
};
