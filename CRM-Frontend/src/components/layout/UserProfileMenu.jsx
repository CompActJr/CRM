import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Info,
  LogOut,
  Target,
  TrendingUp,
  User,
  UserCog,
  X,
} from 'lucide-react'
import { isAdministrador } from '../../utils/userAccess'
import { getPerfilLabel, getUserInitials } from '../../utils/userDisplay'
import ModalMeuPerfil from '../usuarios/ModalMeuPerfil'

function UserAvatar({ user, size, className = '' }) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [user?.avatarUrl])

  const style = size
    ? { width: size, height: size, fontSize: `${Math.round(size * 0.38)}px` }
    : {}

  return (
    <div className={`avatar ${className}`} style={style}>
      {user?.avatarUrl && !imgError ? (
        <img
          src={user.avatarUrl}
          alt={user.nome}
          className="avatarImg"
          onError={() => setImgError(true)}
        />
      ) : (
        getUserInitials(user?.nome)
      )}
    </div>
  )
}

function UserProfileMenu({ currentUser, onLogout, setScreen, onUpdateUser }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [aboutTab, setAboutTab] = useState('desempenho')
  const menuRef = useRef(null)

  const isAdmin = isAdministrador(currentUser)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handleOpenPerfil = () => {
    setIsOpen(false)
    setShowPerfilModal(true)
  }

  const handleOpenUsuarios = () => {
    setIsOpen(false)
    setScreen?.('usuarios')
  }

  const handleOpenAbout = () => {
    setIsOpen(false)
    setAboutTab('desempenho')
    setShowAboutModal(true)
  }

  const handleLogout = () => {
    setIsOpen(false)
    onLogout?.()
  }

  return (
    <div className="profileContainer" ref={menuRef}>
      <button
        type="button"
        className={`profileTrigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Menu de perfil"
      >
        <UserAvatar user={currentUser} />
        <div className="profileTriggerText">
          <strong>{currentUser?.nome}</strong>
          <span>{getPerfilLabel(currentUser?.perfilAcesso)}</span>
        </div>
        <ChevronDown size={16} className={`profileChevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="profileDropdownMenu" role="menu">
          <div className="profileMenuUserHeader">
            <UserAvatar user={currentUser} size={36} />
            <div className="profileMenuUserMeta">
              <strong className="profileMenuUserName">{currentUser?.nome}</strong>
              <span className="profileMenuUserEmail">{currentUser?.email}</span>
              <span className="tag ok profileMenuTag">
                {getPerfilLabel(currentUser?.perfilAcesso)}
              </span>
            </div>
          </div>

          <div className="profileMenuDivider" />

          <button
            type="button"
            className="profileMenuItem"
            onClick={handleOpenPerfil}
            role="menuitem"
          >
            <User size={16} />
            <span style={{ flex: 1 }}>Meu Perfil</span>
            <span className="profileMenuItemBadge">Editar</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className="profileMenuItem"
              onClick={handleOpenUsuarios}
              role="menuitem"
            >
              <UserCog size={16} />
              <span>Gestão de Usuários</span>
            </button>
          )}

          <button
            type="button"
            className="profileMenuItem"
            onClick={handleOpenAbout}
            role="menuitem"
          >
            <Info size={16} />
            <span>Sobre o CRM</span>
          </button>

          <div className="profileMenuDivider" />

          <button
            type="button"
            className="profileMenuItem dangerItem"
            onClick={handleLogout}
            role="menuitem"
          >
            <LogOut size={16} />
            <span>Sair da Conta</span>
          </button>
        </div>
      )}

      {showPerfilModal && (
        <ModalMeuPerfil
          currentUser={currentUser}
          onClose={() => setShowPerfilModal(false)}
          onUpdateUser={onUpdateUser}
        />
      )}

      {showAboutModal && (
        <div
          className="modalOverlay"
          onClick={(e) => e.target === e.currentTarget && setShowAboutModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modalCard" style={{ maxWidth: '680px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modalHeader">
              <div>
                <h3 style={{ margin: 0 }}>Sobre o CRM & Regras de Indicadores</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                  Conheça como são calculados os indicadores de desempenho, conversão e perdas
                </p>
              </div>
              <button
                type="button"
                className="iconBtn"
                onClick={() => setShowAboutModal(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="leadTabs" style={{ marginBottom: '16px', flexShrink: 0 }}>
              <button
                type="button"
                className={`leadTab ${aboutTab === 'desempenho' ? 'active' : ''}`}
                onClick={() => setAboutTab('desempenho')}
              >
                Desempenho
              </button>
              <button
                type="button"
                className={`leadTab ${aboutTab === 'conversao' ? 'active' : ''}`}
                onClick={() => setAboutTab('conversao')}
              >
                Conversão
              </button>
              <button
                type="button"
                className={`leadTab ${aboutTab === 'perdas' ? 'active' : ''}`}
                onClick={() => setAboutTab('perdas')}
              >
                Perdas
              </button>
              <button
                type="button"
                className={`leadTab ${aboutTab === 'sistema' ? 'active' : ''}`}
                onClick={() => setAboutTab('sistema')}
              >
                Sobre o Sistema
              </button>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, fontSize: '14px', color: 'var(--color-text-tertiary, #334155)', lineHeight: 1.5 }}>
              {aboutTab === 'desempenho' && (
                <>
                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text, #1e293b)' }}>
                      <Target size={16} color="#2563eb" /> Metas Individuais de Leads
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary, #475569)' }}>
                      Mede o progresso de prospecção do usuário em relação ao alvo cadastrado em seu perfil comercial.
                    </p>
                    <div style={{ background: 'var(--color-bg-alt, #f1f5f9)', padding: '8px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', marginBottom: '8px' }}>
                      Progresso (%) = (Leads Cadastrados no Período ÷ Meta de Leads) × 100
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      <li><strong>Atingida:</strong> Progresso ≥ 100%.</li>
                      <li><strong>Em Andamento:</strong> Progresso &gt; 0% e &lt; 100%.</li>
                      <li><strong>Não Iniciada:</strong> 0 leads cadastrados no período.</li>
                    </ul>
                  </div>

                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text, #1e293b)' }}>
                      <Target size={16} color="#2563eb" /> Metas Individuais de Negociações
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary, #475569)' }}>
                      Avalia a quantidade de negociações distintas sob responsabilidade do usuário no período.
                    </p>
                    <div style={{ background: 'var(--color-bg-alt, #f1f5f9)', padding: '8px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', marginBottom: '8px' }}>
                      Progresso (%) = (Negócios Atribuídos no Período ÷ Meta de Negócios) × 100
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      <li>Considera negócios vinculados ao usuário através do histórico de responsáveis no período selecionado.</li>
                      <li>Exibe também o valor financeiro total estimado das negociações sob gestão.</li>
                    </ul>
                  </div>

                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text, #1e293b)' }}>
                      <TrendingUp size={16} color="#059669" /> Tempo Médio por Etapa
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary, #475569)' }}>
                      Indica a agilidade do ciclo de vendas monitorando quantos dias, em média, as oportunidades permanecem em cada etapa do funil.
                    </p>
                    <div style={{ background: 'var(--color-bg-alt, #f1f5f9)', padding: '8px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', marginBottom: '8px' }}>
                      Tempo Médio = Soma dos dias de permanência na etapa ÷ Quantidade de negócios que passaram pela etapa
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      Calculado automaticamente a partir do histórico de movimentações entre etapas.
                    </p>
                  </div>

                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', color: 'var(--color-text, #1e293b)' }}>
                      Valor Total de Negócios em Andamento
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary, #475569)' }}>
                      Pipeline ativo atual: soma do valor estimado de todos os negócios que estão em etapas abertas do funil (desconsiderando etapas finais de "Fechado" e "Perdida").
                    </p>
                  </div>
                </>
              )}

              {aboutTab === 'conversao' && (
                <>
                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text, #1e293b)' }}>
                      <TrendingUp size={16} color="#059669" /> Taxa de Conversão de Negócios
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary, #475569)' }}>
                      O principal indicador de eficiência comercial do funil, comparando o volume de fechamentos com o total de negócios gerados.
                    </p>
                    <div style={{ background: 'var(--color-bg-alt, #f1f5f9)', padding: '8px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', marginBottom: '8px' }}>
                      Taxa de Conversão (%) = (Negócios Fechados no Período ÷ Total de Negócios Criados no Período) × 100
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      <li><strong>Negócios Fechados:</strong> Negócios que alcançaram a etapa de sucesso <em>Fechado</em>.</li>
                      <li><strong>Total Criados:</strong> Todos os negócios cuja data de criação recai dentro do filtro temporal.</li>
                    </ul>
                  </div>

                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', color: 'var(--color-text, #1e293b)' }}>
                      Proporção de Leads Ativos vs. Inativos
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary, #475569)' }}>
                      Mostra a proporção da base de contatos em qualificação ativa versus os que foram desqualificados.
                    </p>
                    <div style={{ background: 'var(--color-bg-alt, #f1f5f9)', padding: '8px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', marginBottom: '8px' }}>
                      Percentual Ativo (%) = (Leads com Status 'Ativo' ÷ Total de Leads Cadastrados) × 100
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      O percentual passivo/inativo representa o complemento restante (100% - % Ativo).
                    </p>
                  </div>
                </>
              )}

              {aboutTab === 'perdas' && (
                <>
                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text, #1e293b)' }}>
                      <AlertTriangle size={16} color="#d97706" /> Desqualificação e Descarte
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary, #475569)' }}>
                      O CRM diferencia a perda de uma oportunidade avançada (negócio) da desqualificação de um lead em triagem:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      <li><strong>Descarte de Lead:</strong> O lead recebe o status <em>Inativo</em> e sai do fluxo ativo de abordagem.</li>
                      <li><strong>Negócio Perdido:</strong> A oportunidade é movida para a etapa <em>Perdida</em> com data de encerramento registrada.</li>
                    </ul>
                  </div>

                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', color: 'var(--color-text, #1e293b)' }}>
                      Obrigatoriedade de Motivo de Perda
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary, #475569)' }}>
                      Para garantir rastreabilidade e aprendizado comercial, nenhuma perda é registrada sem a seleção de um motivo cadastrado:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      <li>Exemplos de motivos: <em>Preço incompatível</em>, <em>Escolheu concorrente</em>, <em>Sem orçamento/budget</em>, <em>Perda de contato</em>.</li>
                      <li>Permite aos gestores identificar nos relatórios os gargalos e principais causas de evasão comercial.</li>
                    </ul>
                  </div>

                  <div className="propostaForm">
                    <h4 style={{ margin: '0 0 6px', color: 'var(--color-text, #1e293b)' }}>
                      Auditoria e Linha do Tempo
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      Ao registrar uma perda, o CRM finaliza a permanência do registro na etapa corrente e gera automaticamente um evento do tipo <strong>Registro</strong> na timeline, documentando quem desqualificou, a data e a justificativa.
                    </p>
                  </div>
                </>
              )}

              {aboutTab === 'sistema' && (
                <div style={{ padding: '8px 0', fontSize: '14px', color: 'var(--color-text-secondary, #475569)', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 8px' }}>
                    <strong>Versão do Sistema:</strong> 1.0.0 (Produção)
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    <strong>Objetivo:</strong> Gestão comercial integrada de leads, negócios com múltiplos responsáveis, funil de vendas, metas individuais e relatórios analíticos em tempo real.
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    <strong>Desenvolvido para:</strong> CompAct.Jr — Empresa Júnior de Computação.
                  </p>
                  <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--color-text-subtle, #94a3b8)' }}>
                    Desenvolvido com foco em produtividade, colaboração e confiabilidade nos dados comerciais.
                  </p>
                </div>
              )}
            </div>

            <div className="modalActions" style={{ marginTop: '16px', borderTop: '1px solid var(--color-border-subtle, #e2e8f0)', paddingTop: '12px' }}>
              <button
                type="button"
                className="primaryBtn"
                onClick={() => setShowAboutModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfileMenu
