import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({total,page,pageSize,onPage,onPageSize}:{total:number;page:number;pageSize:number;onPage:(page:number)=>void;onPageSize:(size:number)=>void}){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  const current=Math.min(page,pages);
  const start=total?(current-1)*pageSize+1:0;
  const end=Math.min(current*pageSize,total);
  return <div className="pagination"><div className="pagination-size"><span>Rows per page</span><select value={pageSize} onChange={event=>onPageSize(Number(event.target.value))}><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></div><span className="pagination-count">{start}–{end} of {total}</span><div className="pagination-buttons"><button type="button" disabled={current<=1} onClick={()=>onPage(current-1)} aria-label="Previous page"><ChevronLeft/></button><b>Page {current} of {pages}</b><button type="button" disabled={current>=pages} onClick={()=>onPage(current+1)} aria-label="Next page"><ChevronRight/></button></div></div>;
}
