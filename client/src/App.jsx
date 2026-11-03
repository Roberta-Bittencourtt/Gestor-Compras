import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import logo from './assets/logo/logo.jpg'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function carregarCompras(signal) {
  const response = await fetch(`${API_URL}/compras`, { signal });
  if (!response.ok) throw new Error('Erro ao buscar dados');
  return response.json();
}

function App() {
  const [compras, setCompras] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEdicao, setDadosEdicao] = useState({});

  const buscarCompras = async () => {
    try {
      const dados = await carregarCompras();
      setCompras(dados);
    } catch (e) {
      setMensagem('Erro: Não foi possível conectar ao servidor.');
      console.error(e);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    carregarCompras(controller.signal).then(setCompras).catch(error => {
      if (error.name !== 'AbortError') setMensagem('Erro: Não foi possível conectar ao servidor.');
    });
    return () => controller.abort();
  }, []);

  const handleFileChange = (e) => {
    setArquivo(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!arquivo) return alert('Selecione um arquivo.');
    const formData = new FormData();
    formData.append('nota', arquivo);
    setMensagem('Enviando...');
    try {
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        setMensagem('Nota enviada!');
        buscarCompras();
      } else {
        setMensagem(await res.text() || 'Erro no servidor.');
      }
    } catch {
      setMensagem('Erro de conexão.');
    }
  };

  const excluirCompra = async (id) => {
    if (!window.confirm('Excluir este registro?')) return;
    try {
      const res = await fetch(`${API_URL}/compras/${id}`, { method: 'DELETE' });
      if (res.ok) buscarCompras();
    } catch {
      alert('Erro ao excluir.');
    }
  };

  const salvarEdicao = async () => {
    try {
      const res = await fetch(`${API_URL}/compras/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEdicao),
      });
      if (res.ok) {
        setEditandoId(null);
        buscarCompras();
      }
    } catch {
      alert('Erro ao salvar.');
    }
  };

  const gerarRelatorioPDF = () => {
    try {
      const doc = new jsPDF();
      const dataHoje = new Date().toLocaleDateString('pt-BR');
      doc.setFontSize(18);
      doc.setTextColor(60, 36, 33);
      doc.text('Relatório de Despesas - Policlínica Mansur', 14, 20);
      
      const colunas = ["Data", "Fornecedor", "Categoria", "Valor (R$)"];
      const linhas = compras.map(c => [c.data, c.mercado, c.categoria, `R$ ${c.valor_total.toFixed(2)}`]);
      const total = compras.reduce((acc, curr) => acc + curr.valor_total, 0);
      linhas.push(["", "", "TOTAL:", `R$ ${total.toFixed(2)}`]);

      autoTable(doc, {
        head: [colunas],
        body: linhas,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [194, 164, 150] }
      });
      doc.save(`Relatorio_${dataHoje}.pdf`);
    } catch (e) {
      alert('Erro ao gerar PDF: ' + e.message);
    }
  };

  const dadosPorCategoria = () => {
    const categorias = {};
    compras.forEach(c => categorias[c.categoria] = (categorias[c.categoria] || 0) + c.valor_total);
    return Object.keys(categorias).map(cat => ({ name: cat, value: categorias[cat] }));
  };

  const dadosPorMercado = () => {
    const mercados = {};
    compras.forEach(c => mercados[c.mercado] = (mercados[c.mercado] || 0) + c.valor_total);
    return Object.keys(mercados).map(m => ({ name: m, total: mercados[m] }));
  };

  const CORES = ['#3C2421', '#C2A496', '#5D3A36', '#A68A7E', '#8C6F63'];

  return (
    <div className="App">
      <header>
        <img src={logo} alt="Logo" className="logo-clinica" />
        <h1>Gestor Policlínica Mansur</h1>
      </header>
      
      <div className="upload-section">
        <input type="file" accept=".xml" onChange={handleFileChange} />
        <button onClick={handleUpload}>Registrar Nota</button>
        <p>{mensagem}</p>
      </div>

      {compras.length > 0 && (
        <>
          <div className="dashboard">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={dadosPorCategoria()} dataKey="value" nameKey="name" outerRadius={60} label>
                    {dadosPorCategoria().map((e, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosPorMercado()}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3C2421" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="actions-bar">
            <button className="btn-report" onClick={gerarRelatorioPDF}>Baixar Relatório PDF</button>
          </div>
        </>
      )}

      <div className="list-section">
        <table>
          <thead>
            <tr><th>Data</th><th>Fornecedor</th><th>Valor</th><th>Categoria</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {compras.map(c => (
              <tr key={c.id}>
                {editandoId === c.id ? (
                  <>
                    <td><input value={dadosEdicao.data} onChange={e => setDadosEdicao({...dadosEdicao, data: e.target.value})} /></td>
                    <td><input value={dadosEdicao.mercado} onChange={e => setDadosEdicao({...dadosEdicao, mercado: e.target.value})} /></td>
                    <td><input type="number" value={dadosEdicao.valor_total} onChange={e => setDadosEdicao({...dadosEdicao, valor_total: parseFloat(e.target.value)})} /></td>
                    <td><input value={dadosEdicao.categoria} onChange={e => setDadosEdicao({...dadosEdicao, categoria: e.target.value})} /></td>
                    <td><button onClick={salvarEdicao}>OK</button><button onClick={() => setEditandoId(null)}>X</button></td>
                  </>
                ) : (
                  <>
                    <td>{c.data}</td><td>{c.mercado}</td><td>R$ {c.valor_total.toFixed(2)}</td><td>{c.categoria}</td>
                    <td>
                      <button className="btn-edit" onClick={() => { setEditandoId(c.id); setDadosEdicao(c); }}>Edit</button>
                      <button className="btn-delete" onClick={() => excluirCompra(c.id)}>Del</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
