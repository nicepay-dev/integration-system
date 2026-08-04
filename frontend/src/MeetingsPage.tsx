import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from './api';
import { downloadCsv } from './exportCsv';
import Pagination from './Pagination';

type Merchant={id:string;name:string;code:string};
type Member={id:string;name:string;email:string;role:string};
type Meeting={id:string;merchant:Merchant|null;merchantName?:string;meetingDate:string;pic:Member;meetingType:string;attendees?:string;location?:string;agenda?:string;mom:string;actionItems?:string;nextFollowUpDate?:string;createdBy:string;createdAt:string;updatedAt:string};
const meetingTypes:Record<string,string>={KICKOFF:'Kickoff',TECHNICAL_DISCUSSION:'Technical discussion',UAT:'UAT',GO_LIVE:'Go live',FOLLOW_UP:'Follow-up',OTHER:'Other'};
const localDateTime=(value?:string)=>{
  if(!value)return'';
  const date=new Date(value);
  date.setMinutes(date.getMinutes()-date.getTimezoneOffset());
  return date.toISOString().slice(0,16);
};

function MeetingModal({merchants,members,existing,close,saved}:{merchants:Merchant[];members:Member[];existing?:Meeting|null;close:()=>void;saved:()=>void}){
  const [merchantMode,setMerchantMode]=useState<'existing'|'other'>(existing&&!existing.merchant?'other':'existing');
  const [merchantQuery,setMerchantQuery]=useState(existing?.merchant?.name||'');
  const [form,setForm]=useState({
    merchantId:existing?.merchant?.id||'',merchantName:existing?.merchantName||'',meetingDate:localDateTime(existing?.meetingDate),
    picUserId:existing?.pic.id||members[0]?.id||'',meetingType:existing?.meetingType||'TECHNICAL_DISCUSSION',
    attendees:existing?.attendees||'',location:existing?.location||'',agenda:existing?.agenda||'',
    mom:existing?.mom||'',actionItems:existing?.actionItems||'',nextFollowUpDate:existing?.nextFollowUpDate?.slice(0,10)||'',
  });
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const filtered=useMemo(()=>merchants.filter(item=>`${item.name} ${item.code}`.toLowerCase().includes(merchantQuery.toLowerCase())).slice(0,100),[merchants,merchantQuery]);
  const set=(key:string,value:string)=>setForm({...form,[key]:value});
  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError('');
    try{
      const payload={
        ...form,
        merchantId:merchantMode==='existing'?form.merchantId:null,
        merchantName:merchantMode==='other'?form.merchantName:'',
        meetingDate:new Date(form.meetingDate).toISOString(),
      };
      await api(existing?`/meetings/${existing.id}`:'/meetings',{method:existing?'PATCH':'POST',body:JSON.stringify(payload)});
      await saved();close();
    }catch(error){setError((error as Error).message);setBusy(false);}
  }
  return <div className="overlay"><form className="modal meeting-modal" onSubmit={submit}>
    <button className="icon close" type="button" onClick={close}><X/></button>
    <p className="eyebrow">{existing?'EDIT MEETING':'NEW MEETING'}</p><h2>{existing?'Update meeting record':'Record a meeting'}</h2>
    <fieldset><legend>Meeting organization</legend><div className="meeting-merchant-options">
      <label><input type="radio" name="merchantMode" checked={merchantMode==='existing'} onChange={()=>setMerchantMode('existing')}/><span>Existing merchant</span></label>
      <label><input type="radio" name="merchantMode" checked={merchantMode==='other'} onChange={()=>setMerchantMode('other')}/><span>Other merchant / organization</span></label>
    </div></fieldset>
    {merchantMode==='existing'?<><label>Find merchant<input value={merchantQuery} onChange={event=>setMerchantQuery(event.target.value)} placeholder="Type merchant name or MID"/></label>
    <label>Merchant<select required value={form.merchantId} onChange={event=>set('merchantId',event.target.value)}><option value="">Select merchant</option>{filtered.map(merchant=><option key={merchant.id} value={merchant.id}>{merchant.name} — {merchant.code}</option>)}</select></label></>
    :<label>Merchant / organization name<input required value={form.merchantName} onChange={event=>set('merchantName',event.target.value)} placeholder="Enter the meeting counterpart"/></label>}
    <div className="grid2"><label>Meeting date and time<input required type="datetime-local" value={form.meetingDate} onChange={event=>set('meetingDate',event.target.value)}/></label><label>Meeting type<select value={form.meetingType} onChange={event=>set('meetingType',event.target.value)}>{Object.entries(meetingTypes).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label></div>
    <label>PIC<select required value={form.picUserId} onChange={event=>set('picUserId',event.target.value)}>{members.map(member=><option key={member.id} value={member.id}>{member.name} — {member.role}</option>)}</select></label>
    <div className="grid2"><label>Attendees<input value={form.attendees} onChange={event=>set('attendees',event.target.value)} placeholder="Names or teams"/></label><label>Location / meeting link<input value={form.location} onChange={event=>set('location',event.target.value)} placeholder="Room or URL"/></label></div>
    <label>Agenda<textarea rows={3} value={form.agenda} onChange={event=>set('agenda',event.target.value)} placeholder="Topics planned for discussion"/></label>
    <label>MOM (complete after the meeting)<textarea rows={5} value={form.mom} onChange={event=>set('mom',event.target.value)} placeholder="Optional for planned meetings; add decisions and discussion notes afterward"/></label>
    <label>Action items<textarea rows={4} value={form.actionItems} onChange={event=>set('actionItems',event.target.value)} placeholder="Owner, action, and due date"/></label>
    <label>Next follow-up date<input type="date" value={form.nextFollowUpDate} onChange={event=>set('nextFollowUpDate',event.target.value)}/></label>
    {error&&<p className="error">{error}</p>}<div className="actions"><button type="button" onClick={close}>Cancel</button><button className="primary" disabled={busy||!form.meetingDate||(merchantMode==='existing'?!form.merchantId:!form.merchantName.trim())}>{existing?'Save changes':'Create meeting'}</button></div>
  </form></div>;
}

