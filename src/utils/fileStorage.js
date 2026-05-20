const fs = require("fs/promises");
const path = require("path");

const uploadsRoot = path.resolve(__dirname, "..", "..", "uploads");

const getLocalUploadPath = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("/uploads/")) {
    return null;
  }

  const filename = path.basename(imageUrl);
  const filePath = path.resolve(uploadsRoot, filename);

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
};

const removeLocalUpload = async (imageUrl) => {
  const filePath = getLocalUploadPath(imageUrl);

  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Nao foi possivel remover upload local: ${filePath}`);
    }
  }
};

module.exports = {
  getLocalUploadPath,
  removeLocalUpload
};
