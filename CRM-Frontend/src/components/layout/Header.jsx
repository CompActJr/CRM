import { useAuth } from '../../context/SessionContext'
import UserProfileMenu from './UserProfileMenu'

function Header({ title, subtitle }) {
  const auth = useAuth()
  const currentUser = auth?.user ?? auth

  return (
    <header className="pageHeader">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {currentUser && (
        <UserProfileMenu
          currentUser={currentUser}
          onLogout={auth?.onLogout}
          setScreen={auth?.setScreen}
          onUpdateUser={auth?.onUpdateUser}
        />
      )}
    </header>
  )
}

export default Header
