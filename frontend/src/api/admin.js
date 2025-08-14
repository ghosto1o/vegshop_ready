import { api } from './client.js'
export const getBuyers = (token) => api('/admin/buyers', { token })
export const createBuyer = (token, payload) => api('/admin/buyers', { method:'POST', token, body: payload })
export const updateBuyer = (token, id, patch) => api(`/admin/buyers/${id}`, { method:'PUT', token, body: patch })
export const deleteBuyer = (token, id) => api(`/admin/buyers/${id}`, { method:'DELETE', token })
export const setBuyerPassword = (token, id, password) => api(`/admin/buyers/${id}/set-password`, { method:'POST', token, body: { password } })
