const TOKEN_KEY = 'hrims_auth_token'
const USER_KEY = 'hrims_auth_user'

export const saveAuthSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const updateAuthUser = (updates) => {
  const currentUser = getAuthUser()

  if (!currentUser) {
    return null
  }

  const nextUser = { ...currentUser, ...updates }
  localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  return nextUser
}

export const getAuthUserProfilePictureUrl = () => {
  const user = getAuthUser()
  return user?.profile_picture_url || null
}

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const getAuthUser = () => {
  const value = localStorage.getItem(USER_KEY)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export const getDashboardPathForRole = (role) => {
  switch (role) {
    case 'admin':
      return '/dashboard/admin'
    case 'hr':
      return '/dashboard/hr'
    case 'manager':
      return '/dashboard/manager'
    case 'employee':
    default:
      return '/dashboard/employee'
  }
}
