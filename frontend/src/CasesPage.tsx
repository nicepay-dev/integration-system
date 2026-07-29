import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, ChevronRight, ClipboardCheck, Download, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from './api';
import { downloadCsv } from './exportCsv';

type Merchant={id:string;name:string;code:string};
type Member={id:string;name:string;email:string;role:string};
type CaseItem={id:string;merchant:Merchant;issue:string;category:string;response?:string;updateNote?:string;pic:Member;acrTicket?:string;status:string;createdBy:string;createdAt:string;updatedAt:string};
const statuses:Record<string,string>={CHECKING:'Checking',WAITING_PARTNER:'Waiting from partner',WAITING_MERCHANT:'Waiting from merchant',SOLVED:'Solved'};
const categories:Record<string,string>={PAYMENT:'Payment',INTEGRATION_API:'Integration / API',SETTLEMENT_RECONCILIATION:'Settlement / Reconciliation',DASHBOARD_ACCESS:'Dashboard / Access',CONFIGURATION:'Configuration',OTHER:'Other'};

function CaseModal({merchants,members,existing,close,saved}:{merchants:Merchant[];members:Member[];existing?:CaseItem|null;close:()=>void;saved:()=>void}) {
  const [merchantQuery,setMerchantQuery]=useState(existing?.merchant.name||'');
  const [form,setForm]=useState({merchantId:existing?.merchant.id||'',issue:existing?.issue||'',category:existing?.category||'PAYMENT',response:existing?.response||'',updateNote:existing?.updateNote||'',picUserId:existing?.pic.id||members[0]?.id||'',acrTicket:existing?.acrTicket||'',status:existing?.status||'CHECKING'});
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const filtered=useMemo(()=>merchants.filter(item=>`${item.name} ${item.code}`.toLowerCase().includes(merchantQuery.toLowerCase())).slice(0,80),[merchants,merchantQuery]);
  const set=(key:string,value:string)=>setForm({...form,[key]:value});
  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError('');
    try{
      if(existing) await api(`/cases/${existing.id}`,{method:'PATCH',body:JSON.stringify({response:form.response,checkResult:form.updateNote,picUserId:form.picUserId,acrTicket:form.acrTicket,status:form.status})});
      else await api('/cases',{method:'POST',body:JSON.stringify({...form,checkResult:form.updateNote,updateNote:undefined})});
      saved();close();
    }catch(error){setError((error as Error).message);setBusy(false);}
  }
  return <div className="overlay"><form className="modal case-modal" onSubmit={submit}>
    <button className="icon close" type="button" onClick={close}><X/></button><p className="eyebrow">{existing?'UPDATE CASE':'NEW CASE'}</p><h2>{existing?existing.merchant.name:'Record merchant issue'}</h2>
    {!existing&&<><label>Find merchant<input placeholder="Type merchant name or code" value={merchantQuery} onChange={event=>setMerchantQuery(event.target.value)}/></label><label>Merchant<select required value={form.merchantId} onChange={event=>set('merchantId',event.target.value)}><option value="">Select merchant</option>{filtered.map(merchant=><option key={merchant.id} value={merchant.id}>{merchant.name} — {merchant.code}</option>)}</select></label><label>Issue<textarea required rows={4} value={form.issue} onChange={event=>set('issue',event.target.value)} placeholder="Describe what happened and the impact"/></label><fieldset><legend>Issue category</legend><div className="category-radios">{Object.entries(categories).map(([value,label])=><label key={value}><input type="radio" name="category" value={value} checked={form.category===value} onChange={()=>set('category',value)}/><span>{label}</span></label>)}</div></fieldset></>}
    {existing&&<div className="issue-summary"><b>{categories[existing.category]}</b><p>{existing.issue}</p></div>}
    <label>Check result<textarea rows={3} value={form.updateNote} onChange={event=>set('updateNote',event.target.value)} placeholder="Result of the latest investigation or checking"/></label>
    <label>Response<textarea rows={4} value={form.response} onChange={event=>set('response',event.target.value)} placeholder="Latest response or action taken"/></label>
    <label>PIC<select required value={form.picUserId} onChange={event=>set('picUserId',event.target.value)}>{members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
    <div className="grid2"><label>ACR ticket (optional)<input value={form.acrTicket} onChange={event=>set('acrTicket',event.target.value)} placeholder="e.g. ACR-12345"/></label><label>Status<select value={form.status} onChange={event=>set('status',event.target.value)}>{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
    {error&&<p className="error">{error}</p>}<div className="actions"><button type="button" onClick={close}>Cancel</button><button className="primary" disabled={busy||(!existing&&!form.merchantId)}>{existing?'Save changes':'Create case'}</button></div>
  </form></div>;
}

export default function CasesPage({merchants,members}:{merchants:Merchant[];members:Member[]}) {
  const [cases,setCases]=useState<CaseItem[]>([]);
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('ALL');
  const [merchantId,setMerchantId]=useState('ALL');
  const [merchantFilter,setMerchantFilter]=useState('');
  const [dateFrom,setDateFrom]=useState('');
  const [dateTo,setDateTo]=useState('');
  const [creating,setCreating]=useState(false);
  const [editing,setEditing]=useState<CaseItem|null>(null);
  const [notifications,setNotifications]=useState<any[]>([]);
  const [bell,setBell]=useState(false);
  const filteredMerchants=merchants.filter(item=>`${item.name} ${item.code}`.toLowerCase().includes(merchantFilter.toLowerCase())).slice(0,80);
  async function load(){
    const params=new URLSearchParams();
    if(status!=='ALL')params.set('status',status);
    if(merchantId!=='ALL')params.set('merchantId',merchantId);
    if(search)params.set('search',search);
    if(dateFrom)params.set('dateFrom',dateFrom);
    if(dateTo)params.set('dateTo',dateTo);
    const [caseData,notificationData]=await Promise.all([api(`/cases?${params}`),api('/notifications')]);
    setCases(caseData);
    setNotifications(notificationData.filter((item:any)=>item.caseRecord));
  }
  useEffect(()=>{load()},[status,merchantId]);
  const open=cases.filter(item=>item.status!=='SOLVED').length;
  const overdue=cases.filter(item=>item.status!=='SOLVED'&&Date.now()-new Date(item.updatedAt).getTime()>=2*86400000).length;
  function exportCases(){
    downloadCsv('case-report',['Merchant name','Merchant code','Issue','Category','Check result','Response','PIC','PIC email','ACR ticket','Status','Created by','Created at','Last updated'],cases.map(item=>[
      item.merchant.name,item.merchant.code,item.issue,categories[item.category]||item.category,item.updateNote||'',item.response||'',
      item.pic.name,item.pic.email,item.acrTicket||'',statuses[item.status]||item.status,item.createdBy,
      new Date(item.createdAt).toLocaleString('en-GB'),new Date(item.updatedAt).toLocaleString('en-GB')
    ]));
  }
  async function deleteCase(item:CaseItem){
    if(!window.confirm(`Delete the case for ${item.merchant.name}?`))return;
    await api(`/cases/${item.id}`,{method:'DELETE'});
    await load();
  }
  return <main className="content cases-page">
    <header><div><p className="eyebrow">ISSUE OPERATIONS</p><h1>Case checking</h1><p className="muted">Track merchant issues, ownership, responses, and resolution.</p></div><div className="header-actions"><button aria-label="Case notifications" className="bell icon" onClick={()=>setBell(!bell)}><Bell/><em>{notifications.filter(item=>!item.isRead).length}</em></button><button className="primary" onClick={()=>setCreating(true)}><Plus/>Add case</button></div>{bell&&<div className="notification-pop"><h3>Case notifications</h3>{notifications.length?notifications.slice(0,8).map(item=><div className={item.isRead?'':'unread'} key={item.id}><AlertTriangle/><span>{item.message}<small>{new Date(item.createdAt).toLocaleDateString()}</small></span></div>):<p className="muted">No overdue case notifications.</p>}</div>}</header>
    {overdue>0&&<section className="attention"><div className="attention-icon"><AlertTriangle/></div><div><b>{overdue} cases need an update</b><p>These cases have been open without an update for two days or more.</p></div></section>}
    <section className="stats case-stats"><article><span>Total cases</span><b>{cases.length}</b><small>Current filtered view</small></article><article><span>Open cases</span><b>{open}</b><small>Still needs follow-up</small></article><article><span>Solved</span><b>{cases.filter(item=>item.status==='SOLVED').length}</b><small>Resolved cases</small></article></section>
    <section className="table-card">
      <div className="table-head case-filters"><div><h2>Issue register</h2><p className="muted">Filter by merchant, status, or last-updated date.</p></div><div className="tools"><div className="search"><Search/><input placeholder="Search issue or ACR" value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>event.key==='Enter'&&load()}/></div><div className="merchant-filter"><input placeholder="Filter merchant list" value={merchantFilter} onChange={event=>setMerchantFilter(event.target.value)}/><select value={merchantId} onChange={event=>setMerchantId(event.target.value)}><option value="ALL">All merchants</option>{filteredMerchants.map(merchant=><option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}</select></div><select value={status} onChange={event=>setStatus(event.target.value)}><option value="ALL">All statuses</option>{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><label className="date-filter">From<input type="date" value={dateFrom} max={dateTo||undefined} onChange={event=>setDateFrom(event.target.value)}/></label><label className="date-filter">To<input type="date" value={dateTo} min={dateFrom||undefined} onChange={event=>setDateTo(event.target.value)}/></label><button className="filter-button" onClick={load}>Apply</button><button className="export-button" onClick={exportCases} disabled={!cases.length}><Download/>Export ({cases.length})</button></div></div>
      <table className="case-table">
        <thead><tr><th>Merchant name</th><th>Category</th><th>Check result</th><th>Response</th><th>PIC</th><th>Created date</th><th>Updated date</th><th>Status</th><th></th></tr></thead>
        <tbody>{cases.map(item=><tr key={item.id}>
          <td><b>{item.merchant.name}</b></td>
          <td>{categories[item.category]}</td>
          <td><span className="case-update">{item.updateNote||'No check result yet'}</span></td>
          <td><span className="case-response">{item.response||'No response yet'}</span></td>
          <td>{item.pic.name}</td>
          <td>{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
          <td>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</td>
          <td><span className={`case-status ${item.status.toLowerCase()}`}>{statuses[item.status]}</span></td>
          <td><div className="row-actions"><button onClick={()=>setEditing(item)}>Update <ChevronRight/></button><button className="delete-action" title="Delete case" onClick={()=>deleteCase(item)}><Trash2/></button></div></td>
        </tr>)}</tbody>
      </table>
      {!cases.length&&<div className="empty"><ClipboardCheck/><p>No cases match the current filters.</p></div>}
    </section>
    {creating&&<CaseModal merchants={merchants} members={members} close={()=>setCreating(false)} saved={load}/>}
    {editing&&<CaseModal merchants={merchants} members={members} existing={editing} close={()=>setEditing(null)} saved={load}/>}
  </main>;
}
