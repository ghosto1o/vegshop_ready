import { currentUser, me } from '../api/auth.js'
export function getCurrentUser(){ return currentUser() }
export async function fetchMe(){ return await me() }
export function isAuthed(){ return !!localStorage.getItem('veg_token') }
export function getToken(){ return localStorage.getItem('veg_token') }
