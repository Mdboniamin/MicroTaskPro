import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, runTransaction, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, User, Coins, Clock, ChevronLeft, Loader2, Send, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  useEffect(() => {
    async function fetchTask() {
      if (!id) return;
      try {
        const docRef = doc(db, 'tasks', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTask({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("Task not found");
          navigate('/dashboard/worker/tasks');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `tasks/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task || !dbUser) return;

    const formData = new FormData(e.currentTarget);
    const submission_details = formData.get('submission_details') as string;

    setSubmissionLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'tasks', task.id);
        const taskSnap = await transaction.get(taskRef);
        
        if (!taskSnap.exists()) throw new Error("Task does not exist!");
        const currentTask = taskSnap.data();
        
        if (currentTask.required_workers <= 0) {
          throw new Error("No slots available for this task!");
        }

        // 1. Create submission
        const subRef = doc(collection(db, 'submissions'));
        transaction.set(subRef, {
          task_id: task.id,
          task_title: task.task_title,
          payable_amount: task.payable_amount,
          worker_email: dbUser.email,
          worker_name: dbUser.name,
          submission_details,
          buyer_name: task.buyer_name,
          buyer_email: task.buyer_email,
          current_date: new Date().toISOString(),
          status: 'pending'
        });

        // 2. Decrement slots
        transaction.update(taskRef, {
          required_workers: increment(-1)
        });

        // 3. Notify buyer
        const noteRef = doc(collection(db, 'notifications'));
        transaction.set(noteRef, {
          message: `${dbUser.name} submitted proof for: ${task.task_title}`,
          toEmail: task.buyer_email,
          actionRoute: `/dashboard/buyer/my-tasks?taskId=${task.id}`,
          time: new Date().toISOString(),
          read: false,
          isRead: false
        });
      });

      alert("Submission successful! Waiting for approval.");
      navigate('/dashboard/worker/submissions');
    } catch (error: any) {
      if (error.message === "No slots available for this task!") {
        alert(error.message);
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'submissions');
      }
    } finally {
      setSubmissionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-orange-600 transition-colors"
      >
        <ChevronLeft size={18} /> Back to Tasks
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="aspect-video w-full bg-neutral-100">
              <img 
                src={task.task_image_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000'} 
                alt={task.task_title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-orange-600 border border-orange-200">
                  <Coins size={14} className="fill-orange-600" />
                  {task.payable_amount} Coins
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-600 border border-blue-100">
                  <Clock size={14} />
                  {task.required_workers} slots left
                </span>
              </div>
              
              <h1 className="text-3xl font-black text-neutral-900 tracking-tight mb-4">{task.task_title}</h1>
              
              <div className="flex flex-wrap gap-6 border-y border-neutral-100 py-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Buyer</p>
                    <p className="text-sm font-bold text-neutral-900">{task.buyer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Deadline</p>
                    <p className="text-sm font-bold text-neutral-900">{task.completion_date}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-neutral-900 mb-2">Task Details</h3>
                  <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">{task.task_detail}</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-6 border border-orange-100">
                  <h3 className="flex items-center gap-2 text-sm font-black text-orange-950 uppercase tracking-widest mb-3">
                    <Info size={16} /> Submission Instructions
                  </h3>
                  <p className="text-orange-900 font-medium">{task.submission_info}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-black text-neutral-900 mb-6">Submit Your Work</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-neutral-700">Submission Details</label>
                <textarea 
                  name="submission_details"
                  required
                  rows={5}
                  placeholder="Paste links, text proof, or any information requested by the buyer..."
                  className="w-full rounded-2xl border border-neutral-200 py-4 px-5 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
                />
              </div>
              <button 
                disabled={submissionLoading}
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 py-4 font-black text-white shadow-lg shadow-orange-100 transition hover:bg-orange-700 hover:shadow-orange-200 active:scale-[0.98] disabled:opacity-50"
              >
                {submissionLoading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={20} /> Submit Work</>}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar info? Maybe redundant but good for layout */}
        <div className="hidden lg:block space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-black text-neutral-400 uppercase tracking-widest mb-4">Earnings Potential</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-orange-600">{task.payable_amount}</span>
              <span className="text-lg font-bold text-neutral-400">Coins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
