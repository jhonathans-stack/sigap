const itemService = require("../services/itemService");
const asyncHandler = require("../utils/asyncHandler");

const buildUploadedImageUrl = (file) => {
  if (!file) {
    return undefined;
  }

  return `/uploads/${file.filename}`;
};

const listItens = asyncHandler(async (req, res) => {
  const itens = await itemService.listItens(req.query);
  res.json(itens);
});

const listUserRequests = asyncHandler(async (req, res) => {
  const itens = await itemService.listUserRequests(req.user);
  res.json(itens);
});

const createItem = asyncHandler(async (req, res) => {
  const item = await itemService.createItem(req.body, buildUploadedImageUrl(req.file), req.user);

  res.status(201).json({
    mensagem: "Item cadastrado com sucesso.",
    item
  });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await itemService.updateItem(req.params.id, req.body, buildUploadedImageUrl(req.file), req.user);

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
  const item = await itemService.requestReturn(req.params.id, req.user);

  res.json({
    mensagem: "Solicitacao de devolucao registrada. Aguarde a separacao do item pela equipe.",
    item
  });
});

const confirmReceipt = asyncHandler(async (req, res) => {
  const item = await itemService.confirmReceipt(req.params.id, req.user);

  res.json({
    mensagem: "Recebimento confirmado com sucesso.",
    item
  });
});

module.exports = {
  listItens,
  listUserRequests,
  createItem,
  updateItem,
  deleteItem,
  requestReturn,
  confirmReceipt
};
