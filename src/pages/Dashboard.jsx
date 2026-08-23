import React from 'react'
import { useAuth } from '../context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../config/Firebase'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.displayName || user?.email}</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  )
}

export default Dashboard