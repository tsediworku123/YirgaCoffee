import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('yirga-token')
    if (token) {
      api.getProfile()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('yirga-token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { user, token } = await api.login({ email, password })
    localStorage.setItem('yirga-token', token)
    setUser(user)
    return user
  }

  const register = async (data) => {
    const { user, token } = await api.register(data)
    localStorage.setItem('yirga-token', token)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('yirga-token')
    setUser(null)
  }

  const updateProfile = async (data) => {
    const updated = await api.updateProfile(data)
    setUser(updated)
    return updated
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
