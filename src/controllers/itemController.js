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

const createItem = asyncHandler(async (req, res) => {
  const item = await itemService.createItem(req.body, buildUploadedImageUrl(req.file));

  res.status(201).json({
    mensagem: "Item cadastrado com sucesso.",
    item
  });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await itemService.updateItem(req.params.id, req.body, buildUploadedImageUrl(req.file));

  res.json({
    mensagem: "Item atualizado com sucesso.",
    item
  });
});

const deleteItem = asyncHandler(async (req, res) => {
  await itemService.deleteItem(req.params.id);

  res.json({
    mensagem: "Item excluido permanentemente."
  });
});

module.exports = {
  listItens,
  createItem,
  updateItem,
  deleteItem
};
