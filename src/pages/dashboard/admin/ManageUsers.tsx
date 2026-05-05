import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Trash2, Shield, User as UserIcon } from 'lucide-react';

export default function ManageUsers() {
  const { data: users, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const handleRoleChange = async (userId: string, nextRole: string) => {
    if (!window.confirm(`Change role to ${nextRole}?`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), { role: nextRole });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Manage Users</h1>
        <p className="text-neutral-500 font-medium">Control platform access and user roles.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                <th className="px-6 py-5">User Profile</th>
                <th className="px-6 py-5">Account Status</th>
                <th className="px-6 py-5">Coin Balance</th>
                <th className="px-6 py-5 text-center">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-neutral-50/20 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <img 
                        src={user.photo} 
                        className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm object-cover" 
                        onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + user.name)}
                      />
                      <div>
                        <div className="font-black text-neutral-900 leading-tight">{user.name}</div>
                        <div className="text-sm font-medium text-neutral-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-neutral-700 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all"
                    >
                      <option value="worker">Worker</option>
                      <option value="buyer">Buyer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-black text-orange-600">
                        <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
                        {user.coins || 0}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center">
                        <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100 active:scale-95"
                        >
                            <Trash2 size={14} />
                            Remove User
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
