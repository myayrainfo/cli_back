import AuditLog from "../models/AuditLog.js";
import Customer from "../models/Customer.js";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Purchase from "../models/Purchase.js";
import Sale from "../models/Sale.js";
import StockMovement from "../models/StockMovement.js";
import Supplier from "../models/Supplier.js";

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const getDashboardSummary = async (req, res) => {
  const { tenantId } = req.user;
  const today = startOfToday();
  const next90Days = new Date();
  next90Days.setDate(next90Days.getDate() + 90);

  const [
    salesToday,
    purchasesToday,
    sales,
    purchases,
    medicines,
    batches,
    recentBills,
    recentStockUpdates,
    customers,
    suppliers,
  ] = await Promise.all([
    Sale.find({ tenantId, saleDate: { $gte: today } }),
    Purchase.find({ tenantId, purchaseDate: { $gte: today } }),
    Sale.find({ tenantId }).sort({ saleDate: -1 }),
    Purchase.find({ tenantId }).sort({ purchaseDate: -1 }),
    Medicine.find({ tenantId }),
    MedicineBatch.find({ tenantId }).populate("medicineId", "name minimumStock rackLocation"),
    Sale.find({ tenantId }).sort({ saleDate: -1 }).limit(5),
    StockMovement.find({ tenantId }).sort({ createdAt: -1 }).limit(5).populate("medicineId", "name"),
    Customer.find({ tenantId }),
    Supplier.find({ tenantId }),
  ]);

  const medicineTotals = new Map();
  batches.forEach((batch) => {
    const medicineKey = String(batch.medicineId?._id || batch.medicineId);
    const current = medicineTotals.get(medicineKey) || 0;
    medicineTotals.set(medicineKey, current + batch.quantity);
  });

  const lowStock = medicines.filter((medicine) => {
    const totalStock = medicineTotals.get(String(medicine._id)) || 0;
    return totalStock <= medicine.minimumStock;
  });

  const nearExpiry = batches.filter(
    (batch) => batch.expiryDate >= new Date() && batch.expiryDate <= next90Days
  );
  const expired = batches.filter((batch) => batch.expiryDate < new Date());

  const salesTotalToday = salesToday.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const purchaseTotalToday = purchasesToday.reduce((sum, purchase) => sum + purchase.grandTotal, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.grandTotal, 0) -
    purchases.reduce((sum, purchase) => sum + purchase.grandTotal, 0);

  const supplierDues = suppliers.reduce((sum, supplier) => sum + supplier.paymentDue, 0);
  const customerDues = customers.reduce((sum, customer) => sum + customer.dueAmount, 0);

  const movementTotals = new Map();
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const current = movementTotals.get(item.medicineName) || 0;
      movementTotals.set(item.medicineName, current + item.quantity);
    });
  });

  const sortedMovement = [...movementTotals.entries()].sort((a, b) => b[1] - a[1]);

  res.json({
    kpis: {
      totalSalesToday: salesTotalToday,
      totalPurchaseToday: purchaseTotalToday,
      profitSummary: totalProfit,
      lowStockMedicines: lowStock.length,
      nearExpiryMedicines: nearExpiry.length,
      expiredMedicines: expired.length,
      pendingSupplierPayments: supplierDues,
      customerDues,
      fastMovingMedicines: sortedMovement.slice(0, 5),
      slowMovingMedicines: sortedMovement.slice(-5).reverse(),
    },
    recentBills,
    recentStockUpdates,
    salesSummaryChart: sales.slice(0, 7).reverse().map((sale) => ({
      label: new Date(sale.saleDate).toLocaleDateString(),
      total: sale.grandTotal,
    })),
    purchaseSummaryChart: purchases.slice(0, 7).reverse().map((purchase) => ({
      label: new Date(purchase.purchaseDate).toLocaleDateString(),
      total: purchase.grandTotal,
    })),
    auditPreview: await AuditLog.find({ tenantId }).sort({ createdAt: -1 }).limit(5),
  });
};
