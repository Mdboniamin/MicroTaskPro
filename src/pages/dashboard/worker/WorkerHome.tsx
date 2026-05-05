import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle, Clock, ListChecks, TrendingUp, User, Coins } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface Submission {
  id: string;
  task_title: string;
  payable_amount: number;
  buyer_name: string;
  status: string;
  submission_date?: string;
}

export default function WorkerHome() {
  const { dbUser } = useAuth();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalEarnings: 0
  });
  const [approvedSubmissions, setApprovedSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkerData() {
      if (!dbUser?.email) return;
      try {
        const subQ = query(collection(db, 'submissions'), where('worker_email', '==', dbUser.email));
        const snapshot = await getDocs(subQ);
        const allSubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));

        const pending = allSubs.filter(s => s.status === 'pending').length;
        const approved = allSubs.filter(s => s.status === 'approve' || s.status === 'approved');
        const earnings = approved.reduce((acc, curr) => acc + (curr.payable_amount || 0), 0);

        setStats({
          totalSubmissions: allSubs.length,
          pendingSubmissions: pending,
          totalEarnings: earnings
        });

        // Get latest approved submissions
        setApprovedSubmissions(approved.slice(0, 10)); // Top 10 for dashboard
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'submissions');
        setLoading(false);
      }
    }
    fetchWorkerData();
  }, [dbUser]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto p-4 sm:p-0"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Worker Dashboard</h1>
        <p className="text-neutral-500 font-medium">Monitoring your contributions and earnings.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/dashboard/worker/submissions">
          <motion.div 
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md h-full cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <ListChecks size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Total Submissions</p>
                <h3 className="text-2xl font-black text-neutral-900">{stats.totalSubmissions}</h3>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/dashboard/worker/submissions?status=pending">
          <motion.div 
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md h-full cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Pending</p>
                <h3 className="text-2xl font-black text-neutral-900">{stats.pendingSubmissions}</h3>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/dashboard/worker/withdraw">
          <motion.div 
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md h-full cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Total Earnings</p>
                <div className="flex items-center gap-2">
                  <Coins size={20} className="text-green-600" />
                  <h3 className="text-2xl font-black text-neutral-900">{stats.totalEarnings}</h3>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Approved Submissions Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
      >
        <div className="border-b border-neutral-100 bg-neutral-50/50 p-6">
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <CheckCircle className="text-green-600" size={24} />
            Recent Approved Submissions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/30 text-xs font-black uppercase tracking-widest text-neutral-400">
                <th className="px-6 py-4">Task Title</th>
                <th className="px-6 py-4">Payable Amount</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {approvedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-400 font-medium italic">
                    No approved submissions yet.
                  </td>
                </tr>
              ) : (
                approvedSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate font-bold text-neutral-900">{sub.task_title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-black text-green-600">
                        <Coins size={14} />
                        {sub.payable_amount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                        <User size={14} className="opacity-40" />
                        {sub.buyer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-green-600 border border-green-100">
                        Approved
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
