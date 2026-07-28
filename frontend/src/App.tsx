import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, ClipboardCheck, Download, LayoutDashboard, LogOut, Plus, Search, Store, TrendingUp, UserRound, X } from 'lucide-react';
import { api } from './api';
import CasesPage from './CasesPage';
import HomeCharts from './HomeCharts';
import AccountPage from './AccountPage';
import { downloadCsv } from './exportCsv';

type Merchant = { id:string; name:string; code:string; picName:string; picEmail:string; paymentMethods:string[]; paymentMethodStatuses:Record<string,string>; techStacks:string[]; integrationTypes:string[]; status:string; progress:number; targetLiveDate?:string; notes?:string; statusUpdatedAt:string };
type Summary = { total:number; live:number; blocked:number; stale:number; averageProgress:number };
type Member = { id:string; name:string; email:string; role:string };
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event:React.FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const result = await api('/auth/login', { method:'POST', body:JSON.stringify({ email, password }) });
      localStorage.setItem('mp_token', result.accessToken);
      localStorage.setItem('mp_user', JSON.stringify(result.user));
      done();
    } catch (error) { setError((error as Error).message); } finally { setLoading(false); }
  }
  return <main className="login"><section className="login-art">
    <div className="brand"><i>NI</i><span>Nicepay Integration</span></div>
    <div><p className="eyebrow">INTEGRATION COMMAND CENTER</p><h1>Keep every merchant<br/>moving forward.</h1><p>One clear view of onboarding, integration progress, blockers, and follow-ups.</p></div>
    <div className="quote">“Clarity turns complex integrations into predictable launches.”</div>
  </section><section className="login-panel"><form onSubmit={submit} autoComplete="off">
    <p className="eyebrow">WELCOME BACK</p><h2>Sign in to your workspace</h2><p className="muted">Monitor progress and keep integrations on track.</p>
    <label>Work email<input type="email" value={email} autoComplete="off" onChange={event=>setEmail(event.target.value)}/></label>
    <label>Password<input type="password" value={password} autoComplete="new-password" onChange={event=>setPassword(event.target.value)}/></label>
    {error && <p className="error">{error}</p>}<button className="primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
  </form></section></main>;
}

function NewMerchant({ close, saved, members }:{ close:()=>void; saved:()=>void; members:Member[] }) {
  const [form, setForm] = useState({ name:'', code:'', picUserId:members[0]?.id || '', paymentMethods:[] as string[], techStacks:[] as string[], integrationTypes:[] as string[], targetLiveDate:'', notes:'' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key:string, value:string) => setForm({ ...form, [key]:value });
  const toggle = (key:'paymentMethods'|'techStacks'|'integrationTypes', value:string) => setForm({...form,[key]:form[key].includes(value)?form[key].filter(item=>item!==value):[...form[key],value]});
  async function submit(event:React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api('/merchants', { method:'POST', body:JSON.stringify(form) }); saved(); close(); }
    catch (error) { setError((error as Error).message); setBusy(false); }
  }
  const pic = members.find(member => member.id === form.picUserId);
  return <div className="overlay"><form className="modal" onSubmit={submit}>
    <button className="icon close" type="button" onClick={close}><X/></button><p className="eyebrow">NEW RECORD</p><h2>Add merchant</h2>
    <div className="grid2"><label>Merchant name<input required onChange={event=>set('name', event.target.value)}/></label><label>Merchant code<input required onChange={event=>set('code', event.target.value)}/></label></div>
    <label>Integration PIC<select required value={form.picUserId} onChange={event=>set('picUserId', event.target.value)}>
      <option value="" disabled>Select a member</option>{members.map(member=><option key={member.id} value={member.id}>{member.name} — {member.role}</option>)}
    </select></label>
    {pic && <p style={{margin:'-7px 0 12px',color:'#64736f',fontSize:12}}>{pic.email}</p>}
    <fieldset><legend>Payment methods</legend><div className="option-grid">{paymentOptions.map(option=><label className="check-option" key={option}><input type="checkbox" checked={form.paymentMethods.includes(option)} onChange={()=>toggle('paymentMethods',option)}/><span>{option}</span></label>)}</div></fieldset>
    <fieldset><legend>Integration types</legend><div className="option-grid">{integrationOptions.map(option=><label className="check-option" key={option}><input type="checkbox" checked={form.integrationTypes.includes(option)} onChange={()=>toggle('integrationTypes',option)}/><span>{option}</span></label>)}</div></fieldset>
    <fieldset><legend>Tech stack</legend><div className="option-grid tech-options">{techOptions.map(option=><label className="check-option" key={option}><input type="checkbox" checked={form.techStacks.includes(option)} onChange={()=>toggle('techStacks',option)}/><span>{option}</span></label>)}</div></fieldset>
    <label>Target live date<input type="date" onChange={event=>set('targetLiveDate', event.target.value)}/></label>
    <label>Notes<textarea rows={3} onChange={event=>set('notes', event.target.value)}/></label>
    {error && <p className="error">{error}</p>}<div className="actions"><button type="button" onClick={close}>Cancel</button><button className="primary" disabled={busy || !form.picUserId}>Create merchant</button></div>
  </form></div>;
}

