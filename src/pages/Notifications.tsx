import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle2 } from 'lucide-react';

export default function Notifications() {
  const { dbUser } = useAuth();

  const { data: notifications, refetch } = useQuery({
    queryKey: ['notifications', dbUser?.email],
    queryFn: async () => {
      const q = query(
        collection(db, 'notifications'), 
        where('toEmail', '==', dbUser?.email)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!dbUser?.email,
  });

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
    refetch();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black text-neutral-900">Notifications</h1>
        <Bell className="text-orange-600" />
      </div>

      <div className="space-y-4">
        {notifications?.map((n: any) => (
          <div 
            key={n.id} 
            className={`flex items-start gap-4 rounded-3xl border p-6 transition-all ${
              n.isRead ? 'border-neutral-100 bg-white opacity-60' : 'border-orange-100 bg-orange-50'
            }`}
          >
            <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              n.isRead ? 'bg-neutral-100 text-neutral-400' : 'bg-orange-100 text-orange-600'
            }`}>
              <Bell size={20} />
            </div>
            <div className="flex-grow">
                <p className={`font-bold ${n.isRead ? 'text-neutral-600' : 'text-neutral-900'}`}>{n.message}</p>
                <p className="mt-1 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    {new Date(n.time).toLocaleString()}
                </p>
            </div>
            {!n.isRead && (
                <button 
                  onClick={() => markAsRead(n.id)}
                  className="rounded-lg bg-white p-2 text-neutral-400 shadow-sm hover:text-orange-600"
                >
                    <CheckCircle2 size={18} />
                </button>
            )}
          </div>
        ))}
        {notifications?.length === 0 && (
          <div className="rounded-3xl border border-dashed border-neutral-200 py-12 text-center text-neutral-400">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}
