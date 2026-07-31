import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarClock, CircleAlert, Store } from 'lucide-react';
import { api } from './api';

type Member={id:string;name:string;email:string;role:string};
type Merchant={id:string;picEmail:string|null;status:string};
type CaseItem={id:string;status:string;updatedAt:string;pic?:{id:string;email?:string}};
type Meeting={id:string;meetingDate:string;pic?:{id:string;email?:string}};

export default function TeamWorkload({members,merchants,cases}:{members:Member[];merchants:Merchant[];cases:CaseItem[]}){
  const [meetings,setMeetings]=useState<Meeting[]>([]);
  const [error,setError]=useState('');
  useEffect(()=>{api('/meetings').then(setMeetings).catch(value=>setError((value as Error).message));},[]);
  const rows=useMemo(()=>{
    const now=Date.now();
    return members.filter(member=>!/\b(lead|head)\b/i.test(member.role||'')).map(member=>{
      const ownsMerchant=(merchant:Merchant)=>merchant.picEmail?.toLowerCase()===member.email.toLowerCase();
      const ownsItem=(item:{pic?:{id:string;email?:string}})=>item.pic?.id===member.id||item.pic?.email?.toLowerCase()===member.email.toLowerCase();
      const activeMerchants=merchants.filter(merchant=>ownsMerchant(merchant)&&!['LIVE','CANCEL'].includes(merchant.status)).length;
      const memberCases=cases.filter(item=>ownsItem(item)&&item.status!=='SOLVED');
      const solvedCases=cases.filter(item=>ownsItem(item)&&item.status==='SOLVED').length;
      const overdueCases=memberCases.filter(item=>now-new Date(item.updatedAt).getTime()>=2*86400000).length;
      const upcomingMeetings=meetings.filter(item=>ownsItem(item)&&new Date(item.meetingDate).getTime()>now).length;
      return{...member,activeMerchants,pendingCases:memberCases.length,solvedCases,overdueCases,upcomingMeetings,total:activeMerchants+memberCases.length+upcomingMeetings};
    }).sort((a,b)=>b.overdueCases-a.overdueCases||b.total-a.total||a.name.localeCompare(b.name));
  },[members,merchants,cases,meetings]);

  return <section className="team-workload">
    <div className="team-workload-heading"><div><p className="eyebrow">LEADERSHIP VIEW</p><h2>Team workload</h2><p className="muted">Current ownership and follow-up demand for every PIC.</p></div><span>Lead &amp; Head only</span></div>
    {error&&<p className="error">{error}</p>}
    <div className="table-scroll"><table><thead><tr><th>Team member</th><th><Store/>Active merchants</th><th><BriefcaseBusiness/>Pending cases</th><th><BriefcaseBusiness/>Solved cases</th><th><CircleAlert/>Overdue cases</th><th><CalendarClock/>Upcoming meetings</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.id}><td><b>{row.name}</b><small>{row.role}</small></td><td>{row.activeMerchants}</td><td>{row.pendingCases}</td><td>{row.solvedCases}</td><td><strong className={row.overdueCases?'workload-overdue':''}>{row.overdueCases}</strong></td><td>{row.upcomingMeetings}</td></tr>)}</tbody>
    </table></div>
  </section>;
}
