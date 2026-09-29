import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Info,
  LogOut,
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
          <div className="modalCard" style={{ maxWidth: '420px' }}>
            <div className="modalHeader">
              <h3>Sobre o CRM CompAct.Jr</h3>
              <button
                type="button"
                className="iconBtn"
                onClick={() => setShowAboutModal(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '8px 0', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              <p>
                <strong>Versão:</strong> 1.0.0 (Produção)
              </p>
              <p>
                <strong>Objetivo:</strong> Gestão comercial integrada de leads, oportunidades, funil de vendas e relatórios analíticos.
              </p>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                Desenvolvido com foco em produtividade para a Compact.Jr.
              </p>
            </div>
            <div className="modalActions" style={{ marginTop: '18px' }}>
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
