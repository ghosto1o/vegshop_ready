const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
export async function api(path, { method='GET', body, token } = {}){
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type':'application/json', ...(token? { 'Authorization':'Bearer '+token }: {}) },
    body: body? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).message || res.statusText)
  return res.json()
}
export const setToken = (t)=> localStorage.setItem('veg_token', t)
export const getToken = ()=> localStorage.getItem('veg_token')
