import { api } from './client.js'
export const adminListOrders = (token) => api('/admin/orders', { token })
export const adminUpdateOrderStatus = (token, id, status) => api(`/admin/orders/${id}`, { method:'PATCH', token, body: { status } })
