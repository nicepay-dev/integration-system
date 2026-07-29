type Props={merchants:any[];cases:any[];notifications:any[]};
const merchantLabels:Record<string,string>={ONBOARDING:'Onboarding',INTEGRATION:'Integration',UAT:'UAT','READY LIVE':'Ready Live',LIVE:'Live',BLOCKED:'Blocked',CANCEL:'Cancel'};
const caseLabels:Record<string,string>={CHECKING:'Checking',WAITING_PARTNER:'Waiting partner',WAITING_MERCHANT:'Waiting merchant',SOLVED:'Solved'};

function Bars({items,labels,color}:{items:any[];labels:Record<string,string>;color:string}) {
  const counts=Object.keys(labels).map(key=>({key,label:labels[key],value:items.filter(item=>item.status===key).length}));
  const max=Math.max(1,...counts.map(item=>item.value));
  return <div className="chart-bars">{counts.map(item=><div className="chart-row" key={item.key}><span>{item.label}</span><div><i style={{width:`${(item.value/max)*100}%`,background:color}}/></div><b>{item.value}</b></div>)}</div>;
}

export default function HomeCharts({merchants,cases,notifications}:Props) {
  const merchantNotifications=notifications.filter(item=>item.merchant).length;
  const caseNotifications=notifications.filter(item=>item.caseRecord).length;
  const meetingNotifications=notifications.filter(item=>item.staleKey?.startsWith('meeting:')).length;
  const totalNotifications=merchantNotifications+caseNotifications+meetingNotifications;
  const total=Math.max(1,totalNotifications);
  const merchantEnd=(merchantNotifications/total)*100;
  const caseEnd=merchantEnd+(caseNotifications/total)*100;
  return <section className="dashboard-graphics">
    <article className="chart-card"><div className="chart-heading"><div><p className="eyebrow">MERCHANTS</p><h2>Status distribution</h2></div><strong>{merchants.length}</strong></div><Bars items={merchants} labels={merchantLabels} color="#4f8c7d"/></article>
    <article className="chart-card"><div className="chart-heading"><div><p className="eyebrow">CASES</p><h2>Resolution pipeline</h2></div><strong>{cases.length}</strong></div><Bars items={cases} labels={caseLabels} color="#7b6ba8"/></article>
    <article className="chart-card notification-chart"><div className="chart-heading"><div><p className="eyebrow">NOTIFICATIONS</p><h2>Attention split</h2></div><strong>{notifications.filter(item=>!item.isRead).length}</strong></div><div className="notification-donut" style={{background:`conic-gradient(#d97852 0 ${merchantEnd}%,#7b6ba8 ${merchantEnd}% ${caseEnd}%,#4299c6 ${caseEnd}% 100%)`}}><div><b>{totalNotifications}</b><span>Total</span></div></div><div className="chart-legend"><span><i className="merchant-dot"/>Merchant <b>{merchantNotifications}</b></span><span><i className="case-dot"/>Case <b>{caseNotifications}</b></span><span><i className="meeting-dot"/>Meeting <b>{meetingNotifications}</b></span></div></article>
  </section>;
}
