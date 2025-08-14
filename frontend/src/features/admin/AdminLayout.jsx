import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export default function AdminLayout(){
  const loc = useLocation()
  const tab = loc.pathname.split('/')[2] || 'products'
  return (
    <div>
      <div className="header">
        <div className="container" style={{display:'flex',gap:8}}>
          <Link to="/admin/products" className={tab==='products'?'nav active':'nav'}>สินค้า</Link>
          <Link to="/admin/orders" className={tab==='orders'?'nav active':'nav'}>คำสั่งซื้อ</Link>
          <Link to="/admin/buyers" className={tab==='buyers'?'nav active':'nav'}>ผู้ซื้อ</Link>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
