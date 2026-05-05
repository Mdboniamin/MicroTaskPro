import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Search, Calendar, User, Coins, ChevronRight, Filter, SortDesc, SortAsc } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  task_title: string;
  task_detail: string;
  payable_amount: number;
  required_workers: number;
  buyer_name: string;
  completion_date: string;
  task_image_url?: string;
}

type SortOption = 'newest' | 'price-high' | 'price-low' | 'deadline';

export default function TaskList() {
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    async function fetchTasks() {
      try {
        const q = query(
          collection(db, 'tasks'), 
          where('required_workers', '>', 0),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        const taskList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(taskList);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'tasks');
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const getSortedTasks = (items: Task[]) => {
    let sorted = [...items];
    switch (sortBy) {
      case 'price-high':
        return sorted.sort((a, b) => b.payable_amount - a.payable_amount);
      case 'price-low':
        return sorted.sort((a, b) => a.payable_amount - b.payable_amount);
      case 'deadline':
        return sorted.sort((a, b) => new Date(a.completion_date).getTime() - new Date(b.completion_date).getTime());
      case 'newest':
      default:
        return sorted; // Assume Firestore order if no specific secondary sorting is needed
    }
  };

  const filteredTasks = getSortedTasks(
    tasks.filter(task => 
      task.task_title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-0">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight leading-none">Available Tasks</h1>
          <p className="text-neutral-500 font-medium">Earn coins by completing these micro-tasks.</p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title..." 
              className="w-full rounded-2xl border border-neutral-200 py-3 pr-4 pl-11 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 focus:outline-none transition-all font-medium text-sm"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Filter className="absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400" size={18} />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full appearance-none rounded-2xl border border-neutral-200 py-3 pr-4 pl-11 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 focus:outline-none transition-all font-bold text-sm text-neutral-700 bg-white"
            >
              <option value="newest">Latest First</option>
              <option value="price-high">Highest Price</option>
              <option value="price-low">Lowest Price</option>
              <option value="deadline">Nearest Deadline</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-neutral-400 font-bold text-lg italic">No tasks found matching your search.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className="group flex flex-col rounded-[2.5rem] border border-neutral-200 bg-white p-6 transition-all hover:shadow-2xl hover:shadow-orange-100 hover:-translate-y-1"
            >
              <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-[2rem] bg-neutral-100 border border-neutral-100">
                <img 
                  src={task.task_image_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000'} 
                  alt={task.task_title} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute top-4 right-4 rounded-2xl bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-black text-neutral-900 shadow-sm border border-white/50">
                   {task.required_workers} slots
                </div>
              </div>
              
              <div className="flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-orange-600 border border-orange-100">
                    <Coins size={14} className="fill-orange-600" />
                    {task.payable_amount} Coins
                  </span>
                </div>

                <h3 className="text-xl font-black text-neutral-900 line-clamp-1 mb-3 group-hover:text-orange-600 transition-colors">
                  {task.task_title}
                </h3>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-500 uppercase tracking-widest opacity-80">
                    <User size={14} />
                    {task.buyer_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-400 uppercase tracking-widest opacity-70">
                    <Calendar size={14} />
                    Due {task.completion_date}
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/dashboard/worker/task/${task.id}`)}
                  className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 px-6 font-black text-white hover:bg-orange-600 transition-all hover:gap-4 active:scale-95"
                >
                  View Details <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
