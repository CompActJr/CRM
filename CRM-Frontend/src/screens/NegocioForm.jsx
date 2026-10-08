import { useEffect, useMemo, useState } from 'react'
import { Save, X } from 'lucide-react'
import Field from '../components/common/Field'
import SearchableSelect from '../components/common/SearchableSelect'
import Header from '../components/layout/Header'
import ModalMudancaEtapaFunil from '../components/negocios/ModalMudancaEtapaFunil'
import ModalMarcarPerdida from '../components/negocios/ModalMarcarPerdida'
import { useSession } from '../context/SessionContext'
import { createInteracaoForNegocio } from '../services/interacoesService'
import { fetchEtapasFunil } from '../services/etapasService'
import { fetchLeads } from '../services/leadsService'
import {
  createNegocio,
  fetchNegocioById,
  updateNegocio,
} from '../services/negociosService'
import { fetchUsuariosOpcoes } from '../services/usuariosService'
import { ETAPA_PERDIDA } from '../utils/funilDrag'
import { formatValorFromAmount, maskValorInput, parseValorInputToAmount } from '../utils/currencyInput'

const EmptyForm = {
  leadId: '',
  titulo: '',
  responsaveisIds: [],
  valorEstimado: '',
  prioridade: 'Média',
  etapaFunilId: '',
}

