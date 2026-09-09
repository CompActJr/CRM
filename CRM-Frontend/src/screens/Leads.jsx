import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Edit, Eye, Plus, Search, Trash2, Upload } from 'lucide-react'
import Header from '../components/layout/Header'
import FiltroResponsavel from '../components/filtros/FiltroResponsavel'
import TarefaPendenteTag from '../components/tarefas/TarefaPendenteTag'
import {
  deleteLead,
  downloadLeadsImportTemplate,
  fetchLeads,
  importLeads,
} from '../services/leadsService'

const ImportRules = {
  upsert: 'upsert',
  create_only: 'create_only',
  update_only: 'update_only',
}

function Leads({ setScreen, onEditLead, onNewLead, onViewLead }) {
  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    nome: '',
    empresa: '',
    usuarioId: '',
    cidade: '',
    dataInicio: false,
    dataFim: false,
    status: '',
    nicho: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importRule, setImportRule] = useState(ImportRules.upsert)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSummary, setImportSummary] = useState(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchLeads()
      setLeads(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return leads
    return leads.filter(
      (lead) =>
        lead.nome?.toLowerCase().includes(term) ||
        lead.empresa?.toLowerCase().includes(term) ||
        lead.cidade?.toLowerCase().includes(term)
    )
  }, [leads, search])

  const handleDelete = async (lead) => {
    const confirmed = window.confirm(`Excluir o lead "${lead.nome}"?`)
    if (!confirmed) return
    try {
      await deleteLead(lead.id)
      await loadLeads()
    } catch (requestError) {
      window.alert(requestError.message)
    }
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    setImportError('')
    try {
      await downloadLeadsImportTemplate()
    } catch (requestError) {
      setImportError(requestError.message)
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setImportError('Selecione um arquivo .xlsx ou .csv')
      return
    }

    setImporting(true)
    setImportError('')
    setImportSummary(null)

    try {
      const summary = await importLeads(importFile, importRule)
      setImportSummary(summary)
      await loadLeads()
    } catch (requestError) {
      setImportError(requestError.message)
    } finally {
      setImporting(false)
    }
  }
  const applyFilters = async () => {
      const data = await fetchLeads(filters)
      setLeads(data)
    }

  return (
    <>
      <Header title="Leads" subtitle="Cadastro e acompanhamento de clientes potenciais" />
      <div className="toolbar">
        <div className="searchBox">
          <Search size={18} />
          <input
            placeholder="Buscar lead..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button className="secondaryBtn"
                onClick={() => setIsAdvancedFiltersOpen((value) => !value)}>
          Filtros avançados
        </button>
        <button onClick={() => setIsImportOpen((value) => !value)} className="secondaryBtn">
          <Upload size={18} />
          Importar planilha
        </button>
        <button onClick={onNewLead} className="primaryBtn">
          <Plus size={18} />
          Novo Lead
        </button>
      </div>
      {isAdvancedFiltersOpen && (
        <section className="filtersPanel">
          <div className="formGrid">
            <label className="inputGroup">
              <span>Nome</span>
              <input
                value={filters.nome}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    nome: event.target.value,
                  })
                }
              />
            </label>
            <label className="inputGroup">
              <span>Empresa</span>
              <input
                value={filters.empresa}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    empresa: event.target.value,
                  })
                }
              />
            </label>
            <label className="inputGroup">
              <span>Responsável</span>
              <FiltroResponsavel
                value={filters.usuarioId}
                onChange={(value) =>
                  setFilters ({
                    ...filters,
                    usuarioId: value,
                  })
                }
              />
            </label>
            <label className="inputGroup">
              <span>Cidade</span>
              <input
                value={filters.cidade}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    cidade: event.target.value,
                  })
                }
              />
            </label>
            <label className="inputGroup">
              <span>Nicho</span>
              <input
                value={filters.nicho}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    nicho: event.target.value,
                  })
                }
              />
            </label>
            <label className="inputGroup">
              <span>Status</span>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    status: event.target.value,
                  })
                }
              >
                <option value="">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </label>
            <button onClick={applyFilters} className="primaryBtn">
              Filtrar
            </button>
          </div>
        </section>
      )}
      {error && <p className="formError">{error}</p>}
      {isImportOpen && (
        <section className="importPanel">
          <div className="importPanelHeader">
            <h3>Importação de leads por planilha</h3>
            <button className="secondaryBtn" onClick={() => setIsImportOpen(false)}>
              Fechar
            </button>
          </div>
          <p className="importHint">
            Use Excel (.xlsx) para melhor resultado. A coluna <strong>nome</strong> é obrigatória. O
            campo <strong>responsavel</strong> aceita e-mail ou nome do usuário cadastrado.
          </p>
          <div className="formGrid">
            <label className="inputGroup">
              <span>Arquivo</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => {
                  setImportFile(event.target.files?.[0] ?? null)
                  setImportSummary(null)
                  setImportError('')
                }}
              />
            </label>
            <label className="inputGroup">
              <span>Regra de importação</span>
              <select value={importRule} onChange={(event) => setImportRule(event.target.value)}>
                <option value={ImportRules.upsert}>Criar novos e atualizar existentes</option>
                <option value={ImportRules.create_only}>Criar somente novos</option>
                <option value={ImportRules.update_only}>Atualizar somente existentes</option>
              </select>
            </label>
          </div>
          <div className="importActions">
            <button
              type="button"
              className="secondaryBtn"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
            >
              <Download size={18} />
              {downloadingTemplate ? 'Baixando modelo...' : 'Baixar modelo Excel'}
            </button>
            <button
              type="button"
              className="primaryBtn"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Processando...' : 'Processar planilha'}
            </button>
          </div>
          {importError && <p className="formError">{importError}</p>}
          {importSummary && (
            <>
              <div className="importResultGrid">
                <div className="importResultCard">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>{importSummary.created}</strong>
                    <span>Leads criados</span>
                  </div>
                </div>
                <div className="importResultCard">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>{importSummary.updated}</strong>
                    <span>Leads atualizados</span>
                  </div>
                </div>
                <div className="importResultCard">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>{importSummary.duplicated}</strong>
                    <span>Duplicados ignorados</span>
                  </div>
                </div>
                <div className="importResultCard">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>{importSummary.errors}</strong>
                    <span>Linhas com erro</span>
                  </div>
                </div>
              </div>
              {importSummary.details?.length > 0 && (
                <ul className="importErrorList">
                  {importSummary.details.map((item) => (
                    <li key={`${item.line}-${item.message}`}>
                      Linha {item.line}: {item.message}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
      <div className="tableCard">
        {loading ? (
          <p className="tableMessage">Carregando leads...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Responsável</th>
                <th>Cidade</th>
                <th>Nicho</th>
                <th>Data de cadastro</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="tableMessage">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="tableTitleCell">
                        <span>{lead.nome}</span>
                        <TarefaPendenteTag
                          count={lead.tarefasPendentes}
                          prazoMaisProximo={lead.prazoMaisProximo}
                          onClick={() => onViewLead(lead.id, 'tarefas')}
                        />
                      </div>
                    </td>
                    <td>{lead.empresa}</td>
                    <td>{lead.responsavel}</td>
                    <td>{lead.cidade}</td>
                    <td>{lead.nicho}</td>
                    <td>{lead.dataCadastro}</td>
                    <td>
                      <span className={lead.status === 'Ativo' ? 'tag ok' : 'tag danger'}>{lead.status}</span>
                    </td>
                    <td className="actions">
                      <Eye size={16} onClick={() => onViewLead(lead.id)} />
                      <Edit size={16} onClick={() => onEditLead(lead.id)} />
                      <Trash2 size={16} onClick={() => handleDelete(lead)} />
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

export default Leads
