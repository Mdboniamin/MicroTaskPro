import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Users, ListTodo, Wallet, Coins, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminHome() {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => doc.data());

      const tasksSnap = await getDocs(collection(db, 'tasks'));
      const paymentsSnap = await getDocs(collection(db, 'payments'));
      
      const workers = users.filter(u => u.role === 'worker');
      const buyers = users.filter(u => u.role === 'buyer');

      const totalCoins = users.reduce((acc, curr) => acc + (curr.coins || 0), 0);
      const totalPayments = paymentsSnap.docs.reduce((acc, curr) => acc + (curr.data().price || 0), 0);
      
      return {
        totalWorkers: workers.length,
        totalBuyers: buyers.length,
        totalTasks: tasksSnap.size,
        totalCoins,
        totalPayments
      };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Admin Home</h1>
        <p className="text-neutral-500">Platform overview and vital statistics.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Workers" value={stats?.totalWorkers || 0} sub="Active earners" icon={Users} color="bg-blue-50 text-blue-600" link="/dashboard/admin/manage-users" />
        <StatCard label="Total Buyers" value={stats?.totalBuyers || 0} sub="Job providers" icon={ListTodo} color="bg-purple-50 text-purple-600" link="/dashboard/admin/manage-users" />
        <StatCard label="Available Coins" value={stats?.totalCoins || 0} sub="Platform economy" icon={Coins} color="bg-orange-50 text-orange-600" link="/dashboard/admin/manage-users" />
        <StatCard label="Total Payments" value={`$${stats?.totalPayments || 0}`} sub="Total revenue" icon={Wallet} color="bg-green-50 text-green-600" link="/dashboard/admin/manage-withdrawals" />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, link }: any) {
  const content = (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm h-full hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-neutral-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">{sub}</p>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}
