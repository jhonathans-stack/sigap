const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
};

const isAllowedRole = (role) => {
  return ["user", "admin", "super"].includes(String(role || "").trim());
};

const isAllowedStatus = (status) => {
  return ["achado", "aguardando_retirada", "entregue"].includes(String(status || "").trim());
};

const isPositiveInteger = (value) => {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

module.exports = {
  isValidEmail,
  isAllowedRole,
  isAllowedStatus,
  isPositiveInteger,
  isValidDate
};