function Update({ merchant, members, close, save }:{ merchant:Merchant; members:Member[]; close:()=>void; save:(m:Merchant,s:string,p:number,n:string,paymentMethods:string[],paymentStatuses:Record<string,string>,picUserId:string)=>void }) {
  const [status, setStatus] = useState(merchant.status);
  const [progress, setProgress] = useState(merchant.progress);
  const [note, setNote] = useState('');
  const [methods, setMethods] = useState<string[]>(merchant.paymentMethods || []);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string,string>>(merchant.paymentMethodStatuses || {});
  const [picUserId,setPicUserId]=useState(members.find(member=>member.email===merchant.picEmail)?.id||'');
  const toggleMethod = (method:string) => {
    if (methods.includes(method)) setMethods(methods.filter(value=>value!==method));
    else {
      setMethods([...methods,method]);
      setPaymentStatuses({...paymentStatuses,[method]:paymentStatuses[method] || 'Preparing by merchant'});
    }
  };
  return <div className="overlay"><form className="modal" onSubmit={event=>{ event.preventDefault(); save(merchant,status,progress,note,methods,paymentStatuses,picUserId); }}>
    <button className="icon close" type="button" onClick={close}><X/></button><p className="eyebrow">PROGRESS UPDATE</p><h2>{merchant.name}</h2>
    <label>Status<select value={status} onChange={event=>setStatus(event.target.value)}>{Object.keys(labels).map(value=><option key={value} value={value}>{labels[value]}</option>)}</select></label>
    <label>Integration PIC<select required value={picUserId} onChange={event=>setPicUserId(event.target.value)}><option value="" disabled>Select a member</option>{members.map(member=><option key={member.id} value={member.id}>{member.name} — {member.role}</option>)}</select></label>
    <label>Completion — {progress}%<input type="range" min="0" max="100" step="5" value={progress} onChange={event=>setProgress(+event.target.value)}/></label>
    <fieldset><legend>Payment methods</legend><div className="option-grid">{paymentOptions.map(method=><label className="check-option" key={method}><input type="checkbox" checked={methods.includes(method)} onChange={()=>toggleMethod(method)}/><span>{method}</span></label>)}</div></fieldset>
    {!!methods.length && <fieldset><legend>Payment method status</legend><div className="payment-status-list">{methods.map(method=><label key={method}><span>{method}</span><select value={paymentStatuses[method] || 'Preparing by merchant'} onChange={event=>setPaymentStatuses({...paymentStatuses,[method]:event.target.value})}>{paymentStatusOptions.map(value=><option key={value} value={value}>{value}</option>)}</select></label>)}</div></fieldset>}
    <label>Update note<textarea rows={4} value={note} onChange={event=>setNote(event.target.value)} placeholder="What changed? Any blockers?"/></label>
    <div className="actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save update</button></div>
  </form></div>;
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('mp_token'));
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<Summary>({ total:0, live:0, blocked:0, stale:0, averageProgress:0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cases,setCases]=useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [picFilter,setPicFilter]=useState('ALL');
  const [selected, setSelected] = useState<Merchant|null>(null);
  const [bell, setBell] = useState(false);
  const [page,setPage]=useState<'overview'|'cases'|'account'>('overview');
  const user = JSON.parse(localStorage.getItem('mp_user') || '{"name":"Technical Lead","role":"Integration"}');
  async function load() {
    const [merchantData, summaryData, notificationData, memberData,caseData] = await Promise.all([api('/merchants'), api('/merchants/summary'), api('/notifications'), api('/users'),api('/cases')]);
    setMerchants(merchantData); setSummary(summaryData); setNotifications(notificationData); setMembers(memberData); setCases(caseData);
  }
  useEffect(() => { if (authed) load(); }, [authed]);
  if (!authed) return <Login done={()=>setAuthed(true)}/>;
  const visible = merchants.filter(merchant => (filter === 'ALL' || merchant.status === filter) && (picFilter === 'ALL' || merchant.picEmail === picFilter) && (`${merchant.name} ${merchant.code}`.toLowerCase().includes(search.toLowerCase())));
  async function update(merchant:Merchant, status:string, progress:number, note:string, paymentMethods:string[], paymentMethodStatuses:Record<string,string>,picUserId:string) {
    await api(`/merchants/${merchant.id}/progress`, { method:'PATCH', body:JSON.stringify({ status, progress, note, paymentMethods, paymentMethodStatuses, picUserId }) }); setSelected(null); load();
  }
  function exportMerchants() {
    downloadCsv('merchant-report', ['Merchant name','Merchant code','Status','PIC name','PIC email','Payment methods','Payment method statuses','Tech stacks','Integration types','Progress (%)','Last update','Target live date','Notes'], visible.map(merchant=>[
      merchant.name,merchant.code,labels[merchant.status]||merchant.status,merchant.picName,merchant.picEmail,
      merchant.paymentMethods?.join('; '),merchant.paymentMethods?.map(method=>`${method}: ${merchant.paymentMethodStatuses?.[method]||'-'}`).join('; '),
      merchant.techStacks?.join('; '),merchant.integrationTypes?.join('; '),merchant.progress,
      merchant.statusUpdatedAt?new Date(merchant.statusUpdatedAt).toLocaleString('en-GB'):'',merchant.targetLiveDate||'',merchant.notes||''
    ]));
  }
  return <div className="app"><aside>
    <div className="brand"><i>NI</i><span>Nicepay<br/>Integration</span></div><nav><a className={page==='overview'?'active':''} onClick={()=>setPage('overview')}><LayoutDashboard/>Overview</a><a className={page==='overview'?'active':''} onClick={()=>setPage('overview')}><Store/>Merchants</a><a className={page==='cases'?'active':''} onClick={()=>setPage('cases')}><ClipboardCheck/>Case checking</a><a className={page==='account'?'active':''} onClick={()=>setPage('account')}><UserRound/>Account</a></nav>
    <div className="aside-foot"><div className="avatar">{user.name?.split(' ').map((part:string)=>part[0]).join('').slice(0,2)}</div><div><b>{user.name}</b><small>{user.role || 'Integration'}</small></div><button aria-label="Sign out" className="icon" onClick={()=>{localStorage.clear();setAuthed(false)}}><LogOut/></button></div>
  </aside>{page==='overview'?<main className="content">
    <header><div><p className="eyebrow">INTEGRATION OVERVIEW</p><h1>{greeting()}, {user.name?.split(' ')[0]}.</h1><p className="muted">Here’s what needs your attention across merchant integrations.</p></div>
      <div className="header-actions"><button aria-label="Notifications" className="bell icon" onClick={()=>setBell(!bell)}><Bell/><em>{notifications.filter(item=>!item.isRead).length}</em></button><button className="primary" onClick={()=>setModal(true)}><Plus/>Add merchant</button></div>
      {bell&&<div className="notification-pop"><h3>Notifications</h3>{notifications.length?notifications.slice(0,5).map(item=><div className={item.isRead?'':'unread'} key={item.id}><AlertTriangle/><span>{item.message}<small>{new Date(item.createdAt).toLocaleDateString()}</small></span></div>):<p className="muted">You’re all caught up.</p>}</div>}
    </header>
    <section className="attention"><div className="attention-icon"><AlertTriangle/></div><div><b>{summary.stale} merchants need a progress update</b><p>No status changes for 7 days or more. Follow up to keep timelines on track.</p></div><button>Review now <ChevronRight/></button></section>
    <HomeCharts merchants={merchants} cases={cases} notifications={notifications}/>
    <section className="stats"><article><span>Total merchants</span><b>{summary.total}</b><small><TrendingUp/> Active portfolio</small></article><article><span>Average progress</span><b>{summary.averageProgress}%</b><small>Across all integrations</small></article><article><span>Live merchants</span><b>{summary.live}</b><small><CheckCircle2/> Successfully launched</small></article><article><span>Blocked</span><b>{summary.blocked}</b><small className="danger">Needs intervention</small></article></section>
    <section className="table-card"><div className="table-head"><div><h2>Merchant progress</h2><p className="muted">Track every integration from onboarding to launch.</p></div><div className="tools"><div className="search"><Search/><input placeholder="Search merchants" value={search} onChange={event=>setSearch(event.target.value)}/></div><select value={picFilter} onChange={event=>setPicFilter(event.target.value)}><option value="ALL">All PICs</option>{members.map(member=><option key={member.id} value={member.email}>{member.name}</option>)}</select><select value={filter} onChange={event=>setFilter(event.target.value)}><option value="ALL">All statuses</option>{Object.keys(labels).map(value=><option key={value} value={value}>{labels[value]}</option>)}</select><button className="export-button" onClick={exportMerchants} disabled={!visible.length}><Download/>Export ({visible.length})</button></div></div>
      <table className="merchant-table"><thead><tr><th>Merchant</th><th>Status</th><th>PIC</th><th>Payment methods</th><th>Progress</th><th>Last update</th><th>Target live</th><th></th></tr></thead><tbody>{visible.map(merchant=><tr key={merchant.id} className={days(merchant.statusUpdatedAt)>=7?'stale':''}><td><div className="merchant-logo">{merchant.name.slice(0,2).toUpperCase()}</div><div><b>{merchant.name}</b><small>{merchant.code}</small></div></td><td><span className={`status ${merchant.status.toLowerCase()}`}>{labels[merchant.status]}</span></td><td><b>{merchant.picName}</b><small>{merchant.picEmail}</small></td><td><div className="method-chips">{merchant.paymentMethods?.length?merchant.paymentMethods.map(method=><span key={method} title={merchant.paymentMethodStatuses?.[method]}>{method}</span>):'—'}</div></td><td><div className="progress"><i style={{width:`${merchant.progress}%`}}/></div><b>{merchant.progress}%</b></td><td><span>{days(merchant.statusUpdatedAt)===0?'Today':`${days(merchant.statusUpdatedAt)} days ago`}</span>{days(merchant.statusUpdatedAt)>=7&&<small className="danger">Update overdue</small>}</td><td>{merchant.targetLiveDate?new Date(merchant.targetLiveDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td><td><button onClick={()=>setSelected(merchant)}>Update <ChevronRight/></button></td></tr>)}</tbody></table>
      {!visible.length&&<div className="empty">No merchants match your filters.</div>}
    </section>
  </main>:page==='cases'?<CasesPage merchants={merchants} members={members}/>:<AccountPage user={user} onUserCreated={load}/>} {modal&&<NewMerchant close={()=>setModal(false)} saved={load} members={members}/>} {selected&&<Update merchant={selected} members={members} close={()=>setSelected(null)} save={update}/>}</div>;
}
