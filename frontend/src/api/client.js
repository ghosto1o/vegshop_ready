const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// เก็บ access token แบบสั้น ๆ (ลดเสี่ยง XSS)
let ACCESS_TOKEN = localStorage.getItem('veg_access') || null
export function setAccess(t){ ACCESS_TOKEN = t; if (t) localStorage.setItem('veg_access', t); else localStorage.removeItem('veg_access') }
export function getAccess(){ return ACCESS_TOKEN }

async function refresh(){
  // เรียก /auth/refresh (ต้องส่ง credentials เพื่อแนบ cookie)
  const res = await fetch(BASE + '/auth/refresh', {
    method:'POST',
    credentials: 'include',
    headers: { 'Content-Type':'application/json' }
  })
  if (!res.ok) throw new Error('refresh failed')
  const data = await res.json()
  setAccess(data.accessToken)
  return data.accessToken
}

export async function api(path, { method='GET', body } = {}){
  const doFetch = async ()=>{
    const headers = { 'Content-Type':'application/json' }
    // แนบ access token ใหม่
    if (ACCESS_TOKEN) headers['Authorization'] = 'Bearer ' + ACCESS_TOKEN
    // fallback: รองรับโค้ดเก่า (ถ้าใครยังมี veg_token)
    if (!ACCESS_TOKEN){
      const legacy = localStorage.getItem('veg_token')
      if (legacy) headers['Authorization'] = 'Bearer ' + legacy
    }
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include' // ให้ cookie ติดมากับ /auth/refresh
    })
    return res
  }

  let res = await doFetch()
  if (res.status === 401){
    console.log('[FE] 401 → try refresh...')
    try{
      await refresh()
      res = await doFetch()
    }catch(e){
      console.log('[FE] refresh failed', e.message)
      throw new Error('unauthorized')
    }
  }
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).message || res.statusText)
  return res.json()
}
