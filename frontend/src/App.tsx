import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, BookOpen, CalendarCheck, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Download, LayoutDashboard, LogOut, Palette, Pencil, Plus, RefreshCw, Search, Store, Trash2, TrendingUp, UserRound, X } from 'lucide-react';
import { api } from './api';
import CasesPage from './CasesPage';
import HomeCharts from './HomeCharts';
import MerchantDetailPage from './MerchantDetailPage';
import NotificationsPage from './NotificationsPage';
import AccountPage from './AccountPage';
import MeetingsPage from './MeetingsPage';
import TeamWorkload from './TeamWorkload';
import { downloadCsv } from './exportCsv';
import Pagination from './Pagination';
import StandbyPage from './StandbyPage';
import ProjectLibraryPage from './ProjectLibraryWithDetails';

type MerchantMid = { mid:string; status:string; paymentMethods:string[]; paymentMethodStatuses:Record<string,string> };
type Merchant = { id:string; name:string; code:string; mids:MerchantMid[]; picName:string|null; picEmail:string|null; paymentMethods:string[]; paymentMethodStatuses:Record<string,string>; techStacks:string[]; integrationTypes:string[]; status:string; progress:number; targetLiveDate?:string; notes?:string; statusUpdatedAt:string };
type Summary = { total:number; live:number; blocked:number; stale:number; averageProgress:number };
type Member = { id:string; name:string; email:string; role:string; standbyGroup?:string|null };
type ThemeChoice='light'|'ocean'|'emerald'|'purple'|'coral'|'amber'|'rose'|'indigo'|'forest'|'graphite'|'dark'|'system';
const labels:Record<string,string> = { ONBOARDING:'Onboarding', INTEGRATION:'Integration', UAT:'UAT', 'READY LIVE':'Ready Live', LIVE:'Live', BLOCKED:'Blocked', CANCEL:'Cancel' };
const paymentOptions = ['CC','VA','CVS','Direct Debit','eWallet','Pay Later','Payout','QRIS'];
const techOptions = ['JavaScript','TypeScript','Java','PHP','Python','Go','C#','Kotlin','Swift','React','Angular','Vue.js','Node.js','Express','NestJS','Laravel','Spring Boot','Django','.NET','WordPress','WooCommerce','Magento','Shopify','Drupal','Joomla','Odoo','WHMCS'];
const integrationOptions = ['V1','V2','Checkout API','Payment API','SNAP API','Settlement','Transaction History','Payment Link'];
const paymentStatusOptions = ['On development','Preparing by merchant','UAT','Ready Live','Live'];
const days = (date:string) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
const greeting = () => {
  const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(new Date()));
  if(hour<12)return'Good morning';
  if(hour<18)return'Good afternoon';
  return'Good evening';
};

function Login({ done }:{ done:()=>void }) {
  const [email, setEmail] = useState(localStorage.getItem('mp_remembered_email')||'');
  const [password, setPassword] = useState('');
  const [rememberMe,setRememberMe]=useState(localStorage.getItem('mp_remember_me')==='true');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event:React.FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const result = await api('/auth/login', { method:'POST', body:JSON.stringify({ email, password, rememberMe }) });
      localStorage.setItem('mp_token', result.accessToken);
      localStorage.setItem('mp_user', JSON.stringify(result.user));
      if(rememberMe){localStorage.setItem('mp_remember_me','true');localStorage.setItem('mp_remembered_email',result.user.email)}
      else{localStorage.removeItem('mp_remember_me');localStorage.removeItem('mp_remembered_email')}
      done();
    } catch (error) { setError((error as Error).message); } finally { setLoading(false); }
  }
  return <main className="login"><section className="login-art">
    <div className="brand"><img src="/nicepay-logo.svg" alt="Nicepay"/><span>Nicepay Integration</span></div>
    <div><p className="eyebrow">INTEGRATION COMMAND CENTER</p><h1>Keep every merchant<br/>moving forward.</h1><p>One clear view of onboarding, integration progress, blockers, and follow-ups.</p></div>
    <div className="quote">“Clarity turns complex integrations into predictable launches.”</div>
  </section><section className="login-panel"><form onSubmit={submit} autoComplete="off">
    <p className="eyebrow">WELCOME BACK</p><h2>Sign in to your workspace</h2><p className="muted">Monitor progress and keep integrations on track.</p>
    <label>Work email<input type="email" value={email} autoComplete="off" onChange={event=>setEmail(event.target.value)}/></label>
    <label>Password<input type="password" value={password} autoComplete="new-password" onChange={event=>setPassword(event.target.value)}/></label>
    <label className="remember-me"><input type="checkbox" checked={rememberMe} onChange={event=>setRememberMe(event.target.checked)}/><span>Remember me on this device</span></label>
    {error && <p className="error">{error}</p>}<button className="primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
  </form></section></main>;
}

