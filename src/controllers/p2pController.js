const p2pService = require("../services/p2pService");
const asyncHandler = require("../utils/asyncHandler");

const imageFromFile = (file) => {
  if (!file) {
    return null;
  }

  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

const reportFoundItem = asyncHandler(async (req, res) => {
  const conversa = await p2pService.reportFoundItem(req.params.id, req.user);
  res.status(201).json({ mensagem: "Contato P2P aberto com sucesso.", conversa });
});

const listConversations = asyncHandler(async (req, res) => {
  const conversas = await p2pService.listConversations(req.user);
  res.json(conversas);
});

const listMessages = asyncHandler(async (req, res) => {
  const data = await p2pService.listMessages(req.params.id, req.user);
  res.json(data);
});

const sendMessage = asyncHandler(async (req, res) => {
  const mensagem = await p2pService.sendMessage(req.params.id, req.body, imageFromFile(req.file), req.user);
  res.status(201).json({ mensagem: "Mensagem enviada.", dado: mensagem });
});

const confirmDelivery = asyncHandler(async (req, res) => {
  const item = await p2pService.confirmDelivery(req.params.id, req.body, req.user);
  res.json({ mensagem: "Entrega P2P confirmada.", item });
});

const listReports = asyncHandler(async (req, res) => {
  const relatorios = await p2pService.listReports();
  res.json(relatorios);
});

module.exports = {
  reportFoundItem,
  listConversations,
  listMessages,
  sendMessage,
  confirmDelivery,
  listReports
};
