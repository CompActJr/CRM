import React, { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SessionProvider } from './context/SessionContext'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './screens/Dashboard'
import Funil from './screens/Funil'
import LeadDetails from './screens/LeadDetails'
import LeadForm from './screens/LeadForm'
import Leads from './screens/Leads'
import Login from './screens/Login'
import OportunidadeDetails from './screens/OportunidadeDetails'
import OportunidadeForm from './screens/OportunidadeForm'
import Oportunidades from './screens/Oportunidades'
import Relatorios from './screens/Relatorios'
import UsuarioForm from './screens/UsuarioForm'
import Usuarios from './screens/Usuarios'
import {
  buildNavigationPath,
  createScreenNavigation,
  getInitialNavigation,
} from './utils/appNavigation'
import { clearSessionUser, loadSessionUser, saveSessionUser } from './utils/authSession'
import { adminOnlyScreens, isAdministrador } from './utils/userAccess'
import './styles.css'

function AppShell({ currentUser, onLogout, onUpdateUser }) {
  const [navigation, setNavigation] = useState(getInitialNavigation)

  const {
    screen,
    editingLeadId,
    viewingLeadId,
    editingOportunidadeId,
    viewingOportunidadeId,
    editingUsuarioId,
    activeTab,
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

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
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

  const openViewLead = (leadId, tab = 'oportunidades') => {
    pushNavigation({
      ...createScreenNavigation('leadDetails'),
      viewingLeadId: leadId,
      activeTab: tab,
    })
  }

  const openNewOportunidade = () => {
    pushNavigation(createScreenNavigation('oportunidadeForm'))
  }

  const openEditOportunidade = (oportunidadeId) => {
    pushNavigation({
      ...createScreenNavigation('oportunidadeForm'),
      editingOportunidadeId: oportunidadeId,
    })
  }

  const openViewOportunidade = (oportunidadeId, tab = 'timeline') => {
    pushNavigation({
      ...createScreenNavigation('oportunidadeDetails'),
      viewingOportunidadeId: oportunidadeId,
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
    dashboard: <Dashboard />,
    leads: (
      <Leads
        setScreen={setScreen}
        onNewLead={openNewLead}
        onEditLead={openEditLead}
        onViewLead={openViewLead}
      />
    ),
    leadForm: <LeadForm setScreen={setScreen} leadId={editingLeadId} />,
    leadDetails: (
      <LeadDetails
        setScreen={setScreen}
        leadId={viewingLeadId}
        initialTab={activeTab ?? 'oportunidades'}
        onEditLead={openEditLead}
        onViewOportunidade={openViewOportunidade}
        currentUser={currentUser}
      />
    ),
    funil: (
      <Funil
        onNewOportunidade={openNewOportunidade}
        onViewOportunidade={openViewOportunidade}
        onEditOportunidade={openEditOportunidade}
        currentUser={currentUser}
      />
    ),
    oportunidade: (
      <Oportunidades
        setScreen={setScreen}
        onNewOportunidade={openNewOportunidade}
        onEditOportunidade={openEditOportunidade}
        onViewOportunidade={openViewOportunidade}
      />
    ),
    oportunidadeForm: (
      <OportunidadeForm setScreen={setScreen} oportunidadeId={editingOportunidadeId} />
    ),
    oportunidadeDetails: (
      <OportunidadeDetails
        setScreen={setScreen}
        oportunidadeId={viewingOportunidadeId}
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
  const [sessionUser, setSessionUser] = useState(() => loadSessionUser())

  const handleLogin = (usuario) => {
    saveSessionUser(usuario)
    setSessionUser(usuario)
  }

  const handleLogout = () => {
    clearSessionUser()
    setSessionUser(null)
    window.history.replaceState(null, '', window.location.pathname)
  }

  const handleUpdateSessionUser = (updatedUser) => {
    const nextUser = { ...sessionUser, ...updatedUser }
    saveSessionUser(nextUser)
    setSessionUser(nextUser)
  }

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
