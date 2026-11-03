const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const path = require('node:path');
require('dotenv').config({ quiet: true });
const { getDb } = require('./database');

const app = express();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 1 } });
app.use(express.json({ limit: '100kb' }));
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const categoriasMap = {
  'Suprimentos Médicos': ['seringa', 'agulha', 'gaze', 'luva', 'máscara', 'álcool', 'curativo', 'medicamento'],
  'Escritório': ['papel', 'caneta', 'sulfite', 'toner', 'impressora', 'grampo', 'pasta'],
  'Limpeza': ['detergente', 'sabão', 'desinfetante', 'cloro', 'vassoura', 'papel toalha'],
  'Alimentação': ['café', 'açúcar', 'biscoito', 'água', 'leite', 'pão'],
  'Manutenção': ['lâmpada', 'fio', 'tomada', 'pintura', 'reforma']
};

function sugerirCategoria(itens) {
  const texto = itens.toLowerCase();
  for (const [categoria, palavras] of Object.entries(categoriasMap)) {
    if (palavras.some(palavra => texto.includes(palavra))) return categoria;
  }
  return 'Outros';
}

router.get('/health', async (_req, res) => {
  await getDb().query('SELECT 1 FROM compras LIMIT 1');
  res.json({ status: 'ok' });
});

router.post('/upload', upload.single('nota'), async (req, res) => {
  if (!req.file) return res.status(400).send('Arquivo não enviado.');
  if (path.extname(req.file.originalname).toLowerCase() !== '.xml') {
    return res.status(400).send('Envie o XML da NF-e. A importação de PDF ainda não está disponível.');
  }
  let result;
  try {
    result = await xml2js.parseStringPromise(req.file.buffer.toString('utf8'));
  } catch {
    return res.status(400).send('XML inválido.');
  }
  const nota = result?.nfeProc?.NFe?.[0]?.infNFe?.[0] || result?.NFe?.infNFe?.[0];
  if (!nota) return res.status(400).send('Não foi encontrada uma NF-e válida no XML.');
  const valor = Number(nota.total?.[0]?.ICMSTot?.[0]?.vNF?.[0]);
  const mercado = nota.emit?.[0]?.xNome?.[0];
  if (!mercado || !Number.isFinite(valor) || valor < 0) {
    return res.status(400).send('A NF-e precisa informar o fornecedor e um valor total válido.');
  }
  const emissao = nota.ide?.[0]?.dhEmi?.[0] || nota.ide?.[0]?.dEmi?.[0];
  const data = emissao?.substring(0, 10).split('-').reverse().join('/') || new Date().toLocaleDateString('pt-BR');
  const itens = (nota.det || []).map(item => item.prod?.[0]?.xProd?.[0] || '').join(', ');
  const inserted = await getDb().query(
    'INSERT INTO compras (data, mercado, categoria, valor_total, itens) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [data, mercado, sugerirCategoria(itens), valor, itens]
  );
  res.status(201).json({ message: 'Sucesso', id: inserted.rows[0].id });
});

router.get('/compras', async (_req, res) => {
  const result = await getDb().query('SELECT id, data, mercado, categoria, valor_total, itens FROM compras ORDER BY id DESC');
  res.json(result.rows);
});

router.param('id', (req, res, next, id) => {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return res.status(400).send('Identificador inválido.');
  next();
});

router.delete('/compras/:id', async (req, res) => {
  const result = await getDb().query('DELETE FROM compras WHERE id = $1', [req.params.id]);
  if (!result.rowCount) return res.status(404).send('Compra não encontrada.');
  res.json({ message: 'Excluído' });
});

router.put('/compras/:id', async (req, res) => {
  const { data, mercado, categoria, valor_total } = req.body;
  if (![data, mercado, categoria].every(value => typeof value === 'string' && value.trim()) ||
      typeof valor_total !== 'number' || !Number.isFinite(valor_total) || valor_total < 0) {
    return res.status(400).send('Preencha data, fornecedor, categoria e um valor válido.');
  }
  const result = await getDb().query(
    'UPDATE compras SET data = $1, mercado = $2, categoria = $3, valor_total = $4 WHERE id = $5',
    [data, mercado, categoria, valor_total, req.params.id]
  );
  if (!result.rowCount) return res.status(404).send('Compra não encontrada.');
  res.json({ message: 'Atualizado' });
});

app.use('/api', router);
app.use('/', router);
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) return res.status(400).send('Arquivo inválido ou maior que 4 MB.');
  console.error('Falha na API:', error.code || error.name);
  res.status(500).send('Não foi possível concluir a operação. Tente novamente.');
});

if (require.main === module) {
  app.listen(process.env.PORT || 5000, () => console.log('Servidor pronto.'));
}
module.exports = app;
