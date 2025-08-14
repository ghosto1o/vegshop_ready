import React, { useEffect, useState } from 'react'
import { adminListOrders, adminUpdateOrderStatus } from '../../api/adminOrders.js'
import { getToken } from '../../store/auth.js'
const currency = (n)=> new Intl.NumberFormat('th-TH',{style:'currency', currency:'THB'}).format(n||0)

export default function AdminOrders(){
  const [orders, setOrders] = useState([])
  const load = ()=> adminListOrders(getToken()).then(res => setOrders(res.orders||[]))
  useEffect(()=>{ load() }, [])
  return (
    <div className="container">
      <h3>คำสั่งซื้อทั้งหมด</h3>
      <div className="card" style={{overflow:'auto'}}>
        <table className="table">
          <thead><tr><th>#</th><th>ลูกค้า</th><th>รายการ</th><th style={{textAlign:'right'}}>ยอดรวม</th><th>สถานะ</th><th>ปรับ</th></tr></thead>
          <tbody>
            {orders.map(o=> (
              <tr key={o._id}>
                <td>{o._id}</td>
                <td>{o.user?.name || 'N/A'}</td>
                <td><ul style={{margin:'6px 0 0 18px'}}>{o.items.map((it,i)=> <li key={i}>{it.name} × {it.qty}</li>)}</ul></td>
                <td style={{textAlign:'right'}}>{currency(o.total)}</td>
                <td>{o.status}</td>
                <td>
                  <select className="input" defaultValue={o.status} onChange={async (e)=>{ await adminUpdateOrderStatus(getToken(), o._id, e.target.value); load() }}>
                    {['processing','paid','shipped','delivered','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
