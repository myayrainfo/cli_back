import AuditLog from "../models/AuditLog.js";
import Discount from "../models/Discount.js";
import Tenant from "../models/Tenant.js";

export const getSettings = async (req, res) => {
  const tenant = await Tenant.findById(req.user.tenantId);
  const discounts = await Discount.find({ tenantId: req.user.tenantId });
  const auditLogs = await AuditLog.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 }).limit(10);

  res.json({
    storeProfile: tenant,
    discounts,
    payment: {
      currentPlan: tenant?.planName || "Starter",
      paymentStatus: tenant?.paymentStatus || "Trial",
      upgradePlan: "Placeholder",
      paymentHistory: [
        { id: "PH-001", date: "2026-05-01", amount: 0, status: "Trial", invoice: "Placeholder" },
      ],
    },
    auditLogs,
  });
};

export const updateSettings = async (req, res) => {
  const tenant = await Tenant.findByIdAndUpdate(req.user.tenantId, req.body, { new: true });
  res.json(tenant);
};
