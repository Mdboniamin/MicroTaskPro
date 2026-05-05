import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { PlusCircle, ListTodo, Coins, Clock, Check, X, Loader2, Eye } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Link } from 'react-router-dom';

export default function BuyerHome() {
  const { dbUser } = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['buyerStats', dbUser?.email],
    queryFn: async () => {
      const q = query(collection(db, 'tasks'), where('buyer_email', '==', dbUser?.email));
      const snapsot = await getDocs(q);
      const tasks = snapsot.docs.map(doc => doc.data());
      
      const subQ = query(collection(db, 'submissions'), where('buyer_email', '==', dbUser?.email), where('status', '==', 'pending'));
      const subSnapshot = await getDocs(subQ);
      const pendingSubmissions = subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const approvedSubQ = query(collection(db, 'submissions'), where('buyer_email', '==', dbUser?.email), where('status', '==', 'approve'));
      const approvedSnapshot = await getDocs(approvedSubQ);
      const totalPaid = approvedSnapshot.docs.reduce((acc, curr) => acc + (curr.data().payable_amount || 0), 0);
      
      return {
        totalTasks: tasks.length,
        totalRequiredWorkers: tasks.reduce((acc, curr) => acc + (curr.required_workers || 0), 0),
        pendingSubmissions: pendingSubmissions,
        totalPaid: totalPaid
      };
    },
    enabled: !!dbUser?.email,
  });

  const handleApprove = async (sub: any) => {
    setProcessingId(sub.id);
    try {
      await runTransaction(db, async (transaction) => {
        const workers = await getDocs(query(collection(db, 'users'), where('email', '==', sub.worker_email)));
        if (workers.empty) throw new Error("Worker not found");
        const workerRef = doc(db, 'users', workers.docs[0].id);
        transaction.update(workerRef, { coins: increment(sub.payable_amount) });
        transaction.update(doc(db, 'submissions', sub.id), { status: 'approve' });

        const noteRef = doc(collection(db, 'notifications'));
        transaction.set(noteRef, {
          message: `Your submission for task "${sub.task_title}" has been approved! You earned ${sub.payable_amount} coins.`,
          toEmail: sub.worker_email,
          actionRoute: '/dashboard/worker/submissions',
          time: new Date().toISOString(),
          read: false
        });
      });
      refetchStats();
      setSelectedSub(null);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (sub: any) => {
    setProcessingId(sub.id);
    try {
      await runTransaction(db, async (transaction) => {
        transaction.update(doc(db, 'submissions', sub.id), { status: 'rejected' });
        transaction.update(doc(db, 'tasks', sub.task_id), { required_workers: increment(1) });

        const noteRef = doc(collection(db, 'notifications'));
        transaction.set(noteRef, {
          message: `Your submission for task "${sub.task_title}" has been rejected.`,
          toEmail: sub.worker_email,
          actionRoute: '/dashboard/worker/submissions',
          time: new Date().toISOString(),
          read: false
        });
      });
      refetchStats();
      setSelectedSub(null);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Buyer Dashboard, {dbUser?.name}!</h1>
        <p className="text-neutral-500">Manage your tasks and hiring progress.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          label="Total Task Count" 
          value={stats?.totalTasks || 0} 
          sub="Added by you" 
          icon={PlusCircle} 
          color="bg-purple-50 text-purple-600" 
          link="/dashboard/buyer/my-tasks"
        />
        <StatCard 
          label="Pending Workers" 
          value={stats?.totalRequiredWorkers || 0} 
          sub="Slots remaining in tasks" 
          icon={Clock} 
          color="bg-yellow-50 text-yellow-600" 
          link="/dashboard/buyer/my-tasks"
        />
        <StatCard 
          label="Total payment paid" 
          value={stats?.totalPaid || 0} 
          sub="Total coins paid to workers" 
          icon={Coins} 
          color="bg-green-50 text-green-600" 
          link="/dashboard/buyer/my-tasks"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-black text-neutral-900">Tasks To Review</h2>
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Worker</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Task Title</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Payable</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stats?.pendingSubmissions?.map((sub: any) => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 font-bold text-neutral-900">{sub.worker_name}</td>
                    <td className="px-6 py-4 text-neutral-600 italic">"{sub.task_title}"</td>
                    <td className="px-6 py-4 font-black text-orange-600">{sub.payable_amount} Coins</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setSelectedSub(sub)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 hover:bg-orange-100 hover:text-orange-600 transition-colors"
                          title="View Submission"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleApprove(sub)}
                          disabled={!!processingId}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {processingId === sub.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button 
                          onClick={() => handleReject(sub)}
                          disabled={!!processingId}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          {processingId === sub.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!stats?.pendingSubmissions || stats.pendingSubmissions.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-400 italic">No pending submissions to review.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSub(null)} className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg rounded-3xl bg-white p-8">
              <h2 className="text-2xl font-black mb-4">Submission Detail</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Reviewing for</p>
                  <p className="text-lg font-bold">{selectedSub.task_title}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Worker Submission</p>
                  <div className="mt-1 p-4 rounded-2xl bg-neutral-50 text-neutral-600 italic">
                    "{selectedSub.submission_details}"
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button 
                  disabled={!!processingId}
                  onClick={() => handleApprove(selectedSub)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {processingId === selectedSub.id ? <Loader2 className="animate-spin" /> : <Check size={18} />} Approve
                </button>
                <button 
                  disabled={!!processingId}
                  onClick={() => handleReject(selectedSub)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {processingId === selectedSub.id ? <Loader2 className="animate-spin" /> : <X size={18} />} Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
