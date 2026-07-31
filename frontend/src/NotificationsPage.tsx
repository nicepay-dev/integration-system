import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from './api';

const notificationType=(item:any)=>item.merchant?'MERCHANT':item.caseRecord?'CASE':item.staleKey?.startsWith('meeting:')?'MEETING':'OTHER';
const typeLabels:Record<string,string>={MERCHANT:'Merchant',CASE:'Case',MEETING:'Meeting',OTHER:'Other'};

export default function NotificationsPage({onMerchant,onCases,onMeetings,onChanged}:{onMerchant:(merchant:any)=>void;onCases:()=>void;onMeetings:()=>void;onChanged:()=>void}){
  const [items,setItems]=useState<any[]>([]);
  const [type,setType]=useState('ALL');
  const [unreadOnly,setUnreadOnly]=useState(false);
  async function load(){setItems(await api('/notifications'))}
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>items.filter(item=>(type==='ALL'||notificationType(item)===type)&&(!unreadOnly||!item.isRead)),[items,type,unreadOnly]);
  async function open(item:any){
    if(!item.isRead)await api(`/notifications/${item.id}/read`,{method:'PATCH'});
    await load();onChanged();
    if(item.merchant)onMerchant(item.merchant);
    else if(item.caseRecord)onCases();
    else if(item.staleKey?.startsWith('meeting:'))onMeetings();
  }
  async function readAll(){await api('/notifications/read-all',{method:'PATCH'});await load();onChanged()}
  return <main className="content notifications-page">
    <header><div><p className="eyebrow">ATTENTION CENTER</p><h1>Notifications</h1><p className="muted">Review merchant, case, and meeting reminders in one place.</p></div><button className="read-all-button" onClick={readAll} disabled={!items.some(item=>!item.isRead)}><CheckCheck/>Mark all read</button></header>
    <section className="notification-summary"><article><span>All</span><b>{items.length}</b></article><article><span>Unread</span><b>{items.filter(item=>!item.isRead).length}</b></article><article><span>Merchant</span><b>{items.filter(item=>notificationType(item)==='MERCHANT').length}</b></article><article><span>Cases</span><b>{items.filter(item=>notificationType(item)==='CASE').length}</b></article><article><span>Meetings</span><b>{items.filter(item=>notificationType(item)==='MEETING').length}</b></article></section>
    <section className="notification-center-card"><div className="notification-center-filters"><label>Type<select value={type} onChange={event=>setType(event.target.value)}><option value="ALL">All types</option><option value="MERCHANT">Merchant</option><option value="CASE">Case</option><option value="MEETING">Meeting</option></select></label><label className="unread-toggle"><input type="checkbox" checked={unreadOnly} onChange={event=>setUnreadOnly(event.target.checked)}/>Unread only</label></div>
      {filtered.length?<div className="notification-center-list">{filtered.map(item=><button className={item.isRead?'':'unread'} key={item.id} onClick={()=>open(item)}><span className={`notification-type ${notificationType(item).toLowerCase()}`}><Bell/>{typeLabels[notificationType(item)]}</span><span className="notification-copy"><b>{item.message}</b><small>{new Date(item.createdAt).toLocaleString('en-GB')}</small></span><ChevronRight/></button>)}</div>:<div className="notification-empty"><Bell/><p>No notifications match this filter.</p></div>}
    </section>
  </main>;
}
