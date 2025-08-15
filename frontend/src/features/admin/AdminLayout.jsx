import React from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout as doLogout } from '../../api/auth.js'

export default function AdminLayout(){
  const loc = useLocation()
  const nav = useNavigate()
  const tab = loc.pathname.split('/')[2] || 'products'
  return (
    <div>
      <div className="header">
        <div className="container" style={{display:'flex',gap:8,alignItems:'center'}}>
          <Link to="/admin/products" className={tab==='products'?'nav active':'nav'}>สินค้า</Link>
          <Link to="/admin/orders" className={tab==='orders'?'nav active':'nav'}>คำสั่งซื้อ</Link>
          <Link to="/admin/buyers" className={tab==='buyers'?'nav active':'nav'}>ผู้ซื้อ</Link>
                    <div style={{marginLeft:'auto'}} />
          <button
              className="btn"
              onClick={()=>{
                console.log('[FE] admin logout click')
                doLogout()
                nav('/')         // กลับหน้าแรก
                location.reload() // เคลียร์สถานะและรีเฟรช
            }}
          >
              ออกจากระบบ
              </button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
