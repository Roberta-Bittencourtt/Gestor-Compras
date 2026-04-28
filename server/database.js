const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDb() {
  // Abre (ou cria) o arquivo do banco de dados
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Cria a tabela de compras se ela ainda não existir
  await db.exec(`
    CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      mercado TEXT,
      categoria TEXT,
      valor_total REAL,
      itens TEXT
    )
  `);

  console.log('Banco de dados e tabela "compras" prontos!');
  return db;
}

module.exports = { setupDb };
