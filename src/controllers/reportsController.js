import Customer from "../models/Customer.js";
import Discount from "../models/Discount.js";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Purchase from "../models/Purchase.js";
import ReturnModel from "../models/Return.js";
import Sale from "../models/Sale.js";
import Supplier from "../models/Supplier.js";

export const getReports = async (req, res) => {
  const { tenantId } = req.user;

  const [sales, purchases, medicines, batches, customers, suppliers, discounts, returns] =
    await Promise.all([
      Sale.find({ tenantId }),
      Purchase.find({ tenantId }),
      Medicine.find({ tenantId }),
      MedicineBatch.find({ tenantId }).populate("medicineId", "name"),
      Customer.find({ tenantId }),
      Supplier.find({ tenantId }),
      Discount.find({ tenantId }),
      ReturnModel.find({ tenantId }),
    ]);

  const totalSales = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.grandTotal, 0);
  const stockValue = medicines.reduce((sum, medicine) => sum + medicine.purchasePrice, 0);

  const medicineMovement = {};
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      medicineMovement[item.medicineName] = (medicineMovement[item.medicineName] || 0) + item.quantity;
    });
  });

  const movementRows = Object.entries(medicineMovement).sort((a, b) => b[1] - a[1]);

  res.json({
    cards: [
      { title: "Daily sales report", value: totalSales.toFixed(2) },
      { title: "Monthly sales report", value: totalSales.toFixed(2) },
      { title: "Profit/loss report", value: (totalSales - totalPurchases).toFixed(2) },
      { title: "Stock valuation", value: stockValue.toFixed(2) },
      { title: "Expiry report", value: batches.filter((batch) => batch.expiryDate < new Date()).length },
      { title: "Purchase report", value: totalPurchases.toFixed(2) },
      { title: "Supplier due report", value: suppliers.reduce((sum, supplier) => sum + supplier.paymentDue, 0).toFixed(2) },
      { title: "Customer due report", value: customers.reduce((sum, customer) => sum + customer.dueAmount, 0).toFixed(2) },
      { title: "GST report", value: sales.reduce((sum, sale) => sum + sale.gstTotal, 0).toFixed(2) },
      { title: "Discount report", value: discounts.length },
      { title: "Return report", value: returns.length },
      { title: "Low-stock report", value: medicines.filter((medicine) => medicine.minimumStock > 0).length },
    ],
    fastMovingMedicines: movementRows.slice(0, 5),
    slowMovingMedicines: movementRows.slice(-5).reverse(),
    salesTable: sales.slice(-10).reverse(),
    purchasesTable: purchases.slice(-10).reverse(),
    expiringTable: batches
      .filter((batch) => batch.expiryDate <= new Date(new Date().setDate(new Date().getDate() + 90)))
      .map((batch) => ({
        medicine: batch.medicineId?.name,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: batch.quantity,
      })),
  });
};
