type Props={merchants:any[];cases:any[];notifications:any[]};
const merchantLabels:Record<string,string>={ONBOARDING:'Onboarding',INTEGRATION:'Integration',UAT:'UAT','READY LIVE':'Ready Live',LIVE:'Live',BLOCKED:'Blocked',CANCEL:'Cancel'};
const caseLabels:Record<string,string>={CHECKING:'Checking',WAITING_PARTNER:'Waiting partner',WAITING_MERCHANT:'Waiting merchant',SOLVED:'Solved'};
const categoryLabels:Record<string,string>={PAYMENT:'Payment',INTEGRATION_API:'Integration / API',SETTLEMENT_RECONCILIATION:'Settlement / Reconciliation',DASHBOARD_ACCESS:'Dashboard / Access',CONFIGURATION:'Configuration',OTHER:'Other'};
const paymentMethodLabels:Record<string,string>={CREDIT_CARD:'Credit Card',VA:'VA',CVS:'CVS',DIRECT_DEBIT:'Direct Debit',EWALLET:'eWallet',PAYLOAN:'Payloan',PAYOUT:'Payout',QRIS:'QRIS'};
const paymentAreaLabels:Record<string,string>={REGISTER:'Register',CHECK_STATUS:'Check status',THREE_DS:'3DS',PAYMENT:'Payment',REFUND:'Refund',FDS:'FDS',CREDENTIAL:'Credential',ACCOUNT_BINDING:'Account binding',APPROVE:'Approve',DANA_TRANSFER:'Dana transfer',BALANCE:'Balance'};

function Bars({items,labels,color}:{items:any[];labels:Record<string,string>;color:string}) {
  const counts=Object.keys(labels).map(key=>({key,label:labels[key],value:items.filter(item=>item.status===key).length}));
  const max=Math.max(1,...counts.map(item=>item.value));
  return <div className="chart-bars">{counts.map(item=><div className="chart-row" key={item.key}><span>{item.label}</span><div><i style={{width:`${(item.value/max)*100}%`,background:color}}/></div><b>{item.value}</b></div>)}</div>;
}

function rank(items:any[],key:(item:any)=>string|undefined,label:(key:string)=>string) {
  const counts=new Map<string,number>();
  items.forEach(item=>{const value=key(item);if(value)counts.set(value,(counts.get(value)||0)+1)});
  return [...counts].map(([value,count])=>({value,label:label(value),count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
}

function AnalysisList({items,empty='No classified cases yet.'}:{items:{value:string;label:string;count:number}[];empty?:string}) {
  const max=Math.max(1,...items.map(item=>item.count));
  if(!items.length)return <p className="analysis-empty">{empty}</p>;
  return <div className="analysis-list">{items.map((item,index)=><div className="analysis-row" key={item.value}><div><span>{item.label}</span>{index===0&&<em>Most issues</em>}<b>{item.count}</b></div><i><span style={{width:`${item.count/max*100}%`}}/></i></div>)}</div>;
}

export default function HomeCharts({merchants,cases,notifications}:Props) {
  const merchantNotifications=notifications.filter(item=>item.merchant).length;
  const caseNotifications=notifications.filter(item=>item.caseRecord).length;
  const meetingNotifications=notifications.filter(item=>item.staleKey?.startsWith('meeting:')).length;
  const totalNotifications=merchantNotifications+caseNotifications+meetingNotifications;
  const total=Math.max(1,totalNotifications);
  const merchantEnd=(merchantNotifications/total)*100;
  const caseEnd=merchantEnd+(caseNotifications/total)*100;
  const categoryRanking=rank(cases,item=>item.category,key=>categoryLabels[key]||key);
  const paymentCases=cases.filter(item=>item.category==='PAYMENT');
  const methodRanking=rank(paymentCases,item=>item.paymentMethod,key=>paymentMethodLabels[key]||key);
  const areaRanking=rank(paymentCases,item=>item.paymentMethod&&item.paymentArea?`${item.paymentMethod}:${item.paymentArea}`:undefined,key=>{const [method,area]=key.split(':');return `${paymentMethodLabels[method]||method} · ${paymentAreaLabels[area]||area}`});
  const classifiedPaymentCases=paymentCases.filter(item=>item.paymentMethod&&item.paymentArea).length;
  return <>
  <section className="dashboard-graphics">
    <article className="chart-card"><div className="chart-heading"><div><p className="eyebrow">MERCHANTS</p><h2>Status distribution</h2></div><strong>{merchants.length}</strong></div><Bars items={merchants} labels={merchantLabels} color="#4f8c7d"/></article>
    <article className="chart-card"><div className="chart-heading"><div><p className="eyebrow">CASES</p><h2>Resolution pipeline</h2></div><strong>{cases.length}</strong></div><Bars items={cases} labels={caseLabels} color="#7b6ba8"/></article>
    <article className="chart-card notification-chart"><div className="chart-heading"><div><p className="eyebrow">NOTIFICATIONS</p><h2>Attention split</h2></div><strong>{notifications.filter(item=>!item.isRead).length}</strong></div><div className="notification-donut" style={{background:`conic-gradient(#d97852 0 ${merchantEnd}%,#7b6ba8 ${merchantEnd}% ${caseEnd}%,#4299c6 ${caseEnd}% 100%)`}}><div><b>{totalNotifications}</b><span>Total</span></div></div><div className="chart-legend"><span><i className="merchant-dot"/>Merchant <b>{merchantNotifications}</b></span><span><i className="case-dot"/>Case <b>{caseNotifications}</b></span><span><i className="meeting-dot"/>Meeting <b>{meetingNotifications}</b></span></div></article>
  </section>
  <section className="case-analysis">
    <div className="case-analysis-heading"><div><p className="eyebrow">CASE ANALYSIS</p><h2>Where issues happen most</h2><p>Ranking based on all recorded cases. Payment areas combine the payment method and its specific issue area.</p></div><strong>{cases.length}<small>Total cases</small></strong></div>
    <div className="analysis-grid">
      <article><header><div><span>By category</span><small>All issue categories</small></div><b>{categoryRanking[0]?.label||'—'}</b></header><AnalysisList items={categoryRanking}/></article>
      <article><header><div><span>By payment method</span><small>Payment cases only</small></div><b>{methodRanking[0]?.label||'—'}</b></header><AnalysisList items={methodRanking}/></article>
      <article><header><div><span>By specific area</span><small>{classifiedPaymentCases} of {paymentCases.length} payment cases classified</small></div><b>{areaRanking[0]?.label||'—'}</b></header><AnalysisList items={areaRanking}/></article>
    </div>
  </section>
  </>;
}
