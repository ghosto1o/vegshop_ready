import { api } from './client.js'
export const listProducts = () => api('/products')
export const createProduct = (payload) => api('/products', { method:'POST', body: payload })
export const updateProduct = (id, patch) => api(`/products/${id}`, { method:'PUT', body: patch })
export const deleteProduct = (id) => api(`/products/${id}`, { method:'DELETE' })
