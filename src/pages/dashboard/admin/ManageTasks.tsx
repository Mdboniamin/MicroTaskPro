import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Trash2, ExternalLink, Coins } from 'lucide-react';

export default function ManageTasks() {
  const { data: tasks, refetch } = useQuery({
    queryKey: ['adminTasks'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'tasks'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Delete this task? No refund will be issued to buyer via this admin action.")) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Manage Tasks</h1>
        <p className="text-neutral-500 font-medium">Review and moderate global task listings.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                <th className="px-6 py-5">Task Details</th>
                <th className="px-6 py-5">Buyer Info</th>
                <th className="px-6 py-5">Economics</th>
                <th className="px-6 py-5">Capacity</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 italic">
              {tasks?.map((task: any) => (
                <tr key={task.id} className="hover:bg-neutral-50/20 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-black text-neutral-900 line-clamp-1">{task.task_title}</div>
                    <div className="text-xs font-medium text-neutral-400 mt-0.5">ID: {task.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-neutral-700 leading-tight">{task.buyer_name}</div>
                    <div className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">{task.buyer_email}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 font-black text-orange-600">
                      <Coins size={14} className="fill-orange-600" />
                      {task.payable_amount}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                      {task.required_workers} slots
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100 active:scale-95"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
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
