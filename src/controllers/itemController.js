const itemService = require("../services/itemService");
const asyncHandler = require("../utils/asyncHandler");

const buildUploadedImageUrls = (req) => {
  const files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (req.files) {
    Object.values(req.files).forEach((group) => {
      files.push(...group);
    });
  }

  return files.map((file) => `/uploads/${file.filename}`);
};

const listItens = asyncHandler(async (req, res) => {
  const itens = await itemService.listItens(req.query, req.user);
  res.json(itens);
});

const listUserRequests = asyncHandler(async (req, res) => {
  const itens = await itemService.listUserRequests(req.user);
  res.json(itens);
});

const createItem = asyncHandler(async (req, res) => {
  const item = await itemService.createItem(req.body, buildUploadedImageUrls(req), req.user);

  res.status(201).json({
    mensagem: "Item cadastrado com sucesso.",
    item
  });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await itemService.updateItem(req.params.id, req.body, buildUploadedImageUrls(req), req.user);

  res.json({
    mensagem: "Item atualizado com sucesso.",
    item
  });
});

const deleteItem = asyncHandler(async (req, res) => {
  await itemService.deleteItem(req.params.id, req.user);

  res.json({
    mensagem: "Item excluido permanentemente."
  });
});

const requestReturn = asyncHandler(async (req, res) => {
  const result = await itemService.requestReturn(req.params.id, req.user);

  res.json({
    mensagem: "Código de coleta gerado com sucesso.",
    item: result.item,
    codigo_coleta: result.codigo_coleta
  });
});

const confirmReceipt = asyncHandler(async (req, res) => {
  const item = await itemService.confirmReceipt(req.params.id, req.body, req.user);

  res.json({
    mensagem: "Coleta confirmada com sucesso.",
    item
  });
});

const listItemsForCollection = asyncHandler(async (req, res) => {
  const itens = await itemService.listItemsForCollection(req.query);
  res.json(itens);
});

const listDeliveredReports = asyncHandler(async (req, res) => {
  const entregas = await itemService.listDeliveredReports(req.query);
  res.json(entregas);
});

module.exports = {
  listItens,
  listUserRequests,
  createItem,
  updateItem,
  deleteItem,
  requestReturn,
  confirmReceipt,
  listItemsForCollection,
  listDeliveredReports
};
