import { useEffect, useState } from 'react';
import { Clock3, ExternalLink, History, X } from 'lucide-react';
import { api } from './api';
import ProjectLibraryPage from './ProjectLibraryPage';

type Member={id:string;name:string;email:string};
type Project={id:string;name:string;category:string;description:string;projectUrl?:string;pic?:Member|null;technology?:string;status:string;notes?:string;createdBy:string;createdAt:string;updatedAt:string};
type Audit={id:string;action:string;changedBy:string;changes:Record<string,{from:unknown;to:unknown}>;createdAt:string};
const categoryLabels:Record<string,string>={INTERNAL_TOOL:'Internal tool',INTEGRATION:'Integration',AUTOMATION:'Automation',DOCUMENTATION:'Documentation',RESEARCH:'Research',OTHER:'Other'};
const statusLabels:Record<string,string>={IDEA:'Idea',PLANNING:'Planning',IN_PROGRESS:'In progress',MAINTENANCE:'Maintenance',COMPLETED:'Completed',ARCHIVED:'Archived'};
const fieldLabels:Record<string,string>={project:'Project',name:'Project name',category:'Category',description:'Description',projectUrl:'Link',pic:'PIC',technology:'Technology',status:'Status',notes:'Notes'};
const value=(item:unknown)=>item===null||item===''?'Empty':String(item);

function ProjectDetail({project,close}:{project:Project;close:()=>void}){
  const [history,setHistory]=useState<Audit[]>([]);
  useEffect(()=>{api(`/project-library/${project.id}/history`).then(setHistory)},[project.id]);
  return <div className="overlay"><section className="modal library-detail-modal">
    <button className="icon close" onClick={close}><X/></button><p className="eyebrow">PROJECT DETAIL</p>
    <div className="library-detail-title"><div><h2>{project.name}</h2><span className={`project-status ${project.status.toLowerCase()}`}>{statusLabels[project.status]}</span></div>{project.projectUrl&&<a href={project.projectUrl} target="_blank" rel="noreferrer">Open project <ExternalLink/></a>}</div>
    <div className="library-detail-grid"><article><span>Category</span><b>{categoryLabels[project.category]}</b></article><article><span>PIC</span><b>{project.pic?.name||'Not assigned'}</b></article><article><span>Technology</span><b>{project.technology||'Not specified'}</b></article><article><span>Created by</span><b>{project.createdBy}</b></article><article><span>Created at</span><b>{new Date(project.createdAt).toLocaleString('en-GB')}</b></article><article><span>Updated at</span><b>{new Date(project.updatedAt).toLocaleString('en-GB')}</b></article></div>
    <section className="library-detail-copy"><h3>Description</h3><p>{project.description}</p>{project.notes&&<><h3>Notes</h3><p>{project.notes}</p></>}</section>
    <section className="library-detail-history"><h3><History/> Change history</h3>{history.length?history.map(item=><article key={item.id}><div className="history-meta"><Clock3/><div><b>{item.action==='CREATED'?'Project created':'Project updated'}</b><small>{item.changedBy} · {new Date(item.createdAt).toLocaleString('en-GB')}</small></div></div>{Object.entries(item.changes).map(([field,change])=><p key={field}><b>{fieldLabels[field]||field}</b><span>{value(change.from)} → {value(change.to)}</span></p>)}</article>):<p className="muted">No recorded changes yet.</p>}</section>
  </section></div>;
}

export default function ProjectLibraryWithDetails({members}:{members:Member[]}){
  const [projects,setProjects]=useState<Project[]>([]);const [selected,setSelected]=useState<Project|null>(null);
  useEffect(()=>{api('/project-library').then(setProjects)},[]);
  useEffect(()=>{const click=(event:MouseEvent)=>{const name=(event.target as HTMLElement).closest('.library-table tbody td:first-child b');if(!name)return;const project=projects.find(item=>item.name===name.textContent?.trim());if(project)setSelected(project)};document.addEventListener('click',click);return()=>document.removeEventListener('click',click)},[projects]);
  return <><ProjectLibraryPage members={members}/>{selected&&<ProjectDetail project={selected} close={()=>setSelected(null)}/>}</>;
}