export default function MeetingsPage({merchants,members}:{merchants:Merchant[];members:Member[]}){
  const [meetings,setMeetings]=useState<Meeting[]>([]);
  const [activeTab,setActiveTab]=useState<'future'|'completed'>('future');
  const [search,setSearch]=useState('');
  const [merchantId,setMerchantId]=useState('ALL');
  const [picUserId,setPicUserId]=useState('ALL');
  const [dateFrom,setDateFrom]=useState('');
  const [dateTo,setDateTo]=useState('');
  const [creating,setCreating]=useState(false);
  const [editing,setEditing]=useState<Meeting|null>(null);
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(20);
  async function load(){
    const params=new URLSearchParams();
    if(search)params.set('search',search);
    if(merchantId!=='ALL')params.set('merchantId',merchantId);
    if(picUserId!=='ALL')params.set('picUserId',picUserId);
    if(dateFrom)params.set('dateFrom',dateFrom);
    if(dateTo)params.set('dateTo',dateTo);
    setMeetings(await api(`/meetings?${params}`));
    setPage(1);
  }
  async function clearFilters(){
    setSearch('');setMerchantId('ALL');setPicUserId('ALL');setDateFrom('');setDateTo('');
    setMeetings(await api('/meetings'));
  }
  useEffect(()=>{load()},[]);
  async function remove(meeting:Meeting){
    if(!window.confirm(`Delete the ${meetingTypes[meeting.meetingType]} meeting for ${meeting.merchant?.name||meeting.merchantName}?`))return;
    await api(`/meetings/${meeting.id}`,{method:'DELETE'});await load();
  }
  const now=Date.now();
  const futureMeetings=meetings
    .filter(item=>new Date(item.meetingDate).getTime()>=now)
    .sort((first,second)=>new Date(first.meetingDate).getTime()-new Date(second.meetingDate).getTime());
  const completedMeetings=meetings
    .filter(item=>new Date(item.meetingDate).getTime()<now)
    .sort((first,second)=>new Date(second.meetingDate).getTime()-new Date(first.meetingDate).getTime());
  const visibleMeetings=activeTab==='future'?futureMeetings:completedMeetings;
  const pageCount=Math.max(1,Math.ceil(visibleMeetings.length/pageSize));
  const safePage=Math.min(page,pageCount);
  const pagedMeetings=visibleMeetings.slice((safePage-1)*pageSize,safePage*pageSize);
  function exportMeetings(){
    downloadCsv(`${activeTab}-meeting-report`,['Merchant','MIDs','Meeting date','Type','PIC','PIC email','Attendees','Location / link','Agenda','MOM','Action items','Next follow-up','Created by','Created at','Updated at'],visibleMeetings.map(item=>[
      item.merchant?.name||item.merchantName||'',item.merchant?.code||'',new Date(item.meetingDate).toLocaleString('en-GB'),meetingTypes[item.meetingType]||item.meetingType,
      item.pic.name,item.pic.email,item.attendees||'',item.location||'',item.agenda||'',item.mom,item.actionItems||'',item.nextFollowUpDate||'',
      item.createdBy,new Date(item.createdAt).toLocaleString('en-GB'),new Date(item.updatedAt).toLocaleString('en-GB'),
    ]));
  }
  return <main className="content meetings-page">
    <header><div><p className="eyebrow">MERCHANT COLLABORATION</p><h1>Meetings</h1><p className="muted">Keep meeting notes, decisions, action items, and follow-ups in one place.</p></div><button className="primary" onClick={()=>setCreating(true)}><Plus/>Add meeting</button></header>
    <section className="stats meeting-stats"><article><span>Future meetings</span><b>{futureMeetings.length}</b><small>Scheduled from now onward</small></article><article><span>Completed meetings</span><b>{completedMeetings.length}</b><small>Meeting time has passed</small></article><article><span>Organizations represented</span><b>{new Set(meetings.map(item=>item.merchant?.id||`other:${item.merchantName}`)).size}</b><small>Across this filtered view</small></article></section>
    <section className="table-card">
      <div className="meeting-tabs" role="tablist" aria-label="Meeting schedule"><button role="tab" aria-selected={activeTab==='future'} className={activeTab==='future'?'active':''} onClick={()=>{setActiveTab('future');setPage(1)}}>Future meetings <span>{futureMeetings.length}</span></button><button role="tab" aria-selected={activeTab==='completed'} className={activeTab==='completed'?'active':''} onClick={()=>{setActiveTab('completed');setPage(1)}}>Completed meetings <span>{completedMeetings.length}</span></button></div>
      <div className="table-head meeting-filters"><div className="meeting-filter-heading"><div><h2>{activeTab==='future'?'Future meeting schedule':'Completed meeting history'}</h2><p className="muted">Filter meetings using one or more fields below.</p></div><button className="export-button" disabled={!visibleMeetings.length} onClick={exportMeetings}><Download/>Export ({visibleMeetings.length})</button></div><div className="meeting-filter-grid">
        <label><span>Search meeting</span><div className="meeting-search"><Search/><input value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>event.key==='Enter'&&load()} placeholder="Merchant, MOM, or agenda"/></div></label>
        <label><span>Merchant / organization</span><select value={merchantId} onChange={event=>setMerchantId(event.target.value)}><option value="ALL">All merchants / organizations</option><option value="EXTERNAL">Other organizations only</option>{merchants.map(merchant=><option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}</select></label>
        <label><span>PIC</span><select value={picUserId} onChange={event=>setPicUserId(event.target.value)}><option value="ALL">All PICs</option>{members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
        <label><span>Meeting date from</span><input type="date" value={dateFrom} max={dateTo||undefined} onChange={event=>setDateFrom(event.target.value)}/></label>
        <label><span>Meeting date to</span><input type="date" value={dateTo} min={dateFrom||undefined} onChange={event=>setDateTo(event.target.value)}/></label>
        <div className="meeting-filter-actions"><button className="clear-filter-button" type="button" onClick={clearFilters}>Clear</button><button className="filter-button" type="button" onClick={load}>Apply filters</button></div>
      </div></div>
      <div className="table-scroll"><table className="meeting-table responsive-table"><thead><tr><th>Merchant</th><th>Date</th><th>Type</th><th>PIC</th><th>MOM</th><th>Action items</th><th>Next follow-up</th><th>Actions</th></tr></thead><tbody>{pagedMeetings.map(item=><tr key={item.id}>
        <td data-label="Merchant"><b>{item.merchant?.name||item.merchantName}</b><small>{item.merchant?.code||'Other organization'}</small></td><td data-label="Date">{new Date(item.meetingDate).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}</td><td data-label="Type">{meetingTypes[item.meetingType]||item.meetingType}</td><td data-label="PIC"><b>{item.pic.name}</b><small>{item.pic.email}</small></td><td data-label="MOM"><span className="meeting-text">{item.mom}</span></td><td data-label="Action items"><span className="meeting-text">{item.actionItems||'—'}</span></td><td data-label="Next follow-up">{item.nextFollowUpDate?new Date(`${item.nextFollowUpDate}T00:00:00`).toLocaleDateString('en-GB'):'—'}</td><td data-label="Actions"><div className="row-actions"><button onClick={()=>setEditing(item)}><Pencil/>Edit</button><button className="delete-action" onClick={()=>remove(item)}><Trash2/></button></div></td>
      </tr>)}</tbody></table></div>
      {!!visibleMeetings.length&&<Pagination total={visibleMeetings.length} page={safePage} pageSize={pageSize} onPage={setPage} onPageSize={size=>{setPageSize(size);setPage(1)}}/>}
      {!visibleMeetings.length&&<div className="empty"><CalendarDays/><p>No {activeTab} meetings match the current filters.</p></div>}
    </section>
    {creating&&<MeetingModal merchants={merchants} members={members} close={()=>setCreating(false)} saved={load}/>}
    {editing&&<MeetingModal merchants={merchants} members={members} existing={editing} close={()=>setEditing(null)} saved={load}/>}
  </main>;
}
