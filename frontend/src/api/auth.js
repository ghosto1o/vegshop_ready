import { api, setToken } from './client.js'
export async function register(payload){ const r = await api('/auth/register', { method:'POST', body:payload }); setToken(r.token); localStorage.setItem('veg_current_user', JSON.stringify(r.user)); return r.user }
export async function login(payload){ const r = await api('/auth/login', { method:'POST', body:payload }); setToken(r.token); localStorage.setItem('veg_current_user', JSON.stringify(r.user)); return r.user }
export async function me(){ try{ const r = await api('/auth/me', { token: localStorage.getItem('veg_token') }); localStorage.setItem('veg_current_user', JSON.stringify(r.user)); return r.user }catch(e){ return null } }
export function currentUser(){ try{ return JSON.parse(localStorage.getItem('veg_current_user')) }catch{ return null } }
export function logout(){ localStorage.removeItem('veg_token'); localStorage.removeItem('veg_current_user') }