function NewMerchant({ close, saved, members, existing }:{ close:()=>void; saved:()=>void; members:Member[]; existing?:Merchant|null }) {
  const initialMids=existing?.mids?.length?existing.mids.map(item=>({
    ...item,
    status:item.status||existing.status,
    paymentMethodStatuses:item.paymentMethodStatuses||Object.fromEntries(item.paymentMethods.map(method=>[method,existing.paymentMethodStatuses?.[method]||'Preparing by merchant'])),
  })):existing?.code
    ? existing.code.split(/[,;\n]+/).map(mid=>({mid:mid.trim(),status:existing.status,paymentMethods:[...(existing.paymentMethods||[])],paymentMethodStatuses:{...(existing.paymentMethodStatuses||{})}}))
    : [{mid:'',status:'ONBOARDING',paymentMethods:[],paymentMethodStatuses:{}}];
  const [form, setForm] = useState({ name:existing?.name||'', mids:initialMids, picUserId:existing?(members.find(member=>member.email===existing.picEmail)?.id||''):(members[0]?.id||''), techStacks:existing?.techStacks||[] as string[], integrationTypes:existing?.integrationTypes||[] as string[], targetLiveDate:existing?.targetLiveDate?.slice(0,10)||'', notes:existing?.notes||'' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key:string, value:string) => setForm({ ...form, [key]:value });
  const toggle = (key:'techStacks'|'integrationTypes', value:string) => setForm({...form,[key]:form[key].includes(value)?form[key].filter(item=>item!==value):[...form[key],value]});
  const setMid=(index:number,mid:string)=>setForm({...form,mids:form.mids.map((item,itemIndex)=>itemIndex===index?{...item,mid}:item)});
  const setMidStatus=(index:number,status:string)=>setForm({...form,mids:form.mids.map((item,itemIndex)=>itemIndex===index?{...item,status}:item)});
  const toggleMidMethod=(index:number,method:string)=>setForm({...form,mids:form.mids.map((item,itemIndex)=>{
    if(itemIndex!==index)return item;
    if(item.paymentMethods.includes(method)){
      const paymentMethodStatuses={...item.paymentMethodStatuses};
      delete paymentMethodStatuses[method];
      return {...item,paymentMethods:item.paymentMethods.filter(value=>value!==method),paymentMethodStatuses};
    }
    return {...item,paymentMethods:[...item.paymentMethods,method],paymentMethodStatuses:{...item.paymentMethodStatuses,[method]:'Preparing by merchant'}};
  })});
  const addMid=()=>setForm({...form,mids:[...form.mids,{mid:'',status:'ONBOARDING',paymentMethods:[],paymentMethodStatuses:{}}]});
  const removeMid=(index:number)=>setForm({...form,mids:form.mids.filter((_,itemIndex)=>itemIndex!==index)});
  async function submit(event:React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api(existing?`/merchants/${existing.id}`:'/merchants', { method:existing?'PATCH':'POST', body:JSON.stringify(form) }); saved(); close(); }
    catch (error) { setError((error as Error).message); setBusy(false); }
  }
  const pic = members.find(member => member.id === form.picUserId);
  return <div className="overlay"><form className="modal" onSubmit={submit}>
    <button className="icon close" type="button" onClick={close}><X/></button><p className="eyebrow">{existing?'EDIT RECORD':'NEW RECORD'}</p><h2>{existing?'Edit merchant':'Add merchant'}</h2>
    <label>Merchant name<input required value={form.name} onChange={event=>set('name', event.target.value)}/></label>
    <fieldset className="mid-fieldset"><legend>Merchant MIDs and payment methods</legend>
      <p className="field-help">Add every MID under this merchant and select the payment methods enabled on each MID.</p>
      <div className="mid-list">{form.mids.map((item,index)=><section className="mid-card" key={index}>
        <div className="mid-heading"><label>MID {index+1}<input required value={item.mid} onChange={event=>setMid(index,event.target.value)} placeholder="e.g. NICEPAY0001"/></label><label>MID status<select value={item.status} onChange={event=>setMidStatus(index,event.target.value)}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>{form.mids.length>1&&<button type="button" className="remove-mid" onClick={()=>removeMid(index)}><Trash2/>Remove</button>}</div>
        <div className="option-grid">{paymentOptions.map(option=><label className="check-option" key={option}><input type="checkbox" checked={item.paymentMethods.includes(option)} onChange={()=>toggleMidMethod(index,option)}/><span>{option}</span></label>)}</div>
      </section>)}</div>
      <button className="add-mid" type="button" onClick={addMid}><Plus/>Add another MID</button>
    </fieldset>
    <label>Integration PIC<select value={form.picUserId} onChange={event=>set('picUserId', event.target.value)}>
      <option value="">Not decided yet</option>{members.map(member=><option key={member.id} value={member.id}>{member.name} — {member.role}</option>)}
    </select></label>
    {pic && <p style={{margin:'-7px 0 12px',color:'#64736f',fontSize:12}}>{pic.email}</p>}
    <fieldset><legend>Integration types</legend><div className="option-grid">{integrationOptions.map(option=><label className="check-option" key={option}><input type="checkbox" checked={form.integrationTypes.includes(option)} onChange={()=>toggle('integrationTypes',option)}/><span>{option}</span></label>)}</div></fieldset>
    <fieldset><legend>Tech stack</legend><div className="option-grid tech-options">{techOptions.map(option=><label className="check-option" key={option}><input type="checkbox" checked={form.techStacks.includes(option)} onChange={()=>toggle('techStacks',option)}/><span>{option}</span></label>)}</div></fieldset>
    <label>Target live date<input type="date" value={form.targetLiveDate} onChange={event=>set('targetLiveDate', event.target.value)}/></label>
    <label>Notes<textarea rows={3} value={form.notes} onChange={event=>set('notes', event.target.value)}/></label>
    {error && <p className="error">{error}</p>}<div className="actions"><button type="button" onClick={close}>Cancel</button><button className="primary" disabled={busy}>{existing?'Save merchant':'Create merchant'}</button></div>
  </form></div>;
}

