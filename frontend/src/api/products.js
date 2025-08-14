import { api } from './client.js'
export const listProducts = () => api('/products')
export const createProduct = (token, payload) => api('/products', { method:'POST', token, body: payload })
export const updateProduct = (token, id, patch) => api(`/products/${id}`, { method:'PUT', token, body: patch })
export const deleteProduct = (token, id) => api(`/products/${id}`, { method:'DELETE', token })
