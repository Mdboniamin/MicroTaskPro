import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, deleteDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { ChevronLeft, ChevronRight, Search, Coins, Calendar, User, Edit2, Check, X, Loader2, Files, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

interface Submission {
  id: string;
  task_title: string;
  payable_amount: number;
  buyer_name: string;
  current_date: string;
  status: string;
  submission_details: string;
  task_id: string;
}

export default function MySubmissions() {
  const { dbUser } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('subId');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function fetchSubmissions() {
      if (!dbUser?.email) return;
      try {
        const q = query(
          collection(db, 'submissions'), 
          where('worker_email', '==', dbUser.email),
          orderBy('current_date', 'desc')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        setSubmissions(list);
        
        // Auto-page to highlighted item
        if (highlightedId) {
          const index = list.findIndex(s => s.id === highlightedId);
          if (index !== -1) {
            setCurrentPage(Math.floor(index / itemsPerPage) + 1);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'submissions');
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, [dbUser, highlightedId]);

  const handleEdit = (sub: Submission) => {
    setEditingId(sub.id);
    setEditValue(sub.submission_details);
  };

  const handleSave = async (id: string) => {
    setSavingId(id);
    try {
      await updateDoc(doc(db, 'submissions', id), {
        submission_details: editValue
      });
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, submission_details: editValue } : s));
      setEditingId(null);
      alert("Submission updated!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${id}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (sub: Submission) => {
    if (!window.confirm("Are you sure you want to delete this submission? You will lose this slot if others take it.")) return;
    
    setSavingId(sub.id);
    try {
      // 1. Delete submission
      await deleteDoc(doc(db, 'submissions', sub.id));
      
      // 2. Return slot to task
      await updateDoc(doc(db, 'tasks', sub.task_id), {
        required_workers: increment(1)
      });
      
      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
      alert("Submission deleted and slot returned.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `submissions/${sub.id}`);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(submissions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = submissions.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">My Submissions</h1>
        <p className="text-neutral-500 font-medium">Tracking your completed work and approval status.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50/50 p-6">
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Files className="text-orange-600" size={24} />
            Submission Log
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                <th className="px-6 py-5 whitespace-nowrap">Task Info</th>
                <th className="px-6 py-5 whitespace-nowrap">Proof Provided</th>
                <th className="px-6 py-5 whitespace-nowrap">Earnings</th>
                <th className="px-6 py-5 whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-5 whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-neutral-400 font-medium italic">
                    No submissions found. Start working on available tasks!
                  </td>
                </tr>
              ) : (
                currentItems.map((sub) => (
                  <tr 
                    key={sub.id} 
                    className={`transition-colors group ${
                      sub.id === highlightedId 
                        ? 'bg-orange-50/50 border-y-2 border-orange-200' 
                        : 'hover:bg-neutral-50/50'
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="font-black text-neutral-900 mb-1">{sub.task_title}</div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          <User size={12} className="opacity-40" />
                          {sub.buyer_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          <Calendar size={12} className="opacity-40" />
                          {new Date(sub.current_date).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {editingId === sub.id ? (
                        <div className="flex items-center gap-2">
                           <textarea 
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full rounded-2xl border border-neutral-200 p-4 text-sm font-medium focus:border-orange-500 outline-none shadow-sm"
                              rows={3}
                           />
                        </div>
                      ) : (
                        <div className="max-w-xs truncate text-sm font-medium text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100">
                          {sub.submission_details}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 font-black text-lg text-orange-600">
                        <Coins size={18} className="fill-orange-600" />
                        {sub.payable_amount}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        sub.status === 'approve' || sub.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' : 
                        sub.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-yellow-50 text-yellow-600 border-yellow-100'
                      }`}>
                        {sub.status === 'approve' ? 'Approved' : sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {sub.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          {editingId === sub.id ? (
                            <>
                              <button 
                                onClick={() => handleSave(sub.id)}
                                disabled={savingId === sub.id}
                                className="p-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95"
                              >
                                {savingId === sub.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="p-3 rounded-xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-all active:scale-95"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleEdit(sub)}
                              className="p-3 rounded-xl bg-neutral-50 text-neutral-600 hover:bg-orange-50 hover:text-orange-600 transition-all border border-neutral-100 active:scale-95"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          <button 
                            disabled={savingId === sub.id}
                            onClick={() => handleDelete(sub)}
                            className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100 active:scale-95"
                            title="Delete"
                          >
                            {savingId === sub.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="h-8 w-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300">
                             <Edit2 size={12} />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/30 px-6 py-5">
            <div className="text-xs font-black uppercase tracking-widest text-neutral-400">
              Page <span className="text-neutral-900">{currentPage}</span> of {totalPages}
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-50 disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-50 disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
