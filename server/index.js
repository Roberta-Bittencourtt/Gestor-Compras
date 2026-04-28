const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
require('dotenv').config();
const { setupDb } = require('./database');

const app = express();
const PORT = 5000;
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

let db;

const categoriasMap = {
  'Suprimentos Médicos': ['seringa', 'agulha', 'gaze', 'luva', 'máscara', 'álcool', 'curativo', 'medicamento'],
  'Escritório': ['papel', 'caneta', 'sulfite', 'toner', 'impressora', 'grampo', 'pasta'],
  'Limpeza': ['detergente', 'sabão', 'desinfetante', 'cloro', 'vassoura', 'papel toalha'],
  'Alimentação': ['café', 'açúcar', 'biscoito', 'água', 'leite', 'pão'],
  'Manutenção': ['lâmpada', 'fio', 'tomada', 'pintura', 'reforma']
};

function sugerirCategoria(itens) {
  const texto = itens.toLowerCase();
  for (const [cat, palavras] of Object.entries(categoriasMap)) {
    if (palavras.some(p => texto.includes(p))) return cat;
  }
  return 'Outros';
}

setupDb().then((database) => {
  db = database;

  // 1. ROTA DE UPLOAD
  app.post('/upload', upload.single('nota'), async (req, res) => {
    if (!req.file) return res.status(400).send('Arquivo não enviado.');
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    try {
      let dadosNota = { data: new Date().toLocaleDateString('pt-BR'), mercado: 'Novo Fornecedor', valor_total: 0, categoria: 'Outros', itens: '' };
      if (fileExt === '.xml') {
        const xmlContent = fs.readFileSync(filePath, 'utf-8');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlContent);
        const infNfe = result?.nfeProc?.NFe?.[0]?.infNFe?.[0];
        if (infNfe) {
          dadosNota.mercado = infNfe.emit?.[0]?.xNome?.[0] || 'Fornecedor XML';
          dadosNota.valor_total = parseFloat(infNfe.total?.[0]?.ICMSTot?.[0]?.vNF?.[0] || 0);
          dadosNota.data = infNfe.ide?.[0]?.dhEmi?.[0]?.substring(0, 10).split('-').reverse().join('/') || dadosNota.data;
          const itensArr = infNfe.det || [];
          dadosNota.itens = itensArr.map(i => i.prod?.[0]?.xProd?.[0]).join(', ');
          dadosNota.categoria = sugerirCategoria(dadosNota.itens);
        }
      }
      await db.run('INSERT INTO compras (data, mercado, categoria, valor_total, itens) VALUES (?, ?, ?, ?, ?)', 
        [dadosNota.data, dadosNota.mercado, dadosNota.categoria, dadosNota.valor_total, dadosNota.itens]);
      fs.unlinkSync(filePath);
      res.json({ message: 'Sucesso' });
    } catch (e) { res.status(500).send(e.message); }
  });

  // 2. ROTA DE LISTAR
  app.get('/compras', async (req, res) => {
    const compras = await db.all('SELECT * FROM compras ORDER BY id DESC');
    res.json(compras);
  });

  // 3. ROTA DE EXCLUIR (A que estava faltando!)
  app.delete('/compras/:id', async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM compras WHERE id = ?', id);
    res.json({ message: 'Excluído' });
  });

  // 4. ROTA DE EDITAR
  app.put('/compras/:id', async (req, res) => {
    const { id } = req.params;
    const { data, mercado, categoria, valor_total } = req.body;
    await db.run('UPDATE compras SET data = ?, mercado = ?, categoria = ?, valor_total = ? WHERE id = ?',
      [data, mercado, categoria, valor_total, id]);
    res.json({ message: 'Atualizado' });
  });

  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
});
