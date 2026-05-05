import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { uploadImage } from '../../../lib/imgbb';
import { useState } from 'react';
import { PlusCircle, Loader2, Info, Coins } from 'lucide-react';

export default function AddTask() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { dbUser } = useAuth();
  const navigate = useNavigate();

  const watchedWorkers = watch('required_workers');
  const watchedAmount = watch('payable_amount');
  const watchedImage = watch('image');

  const totalPayableAmount = (parseInt(watchedWorkers) || 0) * (parseInt(watchedAmount) || 0);

  const onSubmit = async (data: any) => {
    if (!dbUser) return;
    
    const requiredWorkers = parseInt(data.required_workers);
    const payableAmount = parseInt(data.payable_amount);
    const totalCost = requiredWorkers * payableAmount;

    if (totalCost > dbUser.coins) {
      alert("Not available Coin. Purchase Coin");
      navigate('/dashboard/buyer/purchase');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload task image
      let imageUrl = '';
      if (data.image && data.image[0]) {
        const uploaded = await uploadImage(data.image[0]);
        if (uploaded) imageUrl = uploaded;
      }

      // 2. Atomic Transaction: Deduct coins and create task
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', dbUser.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error("User does not exist!");
        
        const currentCoins = userSnap.data().coins;
        if (currentCoins < totalCost) throw new Error("Insufficient coins during transaction!");

        // Deduct coins
        transaction.update(userRef, { coins: currentCoins - totalCost });

        // Create Task
        const newTaskRef = doc(collection(db, 'tasks'));
        transaction.set(newTaskRef, {
          task_title: data.task_title,
          task_detail: data.task_detail,
          required_workers: requiredWorkers,
          payable_amount: payableAmount,
          completion_date: data.completion_date,
          submission_info: data.submission_info,
          task_image_url: imageUrl,
          buyer_email: dbUser.email,
          buyer_name: dbUser.name,
          buyer_uid: dbUser.uid,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      });

      alert("Task added successfully!");
      navigate('/dashboard/buyer/my-tasks');
    } catch (error: any) {
      console.error("Error creating task:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-neutral-900">Add New Task</h1>
        <p className="text-neutral-500">Create a new opportunity for workers and get your tasks done.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Task Title</label>
                  <input 
                    {...register('task_title', { required: 'Task title is required' })}
                    placeholder="ex: watch my YouTube video and make a comment"
                    className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                  {errors.task_title && <p className="mt-1 text-xs text-red-500 font-medium">{errors.task_title.message as string}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Task Detail</label>
                  <textarea 
                    {...register('task_detail', { required: 'Task detail is required' })}
                    rows={4}
                    placeholder="Enter detailed description of the task..."
                    className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                  {errors.task_detail && <p className="mt-1 text-xs text-red-500 font-medium">{errors.task_detail.message as string}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Required Workers</label>
                  <input 
                    {...register('required_workers', { 
                      required: 'Number of workers is required',
                      min: { value: 1, message: 'Minimum 1 worker' }
                    })}
                    type="number"
                    placeholder="ex. 100"
                    className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:border-orange-500 transition-all"
                  />
                  {errors.required_workers && <p className="mt-1 text-xs text-red-500 font-medium">{errors.required_workers.message as string}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Payable Amount (per worker)</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                    <input 
                      {...register('payable_amount', { 
                        required: 'Payable amount is required',
                        min: { value: 1, message: 'Minimum 1 coin' }
                      })}
                      type="number"
                      placeholder="ex. 10"
                      className="w-full rounded-xl border border-neutral-200 py-3 pr-4 pl-10 focus:border-orange-500 transition-all"
                    />
                  </div>
                  {errors.payable_amount && <p className="mt-1 text-xs text-red-500 font-medium">{errors.payable_amount.message as string}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Completion Date</label>
                  <input 
                    {...register('completion_date', { required: 'Completion date is required' })}
                    type="date"
                    className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:border-orange-500 transition-all"
                  />
                  {errors.completion_date && <p className="mt-1 text-xs text-red-500 font-medium">{errors.completion_date.message as string}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Task Image</label>
                  <input 
                    {...register('image', { required: 'Task image is required' })}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm focus:border-orange-500 transition-all file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-1 file:text-xs file:font-black file:text-orange-600 hover:file:bg-orange-100"
                  />
                  {errors.image && <p className="mt-1 text-xs text-red-500 font-medium">{errors.image.message as string}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-neutral-700">Submission Info</label>
                  <textarea 
                    {...register('submission_info', { required: 'Submission info is required' })}
                    rows={2}
                    placeholder="What should workers submit as proof? (ex: screenshot of comment)"
                    className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:border-orange-500 transition-all"
                  />
                  {errors.submission_info && <p className="mt-1 text-xs text-red-500 font-medium">{errors.submission_info.message as string}</p>}
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-orange-600 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 hover:shadow-orange-300 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><PlusCircle size={22} /> Add Task</>}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-black text-neutral-900">Task Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-neutral-500">Available Coins</span>
                <span className="text-neutral-900 font-bold">{dbUser?.coins || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-neutral-500">Total Payable</span>
                <span className={`font-black ${totalPayableAmount > (dbUser?.coins || 0) ? 'text-red-500' : 'text-orange-600'}`}>
                  {totalPayableAmount}
                </span>
              </div>
              <div className="h-px bg-neutral-100" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-neutral-900">Balance After</span>
                <span className={`text-lg font-black ${dbUser?.coins && dbUser.coins - totalPayableAmount < 0 ? 'text-red-500' : 'text-neutral-900'}`}>
                  {(dbUser?.coins || 0) - totalPayableAmount}
                </span>
              </div>
            </div>

            {totalPayableAmount > (dbUser?.coins || 0) && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-700 border border-red-100 animate-pulse">
                <Info size={20} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold leading-relaxed">
                  You don't have enough coins. Please purchase more to add this task.
                </p>
              </div>
            )}
          </div>

          {imagePreview && (
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm overflow-hidden">
              <h3 className="mb-4 text-lg font-black text-neutral-900">Image Preview</h3>
              <img 
                src={imagePreview} 
                alt="Task Preview" 
                className="w-full aspect-video rounded-2xl object-cover border-2 border-orange-100" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
