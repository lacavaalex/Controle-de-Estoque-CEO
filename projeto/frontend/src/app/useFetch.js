// useFetch.js — hook simples de carregamento de dados.
// Retorna { data, loading, error, reload, setData }. Refaz quando `deps` muda.
//
// Hook genérico de I/O: a lista de dependências vem do chamador (spread) e o
// setState dispara a sincronização com a API. Essas regras do plugin são
// desativadas só neste arquivo utilitário; o resto do código mantém-nas ativas.
/* eslint-disable react-hooks/use-memo */
import { useCallback, useEffect, useRef, useState } from "react";

export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mantém a função mais recente num ref para `load` ficar estável e sem
  // closures velhas, sem precisar listar `fn` nas dependências.
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fnRef.current();
      setData(d);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // `load` muda só quando as deps informadas mudam (ex.: setorId, status).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Dispara ao montar e quando `load` (isto é, as deps) muda.
  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load, setData };
}
