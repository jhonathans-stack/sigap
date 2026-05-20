const sanitizeString = (value) => {
  return String(value)
    .trim()
    .replace(/[<>]/g, "");
};

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((accumulator, key) => {
      accumulator[key] = sanitizeObject(value[key]);
      return accumulator;
    }, {});
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  return value;
};

module.exports = {
  sanitizeString,
  sanitizeObject
};
