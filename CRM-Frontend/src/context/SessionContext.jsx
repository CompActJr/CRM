import { createContext, useContext } from 'react'

const SessionContext = createContext(null)

export const SessionProvider = ({
  user,
  onLogout,
  setScreen,
  onUpdateUser,
  children,
}) => (
  <SessionContext.Provider value={{ user, onLogout, setScreen, onUpdateUser }}>
    {children}
  </SessionContext.Provider>
)

export const useSession = () => {
  const context = useContext(SessionContext)
  return context && typeof context === 'object' && 'user' in context
    ? context.user
    : context
}

export const useAuth = () => useContext(SessionContext)

