import { create } from 'zustand'

// Get role from URL or default to 'rider'
const getRoleFromUrl = () => {
  if (typeof window === 'undefined') return 'rider'

  const port = window.location.port
  console.log('=== ROLE DETECTION ===')
  console.log('Current port:', port)
  console.log('Window location:', window.location)
  console.log('=== END ROLE DETECTION ===')

  // Check for rider ports (5000, 5001, 5002 in case Vite auto-assigns a different port)
  if (port === '5000' || port === '5001' || port === '5002') return 'rider'
  if (port === '6001') return 'driver' // Changed from 6000 to 6001
  if (port === '7001') return 'admin'
  return 'rider' // default fallback
}

const getStorageKey = () => {
  const role = getRoleFromUrl()
  console.log('Storage key role:', role); // Debug log
  return `auth-storage-${role}`
}

export const useAuthStore = create(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    role: getRoleFromUrl(),

    login: (token, user) => {
      const storageKey = getStorageKey()
      sessionStorage.setItem(`${storageKey}-token`, token)
      sessionStorage.setItem(`${storageKey}-user`, JSON.stringify(user))
      set({ token, user, isAuthenticated: true, role: getRoleFromUrl() })
    },

    logout: () => {
      const storageKey = getStorageKey()
      sessionStorage.removeItem(`${storageKey}-token`)
      sessionStorage.removeItem(`${storageKey}-user`)
      set({ token: null, user: null, isAuthenticated: false, role: getRoleFromUrl() })
    },

    updateUser: (user) => set({ user }),

    checkAuth: async () => {
      const { token } = get()
      if (!token) return

      try {
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const user = await response.json()
          set({ user })
        }
      } catch (error) {
        console.error('checkAuth failed:', error)
      }
    },

    // Initialize from storage
    initFromStorage: () => {
      const storageKey = getStorageKey()
      const token = sessionStorage.getItem(`${storageKey}-token`)
      const userStr = sessionStorage.getItem(`${storageKey}-user`)

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          set({ token, user, isAuthenticated: true, role: getRoleFromUrl() })
        } catch (e) {
          console.error('Failed to parse user from storage:', e)
          // Clear invalid storage
          sessionStorage.removeItem(`${storageKey}-token`)
          sessionStorage.removeItem(`${storageKey}-user`)
        }
      }
    },

    // Clear all auth storage (useful for debugging)
    clearAllAuth: () => {
      // Clear all possible auth storage keys
      const keys = ['rider', 'driver', 'admin']
      keys.forEach(role => {
        sessionStorage.removeItem(`auth-storage-${role}-token`)
        sessionStorage.removeItem(`auth-storage-${role}-user`)
      })
      set({ token: null, user: null, isAuthenticated: false, role: getRoleFromUrl() })
    }
  })
)