function NegocioForm({ setScreen, negocioId }) {
  const currentUser = useSession()
  const [form, setForm] = useState(EmptyForm)
  const [leads, setLeads] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [etapas, setEtapas] = useState([])
  const [etapaOriginalId, setEtapaOriginalId] = useState('')
  const [mudancaEtapaModal, setMudancaEtapaModal] = useState(null)
  const [perdidaModal, setPerdidaModal] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)
  const [loading, setLoading] = useState(Boolean(negocioId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEditing = Boolean(negocioId)

  useEffect(() => {
    const loadFormData = async () => {
      setError('')
      try {
        const [leadsData, usuariosData, etapasData] = await Promise.all([
          fetchLeads(),
          fetchUsuariosOpcoes(),
          fetchEtapasFunil(),
        ])
        setLeads(leadsData)
        setUsuarios(usuariosData)
        setEtapas(etapasData)

        if (!negocioId) {
          const initialUserIds = currentUser?.id ? [Number(currentUser.id)] : []
          setForm({ ...EmptyForm, responsaveisIds: initialUserIds })
          setLoading(false)
          return
        }

        const negocio = await fetchNegocioById(negocioId)
        const etapaId = String(negocio.etapaFunilId ?? '')
        setEtapaOriginalId(etapaId)

        const initialResponsaveis =
          negocio.responsaveisIds && negocio.responsaveisIds.length > 0
            ? negocio.responsaveisIds.map(Number)
            : negocio.usuarioId
              ? [Number(negocio.usuarioId)]
              : []

        setForm({
          leadId: String(negocio.leadId ?? ''),
          titulo: negocio.titulo ?? '',
          responsaveisIds: initialResponsaveis,
          valorEstimado: formatValorFromAmount(negocio.valorEstimado),
          prioridade: negocio.prioridade ?? 'Média',
          etapaFunilId: etapaId,
        })
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }
    loadFormData()
  }, [negocioId, currentUser])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleValorChange = (event) => {
    const masked = maskValorInput(event.target.value)
    setForm((current) => ({ ...current, valorEstimado: masked }))
  }

  const leadOptions = useMemo(() => {
    return leads.map((lead) => ({
      value: String(lead.id),
      label: lead.empresa || lead.nome,
      subtitle: lead.empresa ? lead.nome : lead.email || '',
    }))
  }, [leads])

  const usuarioOptions = useMemo(() => {
    return usuarios.map((usuario) => ({
      value: usuario.id,
      label: usuario.nome,
      subtitle: usuario.cargo || usuario.email || '',
    }))
  }, [usuarios])

  const getEtapaNome = (etapaId) =>
    etapas.find((etapa) => String(etapa.id) === String(etapaId))?.nome ?? ''

  const salvarNegocio = async (payload) => {
    if (isEditing) {
      await updateNegocio(negocioId, payload)
    } else {
      await createNegocio(payload)
    }
    setScreen('negocio')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.leadId) {
      setError('Selecione um lead.')
      return
    }

    if (!form.responsaveisIds || form.responsaveisIds.length === 0) {
      setError('Selecione pelo menos um responsável.')
      return
    }

    const payload = {
      leadId: Number(form.leadId),
      titulo: form.titulo,
      responsaveisIds: form.responsaveisIds,
      usuarioId: form.responsaveisIds[0],
      etapaFunilId: Number(form.etapaFunilId),
      prioridade: form.prioridade,
      valorEstimado: parseValorInputToAmount(form.valorEstimado),
    }

    const etapaAlterada = isEditing && form.etapaFunilId !== etapaOriginalId

    if (etapaAlterada) {
      setPendingPayload(payload)
      if (getEtapaNome(form.etapaFunilId) === ETAPA_PERDIDA) {
        setPerdidaModal(true)
        return
      }
      setMudancaEtapaModal({
        etapaOrigem: getEtapaNome(etapaOriginalId),
        etapaDestino: getEtapaNome(form.etapaFunilId),
      })
      return
    }

    setSaving(true)
    try {
      await salvarNegocio(payload)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleMudancaEtapaConfirm = async (interacao) => {
    if (!pendingPayload) return
    setSaving(true)
    setError('')
    try {
      await updateNegocio(negocioId, pendingPayload)
      await createInteracaoForNegocio(negocioId, {
        ...interacao,
        usuarioId: currentUser?.id,
      })
      setMudancaEtapaModal(null)
      setPendingPayload(null)
      setScreen('negocio')
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    } finally {
      setSaving(false)
    }
  }

  const handleMudancaEtapaClose = () => {
    setMudancaEtapaModal(null)
    setPendingPayload(null)
  }

  const handlePerdidaClose = () => {
    setPerdidaModal(false)
    setPendingPayload(null)
  }

  const handlePerdidaSuccess = async () => {
    if (!pendingPayload) {
      setScreen('negocio')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { etapaFunilId: _etapa, ...resto } = pendingPayload
      await updateNegocio(negocioId, resto)
      setPerdidaModal(false)
      setPendingPayload(null)
      setScreen('negocio')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header
          title={isEditing ? 'Editar Negócio' : 'Cadastro de Negócio'}
          subtitle="Carregando dados do formulário"
        />
        <p className="tableMessage">Carregando...</p>
      </>
    )
  }

  return (
    <>
      <Header
        title={isEditing ? 'Editar Negócio' : 'Cadastro de Negócio'}
        subtitle="Crie ou edite um negócio de venda"
      />
      <section className="formPanel">
        <form onSubmit={handleSubmit}>
          <div className="formGrid">
            <SearchableSelect
              label="Lead"
              placeholder="Selecione um lead"
              searchPlaceholder="Buscar por empresa ou nome..."
              options={leadOptions}
              value={form.leadId}
              onChange={(nextLeadId) =>
                setForm((current) => ({ ...current, leadId: nextLeadId }))
              }
              required
            />
            <Field
              label="Título do negócio"
              name="titulo"
              placeholder="Ex: Projeto CRM Simplificado"
              value={form.titulo}
              onChange={handleChange}
              required
            />
            <SearchableSelect
              label="Responsáveis"
              placeholder="Selecione os responsáveis"
              searchPlaceholder="Buscar responsável por nome..."
              options={usuarioOptions}
              value={form.responsaveisIds}
              onChange={(nextResponsaveis) =>
                setForm((current) => ({ ...current, responsaveisIds: nextResponsaveis }))
              }
              multiple
              required
            />
            <label className="inputGroup">
              <span>Valor estimado</span>
              <input
                type="text"
                inputMode="numeric"
                name="valorEstimado"
                placeholder="R$ 0,00"
                value={form.valorEstimado}
                onChange={handleValorChange}
                required
              />
            </label>
            <label className="inputGroup">
              <span>Prioridade</span>
              <select name="prioridade" value={form.prioridade} onChange={handleChange}>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </label>
            <label className="inputGroup">
              <span>Etapa do funil</span>
              <select name="etapaFunilId" value={form.etapaFunilId} onChange={handleChange} required>
                <option value="">Selecione</option>
                {etapas.map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="formError">{error}</p>}
          <div className="formActions">
            <button type="button" className="secondaryBtn" onClick={() => setScreen('negocio')}>
              <X size={18} />
              Cancelar
            </button>
            <button type="submit" className="primaryBtn" disabled={saving}>
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Negócio'}
            </button>
          </div>
        </form>
      </section>
      {mudancaEtapaModal && (
        <ModalMudancaEtapaFunil
          tituloNegocio={form.titulo}
          etapaOrigem={mudancaEtapaModal.etapaOrigem}
          etapaDestino={mudancaEtapaModal.etapaDestino}
          onClose={handleMudancaEtapaClose}
          onConfirm={handleMudancaEtapaConfirm}
        />
      )}
      {perdidaModal && (
        <ModalMarcarPerdida
          negocio={{ id: negocioId, titulo: form.titulo }}
          currentUser={currentUser}
          onClose={handlePerdidaClose}
          onSuccess={handlePerdidaSuccess}
        />
      )}
    </>
  )
}

export default NegocioForm
