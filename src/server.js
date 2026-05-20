const app = require("./app");
const { initializeDatabase } = require("./services/databaseService");

const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SIGAP API rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao iniciar o servidor:", error.message);
    process.exit(1);
  });
