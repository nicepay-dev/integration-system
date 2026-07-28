import { useState } from 'react';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { api } from './api';

export default function AccountPage({user}:{user:{name:string;email:string;role:string}}) {
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent){
    event.preventDefault();setError('');setSuccess('');
    if(newPassword!==confirmPassword){setError('New passwords do not match');return;}
    setBusy(true);
    try{
      const result=await api('/auth/password',{method:'PATCH',body:JSON.stringify({currentPassword,newPassword})});
      setSuccess(result.message);setCurrentPassword('');setNewPassword('');setConfirmPassword('');
    }catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  return <main className="content account-page">
    <header><div><p className="eyebrow">ACCOUNT SECURITY</p><h1>Your account</h1><p className="muted">Manage your personal access to Merchant Pulse.</p></div></header>
    <section className="account-layout"><article className="profile-card"><div className="profile-avatar">{user.name.split(' ').map(part=>part[0]).join('').slice(0,2)}</div><h2>{user.name}</h2><p>{user.email}</p><span>{user.role}</span><div className="security-note"><ShieldCheck/><div><b>Secure account</b><small>Your password is stored using strong encryption.</small></div></div></article>
    <form className="password-card" onSubmit={submit}><div className="password-title"><KeyRound/><div><h2>Update password</h2><p className="muted">Use at least eight characters.</p></div></div>
      <label>Current password<input required type="password" minLength={6} value={currentPassword} onChange={event=>setCurrentPassword(event.target.value)}/></label>
      <label>New password<input required type="password" minLength={8} value={newPassword} onChange={event=>setNewPassword(event.target.value)}/></label>
      <label>Confirm new password<input required type="password" minLength={8} value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)}/></label>
      {error&&<p className="error">{error}</p>}{success&&<p className="success"><CheckCircle2/>{success}</p>}
      <button className="primary" disabled={busy}>{busy?'Updating…':'Update password'}</button>
    </form></section>
  </main>;
}
