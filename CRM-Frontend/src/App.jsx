import React, { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SessionProvider } from './context/SessionContext'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './screens/Dashboard'
import MetasDashboard from './screens/MetasDashboard'
import Funil from './screens/Funil'
import ResumoFunil from './screens/ResumoFunil'
import LeadDetails from './screens/LeadDetails'
import LeadForm from './screens/LeadForm'
import Leads from './screens/Leads'
import Login from './screens/Login'
import NegocioDetails from './screens/NegocioDetails'
import NegocioForm from './screens/NegocioForm'
import Negocios from './screens/Negocios'
import Relatorios from './screens/Relatorios'
import UsuarioForm from './screens/UsuarioForm'
import Usuarios from './screens/Usuarios'
import faviconUrl from './assets/Logo.png'
import {
  buildNavigationPath,
  createScreenNavigation,
  getInitialNavigation,
  parseNavigationPath,
} from './utils/appNavigation'
import { clearSessionUser, loadSessionUser, saveSessionUser } from './utils/authSession'
import { fetchCurrentSession } from './services/authService'
import { adminOnlyScreens, isAdministrador } from './utils/userAccess'
import './styles.css'

function AppShell({ currentUser, onLogout, onUpdateUser }) {
  const [navigation, setNavigation] = useState(getInitialNavigation)

  const {
    screen,
    editingLeadId,
    viewingLeadId,
    editingNegocioId,
    viewingNegocioId,
    editingUsuarioId,
    activeTab,
    leadAction,
  } = navigation

  const pushNavigation = useCallback((nextNavigation, replace = false) => {
    const path = buildNavigationPath(nextNavigation)
    if (replace) {
      window.history.replaceState(nextNavigation, '', path)
    } else {
      window.history.pushState(nextNavigation, '', path)
    }
    setNavigation(nextNavigation)
  }, [])

  useEffect(() => {
    const path = buildNavigationPath(navigation)
    if (window.location.hash !== path) {
      window.history.replaceState(navigation, '', path)
    }
  }, [])

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.screen) {
        setNavigation({ ...event.state })
        return
      }
      setNavigation(getInitialNavigation())
    }

    const handleHashChange = () => setNavigation(parseNavigationPath(window.location.hash))

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const setScreen = useCallback(
    (nextScreen) => {
      pushNavigation(createScreenNavigation(nextScreen))
    },
    [pushNavigation]
  )

  const openNewLead = () => {
    pushNavigation(createScreenNavigation('leadForm'))
  }

  const openEditLead = (leadId) => {
    pushNavigation({
      ...createScreenNavigation('leadForm'),
      editingLeadId: leadId,
    })
  }

  const openViewLead = (leadId, tab = 'negocios', action = null) => {
    pushNavigation({
      ...createScreenNavigation('leadDetails'),
      viewingLeadId: leadId,
      activeTab: tab,
      leadAction: action,
    })
  }

  const openNewNegocio = () => {
    pushNavigation(createScreenNavigation('negocioForm'))
  }

  const openEditNegocio = (negocioId) => {
    pushNavigation({
      ...createScreenNavigation('negocioForm'),
      editingNegocioId: negocioId,
    })
  }

  const openViewNegocio = (negocioId, tab = 'timeline') => {
    pushNavigation({
      ...createScreenNavigation('negocioDetails'),
      viewingNegocioId: negocioId,
      activeTab: tab,
    })
  }

  const openNewUsuario = () => {
    pushNavigation(createScreenNavigation('usuarioForm'))
  }

  const openEditUsuario = (usuarioId) => {
    pushNavigation({
      ...createScreenNavigation('usuarioForm'),
      editingUsuarioId: usuarioId,
    })
  }

  useEffect(() => {
    if (!isAdministrador(currentUser) && adminOnlyScreens.includes(screen)) {
      pushNavigation(createScreenNavigation('dashboard'), true)
    }
  }, [screen, currentUser, pushNavigation])

  const screens = {
    dashboard: <Dashboard onViewLead={openViewLead} onViewNegocio={openViewNegocio} />,
    metas: (
      <MetasDashboard
        onViewLead={openViewLead}
        onViewNegocio={openViewNegocio}
        onEditUsuario={openEditUsuario}
        setScreen={setScreen}
      />
    ),
    leads: (
      <Leads
        setScreen={setScreen}
        onNewLead={openNewLead}
        onEditLead={openEditLead}
        onViewLead={openViewLead}
      />
    ),
    leadForm: <LeadForm setScreen={setScreen} leadId={editingLeadId} onViewLead={openViewLead} />,
    leadDetails: (
      <LeadDetails
        setScreen={setScreen}
        leadId={viewingLeadId}
        initialTab={activeTab ?? 'negocios'}
        initialAction={leadAction}
        onEditLead={openEditLead}
        onViewNegocio={openViewNegocio}
        currentUser={currentUser}
      />
    ),
    funil: (
      <Funil
        onNewNegocio={openNewNegocio}
        onViewNegocio={openViewNegocio}
        onEditNegocio={openEditNegocio}
        onViewLead={openViewLead}
        onEditLead={openEditLead}
        currentUser={currentUser}
      />
    ),
    resumoFunil: (
      <ResumoFunil
        onViewNegocio={openViewNegocio}
        onViewLead={openViewLead}
      />
    ),
    negocios: (
      <Negocios
        setScreen={setScreen}
        onNewNegocio={openNewNegocio}
        onEditNegocio={openEditNegocio}
        onViewNegocio={openViewNegocio}
      />
    ),
    negocio: (
      <Negocios
        setScreen={setScreen}
        onNewNegocio={openNewNegocio}
        onEditNegocio={openEditNegocio}
        onViewNegocio={openViewNegocio}
      />
    ),
    negocioForm: (
      <NegocioForm setScreen={setScreen} negocioId={editingNegocioId} />
    ),
    negocioDetails: (
      <NegocioDetails
        setScreen={setScreen}
        negocioId={viewingNegocioId}
        initialTab={activeTab ?? 'timeline'}
        currentUser={currentUser}
      />
    ),
    relatorios: <Relatorios />,
    usuarios: (
      <Usuarios setScreen={setScreen} onNewUsuario={openNewUsuario} onEditUsuario={openEditUsuario} />
    ),
    usuarioForm: <UsuarioForm setScreen={setScreen} usuarioId={editingUsuarioId} />,
  }

  return (
    <SessionProvider
      user={currentUser}
      onLogout={onLogout}
      setScreen={setScreen}
      onUpdateUser={onUpdateUser}
    >
      <div className="app">
        <Sidebar screen={screen} setScreen={setScreen} currentUser={currentUser} />
        <main className="content">{screens[screen] ?? <Dashboard />}</main>
      </div>
    </SessionProvider>
  )
}

