import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Save, ShieldCheck, UserCog, UserPlus, X } from 'lucide-react';
import { api } from './api';

type AccountUser={name:string;email:string;role:string};
type ManagedUser={id:string;name:string;email:string;role:string};
const positions:Record<string,string>={
  'staff integrasi':'Staff integrasi',
  'lead integrasi':'Lead integrasi',
  'head section':'Head section',
  'head of software engineer':'Head of Software Engineer',
  'it innovation team leader':'IT Innovation Team Leader',
  'head of it':'Head of IT',
};
const managerPositions=new Set(['lead integrasi','head section','head of software engineer','it innovation team leader','head of it']);

export default function AccountPage({user,onUserCreated}:{user:AccountUser;onUserCreated?:()=>void}) {
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [passwordError,setPasswordError]=useState('');
  const [passwordSuccess,setPasswordSuccess]=useState('');
  const [passwordBusy,setPasswordBusy]=useState(false);
  const [member,setMember]=useState({name:'',email:'',role:'staff integrasi',password:''});
  const [memberError,setMemberError]=useState('');
  const [memberSuccess,setMemberSuccess]=useState('');
  const [memberBusy,setMemberBusy]=useState(false);
  const [users,setUsers]=useState<ManagedUser[]>([]);
  const [roleDrafts,setRoleDrafts]=useState<Record<string,string>>({});
  const [controlError,setControlError]=useState('');
  const [controlSuccess,setControlSuccess]=useState('');
  const [savingUserId,setSavingUserId]=useState('');
  const [resetUser,setResetUser]=useState<ManagedUser|null>(null);
  const [resetPassword,setResetPassword]=useState('');
  const [resetConfirm,setResetConfirm]=useState('');
  const normalizedRole=user.role?.toLowerCase();
  const canManageUsers=managerPositions.has(normalizedRole)||/\b(lead|head)\b/i.test(normalizedRole||'');

  async function loadUsers(){
    const data=await api('/users');
    setUsers(data);
    setRoleDrafts(Object.fromEntries(data.map((item:ManagedUser)=>[item.id,item.role])));
  }
  useEffect(()=>{if(canManageUsers)loadUsers().catch(error=>setControlError((error as Error).message));},[canManageUsers]);

  async function updatePassword(event:React.FormEvent){
    event.preventDefault();setPasswordError('');setPasswordSuccess('');
    if(newPassword!==confirmPassword){setPasswordError('New passwords do not match');return;}
    setPasswordBusy(true);
    try{
      const result=await api('/auth/password',{method:'PATCH',body:JSON.stringify({currentPassword,newPassword})});
      setPasswordSuccess(result.message);setCurrentPassword('');setNewPassword('');setConfirmPassword('');
    }catch(error){setPasswordError((error as Error).message);}finally{setPasswordBusy(false);}
  }

  async function registerMember(event:React.FormEvent){
    event.preventDefault();setMemberError('');setMemberSuccess('');setMemberBusy(true);
    try{
      const created=await api('/users',{method:'POST',body:JSON.stringify(member)});
      setMemberSuccess(`${created.name} was registered successfully.`);
      setMember({name:'',email:'',role:'staff integrasi',password:''});
      await loadUsers();
      onUserCreated?.();
    }catch(error){setMemberError((error as Error).message);}finally{setMemberBusy(false);}
  }

  async function updatePosition(member:ManagedUser){
    setSavingUserId(member.id);setControlError('');setControlSuccess('');
    try{
      const updated=await api(`/users/${member.id}/position`,{method:'PATCH',body:JSON.stringify({role:roleDrafts[member.id]})});
      setControlSuccess(updated.message);
      await loadUsers();onUserCreated?.();
    }catch(error){setControlError((error as Error).message);}finally{setSavingUserId('');}
  }

  async function resetMemberPassword(event:React.FormEvent){
    event.preventDefault();setControlError('');setControlSuccess('');
    if(!resetUser)return;
    if(resetPassword!==resetConfirm){setControlError('The new passwords do not match');return;}
    setSavingUserId(resetUser.id);
    try{
      const result=await api(`/users/${resetUser.id}/password`,{method:'PATCH',body:JSON.stringify({newPassword:resetPassword})});
      setControlSuccess(result.message);setResetUser(null);setResetPassword('');setResetConfirm('');
    }catch(error){setControlError((error as Error).message);}finally{setSavingUserId('');}
  }

  return <main className="content account-page">
    <header><div><p className="eyebrow">ACCOUNT SECURITY</p><h1>Your account</h1><p className="muted">Manage access to Nicepay Integration.</p></div></header>
    <section className="account-layout">
      <article className="profile-card"><div className="profile-avatar">{user.name.split(' ').map(part=>part[0]).join('').slice(0,2)}</div><h2>{user.name}</h2><p>{user.email}</p><span>{user.role}</span><div className="security-note"><ShieldCheck/><div><b>Secure account</b><small>Your password is stored using strong encryption.</small></div></div></article>
      <form className="password-card" onSubmit={updatePassword}><div className="password-title"><KeyRound/><div><h2>Update password</h2><p className="muted">Use at least eight characters.</p></div></div>
        <label>Current password<input required type="password" minLength={6} autoComplete="current-password" value={currentPassword} onChange={event=>setCurrentPassword(event.target.value)}/></label>
        <label>New password<input required type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={event=>setNewPassword(event.target.value)}/></label>
        <label>Confirm new password<input required type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)}/></label>
        {passwordError&&<p className="error">{passwordError}</p>}{passwordSuccess&&<p className="success"><CheckCircle2/>{passwordSuccess}</p>}
        <button className="primary" disabled={passwordBusy}>{passwordBusy?'Updating…':'Update password'}</button>
      </form>
      {canManageUsers&&<form className="register-card" onSubmit={registerMember}><div className="password-title"><UserPlus/><div><h2>Register user</h2><p className="muted">Add a member to the integration team.</p></div></div>
        <div className="grid2"><label>Full name<input required minLength={2} value={member.name} onChange={event=>setMember({...member,name:event.target.value})}/></label><label>Work email<input required type="email" value={member.email} onChange={event=>setMember({...member,email:event.target.value})}/></label></div>
        <div className="grid2"><label>Position<select value={member.role} onChange={event=>setMember({...member,role:event.target.value})}>{Object.entries(positions).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Initial password<input required type="password" minLength={8} autoComplete="new-password" value={member.password} onChange={event=>setMember({...member,password:event.target.value})}/></label></div>
        {memberError&&<p className="error">{memberError}</p>}{memberSuccess&&<p className="success"><CheckCircle2/>{memberSuccess}</p>}
        <button className="primary" disabled={memberBusy}><UserPlus/>{memberBusy?'Registering…':'Register user'}</button>
      </form>}
      {canManageUsers&&<section className="user-control-card"><div className="password-title"><UserCog/><div><h2>User control</h2><p className="muted">Update team positions or help a member who forgot their password.</p></div></div>
        {controlError&&<p className="error">{controlError}</p>}{controlSuccess&&<p className="success"><CheckCircle2/>{controlSuccess}</p>}
        <div className="user-control-list">{users.map(member=><article key={member.id}><div className="managed-user"><b>{member.name}</b><small>{member.email}</small></div><select aria-label={`Position for ${member.name}`} value={roleDrafts[member.id]||member.role} onChange={event=>setRoleDrafts({...roleDrafts,[member.id]:event.target.value})}>{Object.entries(positions).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button type="button" className="save-position" disabled={savingUserId===member.id||roleDrafts[member.id]===member.role} onClick={()=>updatePosition(member)}><Save/>Save</button><button type="button" className="reset-password" onClick={()=>{setResetUser(member);setResetPassword('');setResetConfirm('');setControlError('');}}>Reset password</button></article>)}</div>
      </section>}
    </section>
    {resetUser&&<div className="overlay"><form className="modal reset-password-modal" onSubmit={resetMemberPassword}><button className="icon close" type="button" onClick={()=>setResetUser(null)}><X/></button><p className="eyebrow">USER ACCESS</p><h2>Reset password</h2><p className="muted">Set a temporary password for {resetUser.name}. Share it securely and ask them to change it after signing in.</p><label>New password<input required type="password" minLength={8} autoComplete="new-password" value={resetPassword} onChange={event=>setResetPassword(event.target.value)}/></label><label>Confirm password<input required type="password" minLength={8} autoComplete="new-password" value={resetConfirm} onChange={event=>setResetConfirm(event.target.value)}/></label>{controlError&&<p className="error">{controlError}</p>}<div className="actions"><button type="button" onClick={()=>setResetUser(null)}>Cancel</button><button className="primary" disabled={savingUserId===resetUser.id}><KeyRound/>{savingUserId===resetUser.id?'Resetting…':'Reset password'}</button></div></form></div>}
  </main>;
}
