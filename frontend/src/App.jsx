import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import VeggieShopMVP from './features/shop/VeggieShopMVP.jsx'
import LoginForm from './features/auth/LoginForm.jsx'
import RegisterForm from './features/auth/RegisterForm.jsx'
import { getCurrentUser, fetchMe } from './store/auth.js'
import AdminLayout from './features/admin/AdminLayout.jsx'
import AdminProducts from './features/admin/AdminProducts.jsx'
import AdminOrders from './features/admin/AdminOrders.jsx'
import AdminBuyers from './features/admin/AdminBuyers.jsx'

function AuthModal({ show, setShow, tab, setTab, onSuccess }) {
  if (!show) return null
  return (
    <div className="fixed inset-0" style={{background:'rgba(0,0,0,.4)', display:'grid', placeItems:'center', padding:16}} onClick={()=>setShow(false)}>
      <div className="card" style={{maxWidth:420, width:'100%'}} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:'flex',gap:6, marginBottom:8}}>
          <button className={"btn "+(tab==='login'?'primary':'')} onClick={()=>setTab('login')}>เข้าสู่ระบบ</button>
          <button className={"btn "+(tab==='register'?'primary':'')} onClick={()=>setTab('register')}>สมัครสมาชิก</button>
          <button className="btn" style={{marginLeft:'auto'}} onClick={()=>setShow(false)}>ปิด</button>
        </div>
        {tab === 'login' ? (
          <LoginForm onSuccess={(u)=>{ setShow(false); setTab('login'); onSuccess?.(u); }} />
        ) : (
          <RegisterForm onSuccess={(u)=>{ setShow(false); setTab('login'); onSuccess?.(u); }} />
        )}
      </div>
    </div>
  )
}

function ProtectedAdmin({ children }) {
  const me = getCurrentUser()
  const loc = useLocation()
  if (!me) return <Navigate to="/" state={{ from: loc }} replace />
  if (me.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [showAuth, setShowAuth] = useState(false)
  const [tab, setTab] = useState('login')
  const [me, setMe] = useState(null)

  useEffect(() => {
    const m = getCurrentUser()
    if (m) setMe(m)
    fetchMe().then(u => u && setMe(u)).catch(()=>{})
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VeggieShopMVP onOpenAuth={(mode='login')=>{ setTab(mode); setShowAuth(true) }} />} />
        <Route path="/profile" element={<VeggieShopMVP initialTab="profile" onOpenAuth={(mode='login')=>{ setTab(mode); setShowAuth(true) }} />} />
        <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="buyers" element={<AdminBuyers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal show={showAuth} setShow={setShowAuth} tab={tab} setTab={setTab} onSuccess={(u)=>setMe(u)} />
    </BrowserRouter>
  )
}
