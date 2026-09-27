'use client'; import { useRouter } from 'next/navigation';
export function AdminLogout(){const router=useRouter();return <button className="admin-nav-button" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/admin/login');router.refresh();}}>Sign out</button>;}
