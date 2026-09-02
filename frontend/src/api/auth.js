import { ref } from 'vue'
import { supabase } from './supabase'

// Perfil (con rol y área) de la persona actualmente logueada.
// Se carga una vez por sesión y se comparte en toda la app.
export const currentProfile = ref(null)
export const authReady = ref(false)

export const loadCurrentProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    currentProfile.value = null
    authReady.value = true
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles(*, areas(name))')
    .eq('id', session.user.id)
    .single()

  currentProfile.value = error ? null : data
  authReady.value = true
  return currentProfile.value
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  await loadCurrentProfile()
  return { success: true, data }
}

export const signUp = async (email, password, fullName, roleId = null) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  if (error) return { success: false, error: error.message }
  
  if (data.user) {
    const profileData = {
      id: data.user.id,
      full_name: fullName,
      approval_status: 'pending'
    }
    if (roleId) {
      profileData.role_id = roleId
    }
    await supabase.from('profiles').insert([profileData])
  }
  
  await loadCurrentProfile()
  return { success: true, data }
}

export const signOut = async () => {
  await supabase.auth.signOut()
  currentProfile.value = null
}

export const isMasterAdmin = () => !!currentProfile.value?.is_master_admin
export const accessLevel = () => currentProfile.value?.roles?.access_level ?? null
export const isLeader = () => [1, 2].includes(accessLevel())

supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    currentProfile.value = null
  }
})
