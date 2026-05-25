const lostItemService = require("../services/lostItemService");
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

const findMatches = asyncHandler(async (req, res) => {
  const itens = await lostItemService.findMatches(req.body);
  res.json(itens);
});

const createLostItem = asyncHandler(async (req, res) => {
  const solicitacao = await lostItemService.createLostItem(req.body, buildUploadedImageUrls(req), req.user);

  res.status(201).json({
    mensagem: "Alerta cadastrado com sucesso.",
    solicitacao
  });
});

const listMine = asyncHandler(async (req, res) => {
  const solicitacoes = await lostItemService.listMine(req.user);
  res.json(solicitacoes);
});

const listAll = asyncHandler(async (req, res) => {
  const solicitacoes = await lostItemService.listAll();
  res.json(solicitacoes);
});

const markAsFoundByOwner = asyncHandler(async (req, res) => {
  const solicitacao = await lostItemService.markAsFoundByOwner(req.params.id, req.user);

  res.json({
    mensagem: "Item marcado como encontrado.",
    solicitacao
  });
});

module.exports = {
  findMatches,
  createLostItem,
  listMine,
  listAll,
  markAsFoundByOwner
};