function Update({ merchant, members, close, save }:{ merchant:Merchant; members:Member[]; close:()=>void; save:(m:Merchant,s:string,p:number,n:string,paymentStatuses:Record<string,string>,midStatuses:Record<string,string>,midPaymentStatuses:Record<string,Record<string,string>>,picUserId:string)=>void }) {
  const [status, setStatus] = useState(merchant.status);
  const [progress, setProgress] = useState(merchant.progress);
  const [note, setNote] = useState('');
  const progressMids=merchant.mids?.length?merchant.mids:[{mid:merchant.code,status:merchant.status,paymentMethods:merchant.paymentMethods||[],paymentMethodStatuses:merchant.paymentMethodStatuses||{}}];
  const [midStatuses,setMidStatuses]=useState<Record<string,string>>(Object.fromEntries(progressMids.map(item=>[item.mid,item.status||merchant.status])));
  const [midPaymentStatuses,setMidPaymentStatuses]=useState<Record<string,Record<string,string>>>(Object.fromEntries(progressMids.map(item=>[
    item.mid,Object.fromEntries(item.paymentMethods.map(method=>[method,item.paymentMethodStatuses?.[method]||merchant.paymentMethodStatuses?.[method]||'Preparing by merchant'])),
  ])));
  const [picUserId,setPicUserId]=useState(members.find(member=>member.email===merchant.picEmail)?.id||'');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const overallStatuses=()=>{
    const order=['Preparing by merchant','On development','UAT','Ready Live','Live'];
    return Object.fromEntries((merchant.paymentMethods||[]).map(method=>{
      const statuses=progressMids.filter(item=>item.paymentMethods.includes(method)).map(item=>midPaymentStatuses[item.mid]?.[method]).filter(Boolean);
      return [method,statuses.sort((a,b)=>order.indexOf(a)-order.indexOf(b))[0]||merchant.paymentMethodStatuses?.[method]||'Preparing by merchant'];
    }));
  };
  const setMidStatus=(mid:string,method:string,value:string)=>setMidPaymentStatuses({...midPaymentStatuses,[mid]:{...midPaymentStatuses[mid],[method]:value}});
  return <div className="overlay"><form className="modal" onSubmit={async event=>{ event.preventDefault(); setBusy(true); setError(''); try{await save(merchant,status,progress,note,overallStatuses(),midStatuses,midPaymentStatuses,picUserId);}catch(error){setError((error as Error).message);setBusy(false);} }}>
    <button className="icon close" type="button" onClick={close}><X/></button><p className="eyebrow">PROGRESS UPDATE</p><h2>{merchant.name}</h2>
    <label>Status<select value={status} onChange={event=>setStatus(event.target.value)}>{Object.keys(labels).map(value=><option key={value} value={value}>{labels[value]}</option>)}</select></label>
    <label>Integration PIC<select value={picUserId} onChange={event=>setPicUserId(event.target.value)}><option value="">Not decided yet</option>{members.map(member=><option key={member.id} value={member.id}>{member.name} — {member.role}</option>)}</select></label>
    <label>Completion — {progress}%<input type="range" min="0" max="100" step="5" value={progress} onChange={event=>setProgress(+event.target.value)}/></label>
    <p className="field-help">Add or remove MIDs and their payment methods from the Edit merchant action.</p>
    {!!progressMids.length&&<div className="mid-progress-list">{progressMids.map(item=><fieldset key={item.mid}><legend>{item.mid}</legend><label>MID status<select value={midStatuses[item.mid]||merchant.status} onChange={event=>setMidStatuses({...midStatuses,[item.mid]:event.target.value})}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>{item.paymentMethods.length?<div className="payment-status-list">{item.paymentMethods.map(method=><label key={method}><span>{method}</span><select value={midPaymentStatuses[item.mid]?.[method]||'Preparing by merchant'} onChange={event=>setMidStatus(item.mid,method,event.target.value)}>{paymentStatusOptions.map(value=><option key={value} value={value}>{value}</option>)}</select></label>)}</div>:<p className="field-help">No payment methods assigned to this MID.</p>}</fieldset>)}</div>}
    <label>Update note<textarea rows={4} value={note} onChange={event=>setNote(event.target.value)} placeholder="What changed? Any blockers?"/></label>
    {error&&<p className="error">{error}</p>}<div className="actions"><button type="button" onClick={close}>Cancel</button><button className="primary" disabled={busy}>{busy?'Saving…':'Save update'}</button></div>
  </form></div>;
}

