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

  if (error || !data) {
    currentProfile.value = null
    authReady.value = true
    return null
  }

  // Enriquecer con foto de verificación si no está en la tabla profiles
  if (!data.verification_photo && !data.avatar_url) {
    try {
      const { data: mem } = await supabase
        .from('ai_user_memory')
        .select('memory_value')
        .eq('employee_id', session.user.id)
        .eq('memory_key', 'verification_photo')
        .maybeSingle()
      if (mem?.memory_value) {
        data.verification_photo = mem.memory_value
        data.avatar_url = mem.memory_value
      }
    } catch (_) {}
  }
  // Asegurar que el email de la sesión esté disponible en el perfil
  if (!data.email && session.user.email) {
    data.email = session.user.email
  }

  currentProfile.value = data
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
  
  if (!data.user) {
    return { success: false, error: 'El correo ya está registrado o hubo un problema al crear la cuenta.' }
  }

  const profileData = {
    id: data.user.id,
    full_name: fullName,
    approval_status: 'pending'
  }
  if (roleId) {
    profileData.role_id = roleId
  }
  
  const { error: profileError } = await supabase.from('profiles').insert([profileData])
  if (profileError) {
    // Si falla el insert a profiles (ej. por RLS), evitamos dejar al usuario en un estado zombi sin error visible
    return { success: false, error: 'Tu cuenta se creó pero hubo un error de permisos en la base de datos (RLS). Contactá a un administrador.' }
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
export const isManager = () => accessLevel() === 1

export const canAccessKpis = () => {
  if (!currentProfile.value) return false
  if (isMasterAdmin()) return true
  const roleName = (currentProfile.value.roles?.name || '').toLowerCase()
  // Exclusivo: Analista de Datos / Especialista de Datos y Admin Maestro
  if (roleName.includes('analista de datos') || roleName.includes('especialista de datos') || roleName.includes('datos')) {
    return true
  }
  return false
}

supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    currentProfile.value = null
  }
})
