const multer = require("multer");
const AppError = require("../utils/AppError");

const allowedMimeTypes = ["image/jpeg", "image/png"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new AppError("Imagem deve ser JPG ou PNG.", 400));
    }

    return callback(null, true);
  }
});

module.exports = upload;
