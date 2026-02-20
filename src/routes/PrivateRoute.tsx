import { Navigate, Outlet } from 'react-router-dom'
import SessionTimeout from '../components/common/SessionTimeout'

export default function PrivateRoute() {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return (
    <>
      <SessionTimeout />
      <Outlet />
    </>
  )
}
