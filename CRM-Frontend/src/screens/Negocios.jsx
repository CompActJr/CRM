import { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react'
import Header from '../components/layout/Header'
import FiltroResponsavel from '../components/filtros/FiltroResponsavel'
import TarefaPendenteTag from '../components/tarefas/TarefaPendenteTag'
import { deleteNegocio, fetchNegocios } from '../services/negociosService'
import { getPriorityClass } from '../utils/priorityClass'

function Negocios({ setScreen, onNewNegocio, onEditNegocio, onViewNegocio }) {
  const [negocios, setNegocios] = useState([])
  const [search, setSearch] = useState('')
  const [etapaFilter, setEtapaFilter] = useState('')
  const [responsavelFilter, setResponsavelFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNegocios = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchNegocios({ usuarioId: responsavelFilter || undefined })
      setNegocios(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [responsavelFilter])

  useEffect(() => {
    loadNegocios()
  }, [loadNegocios])

  const etapas = useMemo(() => {
    return [...new Set(negocios.map((item) => item.etapa).filter(Boolean))]
  }, [negocios])

  const filteredNegocios = useMemo(() => {
    const term = search.trim().toLowerCase()
    return negocios.filter((negocio) => {
      const matchesSearch =
        !term ||
        negocio.titulo?.toLowerCase().includes(term) ||
        negocio.lead?.toLowerCase().includes(term) ||
        negocio.responsavel?.toLowerCase().includes(term)
      const matchesEtapa = !etapaFilter || negocio.etapa === etapaFilter
      return matchesSearch && matchesEtapa
    })
  }, [negocios, search, etapaFilter])

  const handleDelete = async (negocio) => {
    const confirmed = window.confirm(`Excluir o negócio "${negocio.titulo}"?`)
    if (!confirmed) return
    try {
      await deleteNegocio(negocio.id)
      await loadNegocios()
    } catch (requestError) {
      window.alert(requestError.message)
    }
  }

  return (
    <>
      <Header title="Negócios" subtitle="Gestão de negócios vinculados aos leads do funil comercial" />
      <div className="toolbar">
        <div className="searchBox">
          <Search size={18} />
          <input
            placeholder="Buscar negócio..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <FiltroResponsavel value={responsavelFilter} onChange={setResponsavelFilter} />
        <select value={etapaFilter} onChange={(event) => setEtapaFilter(event.target.value)}>
          <option value="">Todas as etapas</option>
          {etapas.map((etapa) => (
            <option key={etapa} value={etapa}>
              {etapa}
            </option>
          ))}
        </select>
        <button className="primaryBtn" onClick={onNewNegocio}>
          <Plus size={18} />
          Novo Negócio
        </button>
      </div>
      {error && <p className="formError">{error}</p>}
      <div className="tableCard">
        {loading ? (
          <p className="tableMessage">Carregando negócios...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Lead</th>
                <th>Responsável</th>
                <th>Prioridade</th>
                <th>Etapa</th>
                <th>Valor estimado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredNegocios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="tableMessage">
                    Nenhum negócio encontrado.
                  </td>
                </tr>
              ) : (
                filteredNegocios.map((negocio) => (
                  <tr key={negocio.id}>
                    <td>
                      <div className="tableTitleCell">
                        <span>{negocio.titulo}</span>
                        <TarefaPendenteTag
                          count={negocio.tarefasPendentes}
                          prazoMaisProximo={negocio.prazoMaisProximo}
                          onClick={() => onViewNegocio(negocio.id, 'tarefas')}
                        />
                      </div>
                    </td>
                    <td>{negocio.lead}</td>
                    <td>{negocio.responsavel}</td>
                    <td>
                      <span className={`priority ${getPriorityClass(negocio.prioridade)}`}>
                        {negocio.prioridade}
                      </span>
                    </td>
                    <td>{negocio.etapa}</td>
                    <td>{negocio.valor}</td>
                    <td className="actions">
                      <Eye size={16} onClick={() => onViewNegocio(negocio.id)} />
                      <Edit size={16} onClick={() => onEditNegocio(negocio.id)} />
                      <Trash2 size={16} onClick={() => handleDelete(negocio)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default Negocios
