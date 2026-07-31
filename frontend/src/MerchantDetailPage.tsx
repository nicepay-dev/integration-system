import { ArrowLeft, Bell, CalendarDays, ChevronRight, ClipboardCheck, CreditCard, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from './api';

const statusLabels:Record<string,string>={ONBOARDING:'Onboarding',INTEGRATION:'Integration',UAT:'UAT','READY LIVE':'Ready Live',LIVE:'Live',BLOCKED:'Blocked',CANCEL:'Cancel'};
const caseStatusLabels:Record<string,string>={CHECKING:'Checking',WAITING_PARTNER:'Waiting from partner',WAITING_MERCHANT:'Waiting from merchant',SOLVED:'Solved'};

export default function MerchantDetailPage({merchant,onBack,onCases,onMeetings}:{merchant:any;onBack:()=>void;onCases:()=>void;onMeetings:()=>void}){
  const [cases,setCases]=useState<any[]>([]);
  const [meetings,setMeetings]=useState<any[]>([]);
  const [notifications,setNotifications]=useState<any[]>([]);
  useEffect(()=>{Promise.all([api(`/cases?merchantId=${merchant.id}`),api(`/meetings?merchantId=${merchant.id}`),api('/notifications')]).then(([caseData,meetingData,notificationData])=>{setCases(caseData);setMeetings(meetingData);setNotifications(notificationData)})},[merchant.id]);
  const relatedNotifications=useMemo(()=>{
    const meetingIds=new Set(meetings.map(item=>item.id));
    return notifications.filter(item=>item.merchant?.id===merchant.id||item.caseRecord?.merchant?.id===merchant.id||(item.staleKey?.startsWith('meeting:')&&meetingIds.has(item.staleKey.split(':')[1])));
  },[notifications,meetings,merchant.id]);
  return <main className="content merchant-detail-page">
    <button className="back-button" onClick={onBack}><ArrowLeft/>Back to merchants</button>
    <header className="merchant-detail-header"><div><p className="eyebrow">MERCHANT DETAIL</p><h1>{merchant.name}</h1><p className="muted">{merchant.mids?.length||0} MIDs · {merchant.paymentMethods?.length||0} payment methods</p></div><span className={`status ${merchant.status.toLowerCase()}`}>{statusLabels[merchant.status]||merchant.status}</span></header>
    <section className="merchant-detail-summary">
      <article><UserRound/><span>PIC</span><b>{merchant.picName}</b><small>{merchant.picEmail}</small></article>
      <article><CreditCard/><span>Progress</span><b>{merchant.progress}%</b><div className="detail-progress"><i style={{width:`${merchant.progress}%`}}/></div></article>
      <article><CalendarDays/><span>Target live</span><b>{merchant.targetLiveDate?new Date(merchant.targetLiveDate).toLocaleDateString('en-GB'):'Not set'}</b><small>Last update {new Date(merchant.statusUpdatedAt).toLocaleDateString('en-GB')}</small></article>
    </section>
    <section className="detail-section"><div className="detail-title"><div><p className="eyebrow">CONFIGURATION</p><h2>MIDs and payment methods</h2></div></div><div className="detail-mid-grid">{merchant.mids?.length?merchant.mids.map((mid:any)=><article key={mid.mid}><header><b>{mid.mid}</b><span className={`mid-status ${mid.status.toLowerCase()}`}>{statusLabels[mid.status]||mid.status}</span></header>{mid.paymentMethods?.length?<div className="detail-methods">{mid.paymentMethods.map((method:string)=><span key={method}><b>{method}</b><small>{mid.paymentMethodStatuses?.[method]||'Preparing by merchant'}</small></span>)}</div>:<p className="muted">No payment methods.</p>}</article>):<p className="detail-empty">No MID assigned.</p>}</div></section>
    <div className="detail-columns">
      <section className="detail-section"><div className="detail-title"><div><p className="eyebrow">CASES</p><h2>Related cases</h2></div><button onClick={onCases}>Open cases <ChevronRight/></button></div>{cases.length?<div className="detail-list">{cases.slice(0,6).map(item=><article key={item.id}><div><b>{item.issue}</b><small>{item.pic.name} · {new Date(item.updatedAt).toLocaleString('en-GB')}</small></div><span className={`case-status ${item.status.toLowerCase()}`}>{caseStatusLabels[item.status]}</span></article>)}</div>:<p className="detail-empty">No cases recorded.</p>}</section>
      <section className="detail-section"><div className="detail-title"><div><p className="eyebrow">MEETINGS</p><h2>Meeting history</h2></div><button onClick={onMeetings}>Open meetings <ChevronRight/></button></div>{meetings.length?<div className="detail-list">{meetings.slice(0,6).map(item=><article key={item.id}><div><b>{item.meetingType.replaceAll('_',' ')}</b><small>{item.pic.name} · {new Date(item.meetingDate).toLocaleString('en-GB')}</small></div></article>)}</div>:<p className="detail-empty">No meetings recorded.</p>}</section>
    </div>
    <section className="detail-section"><div className="detail-title"><div><p className="eyebrow">ATTENTION</p><h2>Related notifications</h2></div><Bell/></div>{relatedNotifications.length?<div className="detail-list">{relatedNotifications.slice(0,8).map(item=><article className={item.isRead?'':'unread'} key={item.id}><div><b>{item.message}</b><small>{new Date(item.createdAt).toLocaleString('en-GB')}</small></div></article>)}</div>:<p className="detail-empty">No notifications for this merchant.</p>}</section>
  </main>;
}
