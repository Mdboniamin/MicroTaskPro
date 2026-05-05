import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, deleteDoc, runTransaction, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Check, X, Trash2, Eye, Loader2, Edit3, XCircle, Info, Calendar, User, Coins, AlertTriangle, Send } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sendSimulatedEmail, EMAIL_TEMPLATES } from '../../../lib/email';
import { useSearchParams } from 'react-router-dom';

export default function MyTasks() {
  const { dbUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTask, setActiveTask] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [reportingSub, setReportingSub] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [updatingTask, setUpdatingTask] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ['myTasks', dbUser?.email],
    queryFn: async () => {
      const q = query(collection(db, 'tasks'), where('buyer_email', '==', dbUser?.email));
      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return docs;
    },
    enabled: !!dbUser?.email,
  });

  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && tasks && !activeTask) {
      const target = tasks.find((t: any) => t.id === taskId);
      if (target) setActiveTask(target);
    }
  }, [searchParams, tasks, activeTask]);

  const { data: submissions, refetch: refetchSubs, isLoading: isSubsLoading } = useQuery({
    queryKey: ['taskSubmissions', activeTask?.id],
    queryFn: async () => {
      try {
        const q = query(collection(db, 'submissions'), where('task_id', '==', activeTask.id));
        const snap = await getDocs(q);
        return snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(sub => sub.status === 'pending');
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `submissions?task_id=${activeTask.id}`);
        return [];
      }
    },
    enabled: !!activeTask,
  });

  const handleApprove = async (sub: any) => {
    setProcessingId(sub.id);
    try {
      const workers = await getDocs(query(collection(db, 'users'), where('email', '==', sub.worker_email)));
      if (workers.empty) throw new Error("Worker not found");
      const workerRef = doc(db, 'users', workers.docs[0].id);

      await runTransaction(db, async (transaction) => {
        transaction.update(workerRef, { coins: increment(sub.payable_amount) });
        transaction.update(doc(db, 'submissions', sub.id), { status: 'approve' });
        const noteRef = doc(collection(db, 'notifications'));
        transaction.set(noteRef, {
          message: `you have earned ${sub.payable_amount} from ${dbUser?.name} for completing ${sub.task_title}`,
          toEmail: sub.worker_email,
          actionRoute: `/dashboard/worker/submissions?subId=${sub.id}`,
          time: new Date().toISOString(),
          read: false,
          isRead: false
        });
      });

      // Send simulated email
      const template = EMAIL_TEMPLATES.TASK_APPROVED(sub.task_title, sub.payable_amount);
      await sendSimulatedEmail(sub.worker_email, template.subject, template.body);

      refetchSubs();
      alert("Submission approved! Email notification simulated.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${sub.id}`);
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
          message: `Your submission for task "${sub.task_title}" has been rejected by ${dbUser?.name}.`,
          toEmail: sub.worker_email,
          actionRoute: `/dashboard/worker/submissions?subId=${sub.id}`,
          time: new Date().toISOString(),
          read: false,
          isRead: false
        });
      });

      // Send simulated email
      const template = EMAIL_TEMPLATES.TASK_REJECTED(sub.task_title);
      await sendSimulatedEmail(sub.worker_email, template.subject, template.body);

      refetchSubs();
      alert("Submission rejected. Task slot reopened. Email notification simulated.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${sub.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingSub || !reportReason.trim()) return;
    setProcessingId(reportingSub.id);
    try {
      await addDoc(collection(db, 'reports'), {
        submission_id: reportingSub.id,
        task_id: reportingSub.task_id,
        task_title: reportingSub.task_title,
        worker_email: reportingSub.worker_email,
        reporter_email: dbUser?.email,
        reporter_name: dbUser?.name,
        reason: reportReason,
        status: 'pending',
        createdAt: serverTimestamp(),
        submission_data: reportingSub
      });
      
      // Optionally reject it immediately too
      await handleReject(reportingSub);
      
      setReportingSub(null);
      setReportReason('');
      alert("Submission reported and rejected. Admin will review this shortly.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask || !dbUser) return;
    setUpdatingTask(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      task_title: formData.get('task_title') as string,
      task_detail: formData.get('task_detail') as string,
      submission_info: formData.get('submission_info') as string,
    };

    try {
       await updateDoc(doc(db, 'tasks', editingTask.id), updates);
       setEditingTask(null);
       refetchTasks();
       alert("Task updated successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${editingTask.id}`);
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleDeleteTask = async (task: any) => {
    if (!window.confirm("Delete this task? Remaining coins for unfilled slots will be refunded.")) return;
    
    try {
      if (!dbUser?.uid) throw new Error("User not authenticated properly");

      await runTransaction(db, async (transaction) => {
        const refundAmount = task.required_workers * task.payable_amount;
        const userRef = doc(db, 'users', dbUser.uid);
        
        transaction.update(userRef, { coins: increment(refundAmount) });
        transaction.delete(doc(db, 'tasks', task.id));
      });
      refetchTasks();
      alert("Task deleted and coins refunded.");
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${task.id}`);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">My Posted Tasks</h1>
        <p className="text-neutral-500">Monitor and review submissions for your tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tasks?.map((task: any) => (
          <div key={task.id} className="group relative flex flex-col rounded-3xl border border-neutral-200 bg-white p-6 transition-all hover:shadow-lg">
            <h3 className="text-lg font-bold text-neutral-900 line-clamp-1">{task.task_title}</h3>
            <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-bold text-orange-600">{task.payable_amount} Coins / slot</span>
                <span className="font-medium text-neutral-400">{task.required_workers} slots left</span>
            </div>
            
              <div className="mt-6 flex flex-wrap gap-2">
                <button 
                  onClick={() => setActiveTask(task)}
                  className="flex flex-grow items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                    <Eye size={16} /> Submissions
                </button>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setViewingTask(task)}
                      className="flex-1 flex items-center justify-center rounded-xl bg-blue-50 p-3 text-blue-600 transition hover:bg-blue-100"
                      title="View Details"
                    >
                        <Info size={18} />
                    </button>
                    <button 
                      onClick={() => setEditingTask(task)}
                      className="flex-1 flex items-center justify-center rounded-xl bg-yellow-50 p-3 text-yellow-600 transition hover:bg-yellow-100"
                      title="Edit Task"
                    >
                        <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task)}
                      className="flex-1 flex items-center justify-center rounded-xl bg-red-50 p-3 text-red-600 transition hover:bg-red-100"
                      title="Delete Task"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
          </div>
        ))}
      </div>

      {activeTask && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-black">Submissions for: <span className="text-orange-600">{activeTask.task_title}</span></h2>
                <button onClick={() => setActiveTask(null)} className="text-sm font-bold text-neutral-400 hover:text-neutral-900">Close</button>
            </div>
            
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Worker</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Submission Details</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400 text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                    {isSubsLoading ? (
                        <tr>
                            <td colSpan={3} className="px-6 py-12 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600" />
                            </td>
                        </tr>
                    ) : submissions?.map((sub: any) => (
                        <tr key={sub.id}>
                        <td className="px-6 py-4">
                            <div className="font-bold text-neutral-900">{sub.worker_name}</div>
                            <div className="text-xs text-neutral-400">{sub.worker_email}</div>
                        </td>
                        <td className="px-6 py-4 max-w-md text-sm text-neutral-600 italic">"{sub.submission_details}"</td>
                        <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                                <button 
                                    disabled={!!processingId}
                                    onClick={() => handleApprove(sub)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                >
                                    {processingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check size={20} />}
                                </button>
                                <button 
                                    disabled={!!processingId}
                                    onClick={() => handleReject(sub)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                    title="Reject"
                                >
                                    {processingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X size={20} />}
                                </button>
                                <button 
                                    disabled={!!processingId}
                                    onClick={() => setReportingSub(sub)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                    title="Report Invalid Submission"
                                >
                                    <AlertTriangle size={20} />
                                </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    {!isSubsLoading && submissions?.length === 0 && (
                        <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-neutral-400 italic">No pending submissions for this task.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {reportingSub && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setReportingSub(null)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <XCircle size={28} />
              </button>

              <div className="mb-8 flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Report Submission</h2>
                  <p className="text-neutral-500 font-medium text-sm">Flag this work as invalid or fraudulent.</p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Checking worker</p>
                <p className="font-bold text-neutral-900">{reportingSub.worker_name}</p>
                <p className="text-xs text-neutral-500">{reportingSub.worker_email}</p>
              </div>

              <form onSubmit={handleReport} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Reason for reporting</label>
                  <textarea 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="e.g. Incorrect proof, low quality, spam..."
                    rows={4}
                    required
                    className="w-full rounded-2xl border border-neutral-200 py-3.5 px-5 focus:border-red-500 focus:ring-4 focus:ring-red-50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                   <button 
                    disabled={!!processingId}
                    type="submit"
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-red-600 py-4 font-black text-white hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-200"
                  >
                    {processingId === reportingSub.id ? <Loader2 size={24} className="animate-spin" /> : <><Send size={18} /> Submit Report & Reject</>}
                  </button>
                  <p className="text-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    Reporting will also automatically reject the submission.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
      <AnimatePresence>
        {viewingTask && (
          <div className="fixed inset-0 z-50 flex justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2.5rem] bg-white p-8 shadow-2xl relative my-auto"
            >
              <button 
                onClick={() => setViewingTask(null)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <XCircle size={28} />
              </button>

              <div className="mb-8 flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <Info size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Task Details</h2>
                  <p className="text-neutral-500 font-medium">Full overview of your posted gig.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-1">Payable Amount</p>
                    <div className="flex items-center gap-2 text-xl font-black text-orange-600">
                      <Coins size={20} /> {viewingTask.payable_amount} Coins
                    </div>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-1">Remaining Slots</p>
                    <div className="flex items-center gap-2 text-xl font-black text-blue-600">
                      <User size={20} /> {viewingTask.required_workers} Workers
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-2">Title</h3>
                  <p className="text-lg font-bold text-neutral-700">{viewingTask.task_title}</p>
                </div>

                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-2">Description</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{viewingTask.task_detail}</p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
                   <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">Submission Requirements</h3>
                   <p className="text-sm font-medium text-orange-950">{viewingTask.submission_info}</p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                  <Calendar size={14} /> Deadline: {viewingTask.completion_date}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl rounded-[2.5rem] bg-white p-8 shadow-2xl relative my-auto"
            >
              <button 
                onClick={() => setEditingTask(null)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <XCircle size={28} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Edit Task</h2>
                <p className="text-neutral-500 font-medium">Update the details of your posted task.</p>
              </div>

              <form onSubmit={handleUpdateTask} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Task Title</label>
                  <input 
                    name="task_title"
                    defaultValue={editingTask.task_title}
                    required
                    className="w-full rounded-2xl border border-neutral-200 py-3.5 px-5"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Task Details</label>
                  <textarea 
                    name="task_detail"
                    defaultValue={editingTask.task_detail}
                    rows={4}
                    required
                    className="w-full rounded-2xl border border-neutral-200 py-3.5 px-5"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Submission Info</label>
                  <input 
                    name="submission_info"
                    defaultValue={editingTask.submission_info}
                    required
                    className="w-full rounded-2xl border border-neutral-200 py-3.5 px-5"
                  />
                </div>

                <button 
                  disabled={updatingTask}
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-neutral-900 py-4 font-black text-white hover:bg-black disabled:opacity-50 transition-all"
                >
                  {updatingTask ? <Loader2 size={24} className="animate-spin" /> : 'Update Task Details'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
