import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, doc, deleteDoc, query, orderBy, setDoc, deleteField, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { Trash2, AlertTriangle, User, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function ManageReports() {
  const { data: reports, refetch } = useQuery({
    queryKey: ['adminReports'],
    queryFn: async () => {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Dismiss this report?')) return;
    try {
      await deleteDoc(doc(db, 'reports', id));
      refetch();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
    }
  };

  const handleTakeAction = async (report: any) => {
     if (!confirm(`Warning: You are about to take action on worker ${report.worker_email}. This should be used for repeated violations.`)) return;
     try {
       // In a real app, you might suspend the user account. 
       // For now, we'll just mark the report as "Resolved" or delete it.
       await deleteDoc(doc(db, 'reports', report.id));
       alert("Action simulated: Worker has been flagged (Admin side logic).");
       refetch();
     } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `reports/${report.id}`);
     }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Manage Reports</h1>
        <p className="text-neutral-500 font-medium">Review flags submitted by buyers regarding invalid work.</p>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white shadow-xl shadow-neutral-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <th className="px-8 py-5">Reporter</th>
                <th className="px-8 py-5">Worker / Submission</th>
                <th className="px-8 py-5">Reason</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reports?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-neutral-400 font-bold italic">
                    All clear! No reports pending review.
                  </td>
                </tr>
              )}
              {reports?.map((report: any) => (
                <tr key={report.id} className="group transition-colors hover:bg-neutral-50/50">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="font-black text-neutral-900">{report.reporter_name}</div>
                        <div className="text-xs font-bold text-neutral-400">{report.reporter_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-black text-neutral-700">
                         <AlertTriangle size={14} className="text-amber-500" />
                         {report.worker_email}
                      </div>
                      <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                        Task: {report.task_title}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-xs text-sm font-medium text-neutral-600 italic">
                      "{report.reason}"
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleTakeAction(report)}
                        className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                      >
                        <CheckCircle size={14} /> Resolve
                      </button>
                      <button 
                        onClick={() => handleDeleteReport(report.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Dismiss"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
