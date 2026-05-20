const lostItemService = require("../services/lostItemService");
const asyncHandler = require("../utils/asyncHandler");

const buildUploadedImageUrl = (file) => {
  if (!file) {
    return undefined;
  }

  return `/uploads/${file.filename}`;
};

const findMatches = asyncHandler(async (req, res) => {
  const itens = await lostItemService.findMatches(req.body);
  res.json(itens);
});

const createLostItem = asyncHandler(async (req, res) => {
  const solicitacao = await lostItemService.createLostItem(req.body, buildUploadedImageUrl(req.file), req.user);

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

module.exports = {
  findMatches,
  createLostItem,
  listMine,
  listAll
};
