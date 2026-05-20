const auditService = require("../services/auditService");
const asyncHandler = require("../utils/asyncHandler");

const listLogs = asyncHandler(async (req, res) => {
  const logs = await auditService.listLogs();
  res.json(logs);
});

const exportItemsCsv = asyncHandler(async (req, res) => {
  const csv = await auditService.exportItemsCsv();

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=sigap-itens.csv");
  res.send(csv);
});

module.exports = {
  listLogs,
  exportItemsCsv
};
