const extractRefFromJwt = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length >= 2) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
      if (payload?.ref) return `https://${payload.ref}.supabase.co`
    }
  } catch {
    // ignore
  }
  return null
}

const getSupabaseConfig = () => {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '')
    .trim()
    .replace(/^"+|"+$/g, '')

  const rawUrl = process.env.SUPABASE_URL || extractRefFromJwt(serviceKey) || ''
  const supabaseUrl = rawUrl.trim().replace(/^"+|"+$/g, '').replace(/\/+$/, '')

  const bucketName = (process.env.SUPABASE_AVATARS_BUCKET || 'avatars')
    .trim()
    .replace(/^"+|"+$/g, '')

  return { supabaseUrl, serviceKey, bucketName }
}

/**
 * Garante que o bucket público de avatares exista no Supabase Storage.
 */
export const ensureAvatarsBucket = async () => {
  const { supabaseUrl, serviceKey, bucketName } = getSupabaseConfig()
  if (!serviceKey || !supabaseUrl) return

  try {
    const checkUrl = `${supabaseUrl}/storage/v1/bucket/${bucketName}`
    const checkRes = await fetch(checkUrl, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    })

    if (checkRes.status === 404) {
      // Cria o bucket caso ainda não tenha sido criado manualmente
      await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bucketName,
          name: bucketName,
          public: true,
          file_size_limit: 15728640, // 15MB
          allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
      })
    }
  } catch {
    // Continua se falhar na checagem
  }
}

/**
 * Faz upload do buffer da imagem para o Supabase Storage.
 * @returns {Promise<string>} URL pública da imagem enviada
 */
export const uploadAvatarToSupabase = async (buffer, filename, mimetype) => {
  const { supabaseUrl, serviceKey, bucketName } = getSupabaseConfig()

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não foi configurada no backend.')
  }

  // Tenta garantir que o bucket existe
  await ensureAvatarsBucket()

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filename}`
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': mimetype,
      'x-upsert': 'true',
    },
    body: buffer,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Falha no upload para o Supabase (${response.status}): ${errorText}`)
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}`
}

/**
 * Remove uma imagem do Supabase Storage com base na URL pública.
 */
export const deleteAvatarFromSupabase = async (avatarUrl) => {
  const { supabaseUrl, serviceKey, bucketName } = getSupabaseConfig()
  if (!serviceKey || !avatarUrl) return

  const prefix = `${supabaseUrl}/storage/v1/object/public/${bucketName}/`
  if (!avatarUrl.startsWith(prefix)) return

  const filePath = avatarUrl.replace(prefix, '')
  if (!filePath) return

  try {
    const deleteUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`
    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    })
  } catch (error) {
    console.error('Erro ao excluir avatar antigo do Supabase:', error.message)
  }
}
