import { useState } from 'react';
import { CheckCircle2, KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { api } from './api';

type AccountUser={name:string;email:string;role:string};

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
  const canRegister=user.role?.toLowerCase().includes('lead');

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
      onUserCreated?.();
    }catch(error){setMemberError((error as Error).message);}finally{setMemberBusy(false);}
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
      {canRegister&&<form className="register-card" onSubmit={registerMember}><div className="password-title"><UserPlus/><div><h2>Register user</h2><p className="muted">Add a member to the integration team.</p></div></div>
        <div className="grid2"><label>Full name<input required minLength={2} value={member.name} onChange={event=>setMember({...member,name:event.target.value})}/></label><label>Work email<input required type="email" value={member.email} onChange={event=>setMember({...member,email:event.target.value})}/></label></div>
        <div className="grid2"><label>Role<select value={member.role} onChange={event=>setMember({...member,role:event.target.value})}><option value="staff integrasi">Staff integrasi</option><option value="lead integrasi">Lead integrasi</option></select></label><label>Initial password<input required type="password" minLength={8} autoComplete="new-password" value={member.password} onChange={event=>setMember({...member,password:event.target.value})}/></label></div>
        {memberError&&<p className="error">{memberError}</p>}{memberSuccess&&<p className="success"><CheckCircle2/>{memberSuccess}</p>}
        <button className="primary" disabled={memberBusy}><UserPlus/>{memberBusy?'Registering…':'Register user'}</button>
      </form>}
    </section>
  </main>;
}
