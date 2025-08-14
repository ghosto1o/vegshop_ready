import { api } from './client.js'
export const createOrder = (token, payload) => api('/orders', { method:'POST', token, body: payload })
export const listMyOrders = (token) => api('/orders/me', { token })