export default function App() {
  const [theme,setTheme]=useState<ThemeChoice>(()=>(localStorage.getItem('mp_theme') as ThemeChoice)||'light');
  const [authed, setAuthed] = useState(!!localStorage.getItem('mp_token'));
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<Summary>({ total:0, live:0, blocked:0, stale:0, averageProgress:0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cases,setCases]=useState<any[]>([]);
  const [standbyToday,setStandbyToday]=useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [picFilter,setPicFilter]=useState('ALL');
  const [merchantPage,setMerchantPage]=useState(1);
  const [merchantPageSize,setMerchantPageSize]=useState(20);
  const [selected, setSelected] = useState<Merchant|null>(null);
  const [editingMerchant,setEditingMerchant]=useState<Merchant|null>(null);
  const [bell, setBell] = useState(false);
  const [page,setPage]=useState<'overview'|'merchants'|'merchant-detail'|'notifications'|'cases'|'meetings'|'standby'|'library'|'account'>('overview');
  const [detailMerchant,setDetailMerchant]=useState<Merchant|null>(null);
  const [refreshVersion,setRefreshVersion]=useState(0);
  const [refreshing,setRefreshing]=useState(false);
  const user = JSON.parse(localStorage.getItem('mp_user') || '{"name":"Technical Lead","role":"Integration"}');
  const canViewTeamWorkload=/\b(lead|head)\b/i.test(user.role||'');
  useEffect(()=>{const media=window.matchMedia('(prefers-color-scheme: dark)');const apply=()=>{const resolved=theme==='system'?(media.matches?'dark':'light'):theme==='dark'?'dark':'light';document.documentElement.dataset.theme=resolved;document.documentElement.dataset.accent=['ocean','emerald','purple','coral','amber','rose','indigo','forest','graphite'].includes(theme)?theme:'nicepay';document.documentElement.dataset.themeChoice=theme;localStorage.setItem('mp_theme',theme)};apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply)},[theme]);
  async function load() {
    const [merchantData, summaryData, notificationData, memberData,caseData,todayData] = await Promise.all([api('/merchants'), api('/merchants/summary'), api('/notifications'), api('/users'),api('/cases'),api('/standby/today')]);
    setMerchants(merchantData); setSummary(summaryData); setNotifications(notificationData); setMembers(memberData); setCases(caseData);setStandbyToday(todayData);
    setDetailMerchant(current=>current?(merchantData.find((merchant:Merchant)=>merchant.id===current.id)||current):null);
  }
  useEffect(() => { if (authed) load(); }, [authed]);
  if (!authed) return <Login done={()=>setAuthed(true)}/>;
  const visible = merchants
    .filter(merchant => (filter === 'ALL' || merchant.status === filter) && (picFilter === 'ALL' || merchant.picEmail === picFilter) && (`${merchant.name} ${merchant.code}`.toLowerCase().includes(search.toLowerCase())))
    .sort((first,second)=>new Date(second.statusUpdatedAt).getTime()-new Date(first.statusUpdatedAt).getTime());
  const merchantPageCount=Math.max(1,Math.ceil(visible.length/merchantPageSize));
  const safeMerchantPage=Math.min(merchantPage,merchantPageCount);
  const pagedMerchants=visible.slice((safeMerchantPage-1)*merchantPageSize,safeMerchantPage*merchantPageSize);
  const myStandby=standbyToday.find(item=>item.member?.email?.toLowerCase()===user.email?.toLowerCase());
  async function update(merchant:Merchant, status:string, progress:number, note:string, paymentMethodStatuses:Record<string,string>,midStatuses:Record<string,string>,midPaymentMethodStatuses:Record<string,Record<string,string>>,picUserId:string) {
    const updated=await api(`/merchants/${merchant.id}/progress`, { method:'PATCH', body:JSON.stringify({ status, progress, note, paymentMethodStatuses, midStatuses, midPaymentMethodStatuses, picUserId }) }); setSelected(null); if(detailMerchant?.id===updated.id)setDetailMerchant(updated); load();
  }
  async function deleteMerchant(merchant:Merchant){
    if(!window.confirm(`Delete ${merchant.name}? Its cases, notifications, and progress history will also be deleted.`))return;
    await api(`/merchants/${merchant.id}`,{method:'DELETE'});
    await load();
  }
  function exportMerchants() {
    downloadCsv('merchant-report', ['Merchant name','MIDs','MID payment methods','Status','PIC name','PIC email','Payment methods','Payment method statuses','Tech stacks','Integration types','Progress (%)','Last update','Target live date','Notes'], visible.map(merchant=>[
      merchant.name,merchant.code,merchant.mids?.map(item=>`${item.mid} [${labels[item.status]||item.status}]: ${item.paymentMethods.map(method=>`${method} (${item.paymentMethodStatuses?.[method]||merchant.paymentMethodStatuses?.[method]||'-'})`).join(', ')}`).join('; ')||'',
      labels[merchant.status]||merchant.status,merchant.picName,merchant.picEmail,
      merchant.paymentMethods?.join('; '),merchant.paymentMethods?.map(method=>`${method}: ${merchant.paymentMethodStatuses?.[method]||'-'}`).join('; '),
      merchant.techStacks?.join('; '),merchant.integrationTypes?.join('; '),merchant.progress,
      merchant.statusUpdatedAt?new Date(merchant.statusUpdatedAt).toLocaleString('en-GB'):'',merchant.targetLiveDate||'',merchant.notes||''
    ]));
  }
  function clearMerchantFilters(){
    setSearch('');setPicFilter('ALL');setFilter('ALL');setMerchantPage(1);
  }
  function openMerchantDetail(merchant:Merchant){
    setDetailMerchant(merchant);
    setPage('merchant-detail');
  }
  async function refreshData(){
    if(refreshing)return;
    setRefreshing(true);
    try{await load();setRefreshVersion(version=>version+1)}finally{setRefreshing(false)}
  }
  return <div className="app"><aside>
    <div className="brand"><img src="/nicepay-logo.svg" alt="Nicepay"/><span>Nicepay<br/>Integration</span></div><nav><a className={page==='overview'?'active':''} onClick={()=>setPage('overview')}><LayoutDashboard/>Overview</a><a className={page==='merchants'||page==='merchant-detail'?'active':''} onClick={()=>setPage('merchants')}><Store/>Merchants</a><a className={page==='cases'?'active':''} onClick={()=>setPage('cases')}><ClipboardCheck/>Case checking</a><a className={page==='meetings'?'active':''} onClick={()=>setPage('meetings')}><CalendarDays/>Meetings</a><a className={page==='library'?'active':''} onClick={()=>setPage('library')}><BookOpen/>Project library</a><a className={page==='standby'?'active':''} onClick={()=>setPage('standby')}><CalendarCheck/>Standby schedule</a><a className={page==='notifications'?'active':''} onClick={()=>setPage('notifications')}><Bell/>Notifications</a><a className={page==='account'?'active':''} onClick={()=>setPage('account')}><UserRound/>Account</a><button className="nav-refresh" type="button" disabled={refreshing} onClick={refreshData}><RefreshCw className={refreshing?'spinning':''}/><span>{refreshing?'Refreshing…':'Refresh data'}</span></button></nav>
    <button className={`library-nav-link ${page==='library'?'active':''}`} onClick={()=>setPage('library')}><BookOpen/>Project library</button><div className="theme-picker"><Palette/><label><span>Theme</span><select aria-label="Application theme" value={theme} onChange={event=>setTheme(event.target.value as ThemeChoice)}><option value="light">Nicepay</option><option value="ocean">Ocean blue</option><option value="emerald">Emerald</option><option value="purple">Purple</option><option value="coral">Coral</option><option value="amber">Amber</option><option value="rose">Rose</option><option value="indigo">Indigo</option><option value="forest">Forest</option><option value="graphite">Graphite</option><option value="dark">Dark</option><option value="system">System</option></select></label></div><div className="aside-foot"><div className="avatar">{user.name?.split(' ').map((part:string)=>part[0]).join('').slice(0,2)}</div><div><b>{user.name}</b><small>{user.role || 'Integration'}</small></div><button aria-label="Sign out" className="icon" onClick={()=>{localStorage.removeItem('mp_token');localStorage.removeItem('mp_user');setAuthed(false)}}><LogOut/></button></div>
  </aside>{page==='overview'?<main className="content">
    <header><div><p className="eyebrow">INTEGRATION OVERVIEW</p><h1>{greeting()}, {user.name?.split(' ')[0]}.</h1><p className="muted">Here’s what needs your attention across merchant integrations.</p></div>
      <div className="header-actions"><button aria-label="Notifications" className="bell icon" onClick={()=>setBell(!bell)}><Bell/><em>{notifications.filter(item=>!item.isRead).length}</em></button></div>
      {bell&&<div className="notification-pop"><h3>Notifications</h3>{notifications.length?notifications.slice(0,5).map(item=><div className={item.isRead?'':'unread'} key={item.id}><AlertTriangle/><span>{item.message}<small>{new Date(item.createdAt).toLocaleDateString()}</small></span></div>):<p className="muted">You’re all caught up.</p>}</div>}
    </header>
    {myStandby&&<section className="today-standby"><CalendarCheck/><div><b>{greeting()}, {user.name?.split(' ')[0]}. Today is your standby schedule.</b><p>You are assigned for {myStandby.groupName==='GROUP_1'?'Group 1':'Group 2'}. Please stay available during working hours.</p></div></section>}
    <section className="attention"><div className="attention-icon"><AlertTriangle/></div><div><b>{summary.stale} merchants need a progress update</b><p>No status changes for 7 days or more. Follow up to keep timelines on track.</p></div><button onClick={()=>setPage('merchants')}>Review now <ChevronRight/></button></section>
    <HomeCharts merchants={merchants} cases={cases} notifications={notifications}/>
    {canViewTeamWorkload&&<TeamWorkload key={refreshVersion} members={members} merchants={merchants} cases={cases}/>} 
  </main>:page==='merchants'?<main className="content merchants-page">
    <header><div><p className="eyebrow">MERCHANT OPERATIONS</p><h1>Merchants</h1><p className="muted">Create merchants, manage integration progress, and maintain MID payment methods.</p></div><div className="header-actions"><button className="primary" onClick={()=>setModal(true)}><Plus/>Add merchant</button></div></header>
    <section className="stats merchant-kpis"><article><span>Total merchants</span><b>{summary.total}</b><small><TrendingUp/> Active portfolio</small></article><article><span>Average progress</span><b>{summary.averageProgress}%</b><small>Across all integrations</small></article><article><span>Live merchants</span><b>{summary.live}</b><small><CheckCircle2/> Successfully launched</small></article><article><span>Integration process</span><b>{merchants.filter(merchant=>merchant.status==='INTEGRATION').length}</b><small>Currently integrating</small></article><article><span>Blocked</span><b>{summary.blocked}</b><small className="danger">Needs intervention</small></article><article><span>Cancelled</span><b>{merchants.filter(merchant=>merchant.status==='CANCEL').length}</b><small>Integration discontinued</small></article></section>
    <section className="table-card merchant-table-card"><div className="table-head merchant-filters"><div className="merchant-filter-heading"><div><h2>Merchant progress</h2><p className="muted">Filter merchants by name, MID, PIC, or integration status.</p></div><button className="export-button" onClick={exportMerchants} disabled={!visible.length}><Download/>Export ({visible.length})</button></div><div className="merchant-filter-grid"><label><span>Search merchant</span><div className="merchant-search"><Search/><input placeholder="Merchant name or MID" value={search} onChange={event=>{setSearch(event.target.value);setMerchantPage(1)}}/></div></label><label><span>PIC</span><select value={picFilter} onChange={event=>{setPicFilter(event.target.value);setMerchantPage(1)}}><option value="ALL">All PICs</option>{members.map(member=><option key={member.id} value={member.email}>{member.name}</option>)}</select></label><label><span>Status</span><select value={filter} onChange={event=>{setFilter(event.target.value);setMerchantPage(1)}}><option value="ALL">All statuses</option>{Object.keys(labels).map(value=><option key={value} value={value}>{labels[value]}</option>)}</select></label><div className="merchant-filter-actions"><button type="button" onClick={clearMerchantFilters}>Clear filters</button></div></div></div>
      <div className="table-scroll"><table className="merchant-table responsive-table">
        <thead><tr><th>Merchant</th><th>Status</th><th>PIC</th><th>MIDs &amp; payment methods</th><th>Progress</th><th>Last update</th><th>Target live</th><th>Actions</th></tr></thead>
        <tbody>{pagedMerchants.map(merchant=>{
          const finished=['LIVE','CANCEL'].includes(merchant.status);
          return <tr key={merchant.id} className={days(merchant.statusUpdatedAt)>=7&&!finished?'stale':''}>
            <td data-label="Merchant"><div className="merchant-identity"><div className="merchant-logo">{merchant.name.slice(0,2).toUpperCase()}</div><div><button className="merchant-detail-link" onClick={()=>openMerchantDetail(merchant)}>{merchant.name}</button><small>{merchant.mids?.length?`${merchant.mids.length} MID${merchant.mids.length>1?'s':''}`:merchant.code}</small></div></div></td>
            <td data-label="Status"><span className={`status ${merchant.status.toLowerCase()}`}>{labels[merchant.status]}</span></td>
            <td data-label="PIC"><b>{merchant.picName||'Not decided yet'}</b>{merchant.picEmail&&<small>{merchant.picEmail}</small>}</td>
            <td data-label="MIDs & methods"><div className="mid-method-list">{merchant.mids?.length?merchant.mids.map(item=><section className="mid-method-row" key={item.mid}>
              <div className="mid-method-heading"><b>{item.mid}</b><span className={`mid-status ${item.status.toLowerCase()}`}>{labels[item.status]||item.status}</span></div>
              <div className="method-chips">{item.paymentMethods.length?item.paymentMethods.map(method=><span key={method}><b>{method}</b><small>{item.paymentMethodStatuses?.[method]||'Preparing by merchant'}</small></span>):<em>No payment methods</em>}</div>
            </section>):<span className="muted">No MID assigned</span>}</div></td>
            <td data-label="Progress"><div className="merchant-progress"><div className="progress"><i style={{width:`${merchant.progress}%`}}/></div><b>{merchant.progress}%</b></div></td>
            <td data-label="Last update"><span>{days(merchant.statusUpdatedAt)===0?'Today':`${days(merchant.statusUpdatedAt)} days ago`}</span>{days(merchant.statusUpdatedAt)>=7&&!finished&&<small className="danger">Update overdue</small>}</td>
            <td data-label="Target live">{merchant.targetLiveDate?new Date(merchant.targetLiveDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
            <td data-label="Actions"><div className="row-actions"><button title="Edit merchant" onClick={()=>setEditingMerchant(merchant)}><Pencil/>Edit</button><button title="Update progress" onClick={()=>setSelected(merchant)}>Progress <ChevronRight/></button><button className="delete-action" title="Delete merchant" onClick={()=>deleteMerchant(merchant)}><Trash2/></button></div></td>
          </tr>;
        })}</tbody>
      </table></div>
      {!!visible.length&&<Pagination total={visible.length} page={safeMerchantPage} pageSize={merchantPageSize} onPage={setMerchantPage} onPageSize={size=>{setMerchantPageSize(size);setMerchantPage(1)}}/>}
      {!visible.length&&<div className="empty">No merchants match your filters.</div>}
    </section>
  </main>:page==='library'?<ProjectLibraryPage key={refreshVersion} members={members}/>:page==='merchant-detail'&&detailMerchant?<MerchantDetailPage key={`${detailMerchant.id}-${refreshVersion}`} merchant={detailMerchant} onBack={()=>setPage('merchants')} onCases={()=>setPage('cases')} onMeetings={()=>setPage('meetings')} onProgress={()=>setSelected(detailMerchant)}/>:page==='notifications'?<NotificationsPage key={refreshVersion} onMerchant={openMerchantDetail} onCases={()=>setPage('cases')} onMeetings={()=>setPage('meetings')} onChanged={load}/>:page==='cases'?<CasesPage key={refreshVersion} merchants={merchants} members={members}/>:page==='meetings'?<MeetingsPage key={refreshVersion} merchants={merchants} members={members}/>:page==='standby'?<StandbyPage key={refreshVersion} members={members} onMembersChanged={load}/>:<AccountPage key={refreshVersion} user={user} onUserCreated={load}/>} {modal&&<NewMerchant close={()=>setModal(false)} saved={load} members={members}/>} {editingMerchant&&<NewMerchant existing={editingMerchant} close={()=>setEditingMerchant(null)} saved={load} members={members}/>} {selected&&<Update merchant={selected} members={members} close={()=>setSelected(null)} save={update}/>}</div>;
}