function App() {
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = faviconUrl
  }, [])

  const [sessionUser, setSessionUser] = useState(loadSessionUser)

  const handleLogin = (usuario) => {
    saveSessionUser(usuario)
    setSessionUser(usuario)
  }

  const handleLogout = useCallback(() => {
    clearSessionUser()
    setSessionUser(null)
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const handleUpdateSessionUser = useCallback((updatedUser) => {
    setSessionUser((current) => {
      const nextUser = { ...current, ...updatedUser }
      saveSessionUser(nextUser)
      return nextUser
    })
  }, [])

  useEffect(() => {
    if (!sessionUser?.id) return
    let active = true
    fetchCurrentSession()
      .then((data) => {
        if (!active || !data?.usuario) return
        const fresh = data.usuario
        if (
          fresh.id !== sessionUser.id ||
          fresh.nome !== sessionUser.nome ||
          fresh.email !== sessionUser.email ||
          fresh.cargo !== sessionUser.cargo ||
          fresh.perfilAcesso !== sessionUser.perfilAcesso ||
          fresh.avatarUrl !== sessionUser.avatarUrl
        ) {
          handleUpdateSessionUser(fresh)
        }
      })
      .catch((requestError) => {
        if (active && requestError?.status === 401) {
          handleLogout()
        }
      })
    return () => {
      active = false
    }
  }, [sessionUser?.id, handleLogout, handleUpdateSessionUser])

  return sessionUser ? (
    <AppShell
      currentUser={sessionUser}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateSessionUser}
    />
  ) : (
    <Login onLogin={handleLogin} />
  )
}

createRoot(document.getElementById('root')).render(<App />)
