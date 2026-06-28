import { useState } from "react";
import { registrarEntradaLote } from "../api/estoque.js";
import { useNavigate } from "react-router-dom";

export default function NovoLote({ produtoId, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    numeroLote: "",
    validade: "",
    quantidade: "",
    qtdDanificada: "",
    obsDanificada: ""
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!form.numeroLote || !form.validade || !form.quantidade) {
      setErro(new Error("Número do lote, validade e quantidade total são obrigatórios."));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        numeroLote: form.numeroLote,
        validade: form.validade,
        quantidade: Number(form.quantidade),
        qtdDanificada: form.qtdDanificada ? Number(form.qtdDanificada) : 0,
        obsDanificada: form.obsDanificada || undefined
      };

      const res = await registrarEntradaLote(produtoId, payload);
      
      if (res.pedidosAguardando > 0) {
        const irParaFila = window.confirm(`${res.pedidosAguardando} pedido(s) aguardando este produto — abrir fila represada?`);
        if (irParaFila) {
          navigate("/pedidos", { state: { statusFiltro: "aguardando_reposicao" } });
          return;
        }
      } else {
        alert("Entrada de lote registrada com sucesso!");
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setErro(err.response?.data?.mensagem || err.message || "Erro ao registrar lote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--sp-4)", marginTop: "var(--sp-4)" }}>
      <h3 style={{ marginBottom: "var(--sp-3)" }}>Registrar Entrada de Lote</h3>
      
      {erro && <div style={{ marginBottom: "var(--sp-3)", color: "red" }}>{erro.toString()}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row" style={{ flexWrap: "wrap", marginBottom: "var(--sp-3)" }}>
          <div style={{ flex: "1 1 150px" }}>
            <label htmlFor="numeroLote">Número do Lote *</label>
            <input 
              id="numeroLote" name="numeroLote" type="text" 
              value={form.numeroLote} onChange={handleChange} 
              placeholder="Ex: LT-2026-X99" required 
            />
          </div>
          
          <div style={{ flex: "1 1 150px" }}>
            <label htmlFor="validade">Validade *</label>
            <input 
              id="validade" name="validade" type="date" 
              value={form.validade} onChange={handleChange} required 
            />
          </div>

          <div style={{ flex: "1 1 150px" }}>
            <label htmlFor="quantidade">Total Recebido (NF) *</label>
            <input 
              id="quantidade" name="quantidade" type="number" min="1"
              value={form.quantidade} onChange={handleChange} 
              placeholder="Ex: 100" required 
            />
          </div>
        </div>

        {/* CEO-268: Seção de Avarias */}
        <div style={{ borderLeft: "3px solid #f5a623", paddingLeft: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
          <h4 style={{ fontSize: "var(--fs-13)", color: "#666", marginBottom: "var(--sp-2)" }}>
            Conferência de Avarias (Opcional)
          </h4>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: "0 1 150px" }}>
              <label htmlFor="qtdDanificada">Qtd. Danificada</label>
              <input 
                id="qtdDanificada" name="qtdDanificada" type="number" min="0" max={form.quantidade || undefined}
                value={form.qtdDanificada} onChange={handleChange} 
                placeholder="Ex: 3"
              />
            </div>
            <div style={{ flex: "1 1 300px" }}>
              <label htmlFor="obsDanificada">Motivo da Avaria</label>
              <input 
                id="obsDanificada" name="obsDanificada" type="text" 
                value={form.obsDanificada} onChange={handleChange} 
                placeholder="Ex: Caixas esmagadas no transporte"
                required={Number(form.qtdDanificada) > 0} 
              />
            </div>
          </div>
        </div>

        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Salvando..." : "Confirmar Entrada"}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}