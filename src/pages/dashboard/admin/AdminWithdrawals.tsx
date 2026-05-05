import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { sendSimulatedEmail, EMAIL_TEMPLATES } from '../../../lib/email';

export default function AdminWithdrawals() {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: withdrawals, refetch } = useQuery({
    queryKey: ['adminWithdrawals'],
    queryFn: async () => {
      const q = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const handleApprove = async (withdrawal: any) => {
    if (!window.confirm("Approve this withdrawal? Coins will be deducted from user balance.")) return;
    
    setProcessingId(withdrawal.id);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get worker ref
        const workers = await getDocs(query(collection(db, 'users'), where('email', '==', withdrawal.worker_email)));
        if (workers.empty) throw new Error("Worker not found");
        const workerRef = doc(db, 'users', workers.docs[0].id);
        const workerSnap = await transaction.get(workerRef);
        
        if (workerSnap.data()?.coins < withdrawal.withdrawal_coin) {
            throw new Error("Worker has insufficient coins now!");
        }

        // 2. Deduct coins from worker
        transaction.update(workerRef, { coins: increment(-withdrawal.withdrawal_coin) });

        // 3. Mark withdrawal as approved
        transaction.update(doc(db, 'withdrawals', withdrawal.id), { status: 'approved' });

        // 4. Create notification for worker
        const noteRef = doc(collection(db, 'notifications'));
        transaction.set(noteRef, {
          message: `Your withdrawal of $${withdrawal.withdrawal_amount} has been approved!`,
          toEmail: withdrawal.worker_email,
          actionRoute: '/dashboard/worker/withdraw',
          time: new Date().toISOString(),
          read: false,
          isRead: false
        });
      });

      // Send simulated email
      const template = EMAIL_TEMPLATES.WITHDRAWAL_APPROVED(withdrawal.withdrawal_coin);
      await sendSimulatedEmail(withdrawal.worker_email, template.subject, template.body);

      refetch();
      alert("Withdrawal approved and coins deducted! Email notification simulated.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Withdrawal Requests</h1>
        <p className="text-neutral-500 font-medium">Approve and process payout requests from workers.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                <th className="px-6 py-5">Worker Entity</th>
                <th className="px-6 py-5">Economic Value</th>
                <th className="px-6 py-5">Channel</th>
                <th className="px-6 py-5">Transaction ID / Account</th>
                <th className="px-6 py-5">Request Date</th>
                <th className="px-6 py-5 text-center">Protocol Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {withdrawals?.map((w: any) => (
                <tr key={w.id} className="hover:bg-neutral-50/20 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-black text-neutral-900">{w.worker_name}</div>
                    <div className="text-sm font-medium text-neutral-400">{w.worker_email}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-orange-600">{w.withdrawal_coin} Coins</div>
                    <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">${w.withdrawal_amount}.00 USD</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
                      {w.payment_system}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-neutral-500 font-mono text-xs font-bold">{w.account_number}</td>
                  <td className="px-6 py-5 text-neutral-400 text-xs font-medium">
                    {new Date(w.withdraw_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleApprove(w)}
                      className="inline-flex h-10 px-4 items-center justify-center gap-2 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {processingId === w.id ? (
                        <Loader2 className="h-4 w-4 animate-spin"/>
                      ) : (
                        <>
                          <Check size={14} />
                          Payment Success
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {withdrawals?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-neutral-400">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-neutral-50 flex items-center justify-center">
                            <Check className="text-neutral-200" size={24} />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest italic">All requests processed.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
