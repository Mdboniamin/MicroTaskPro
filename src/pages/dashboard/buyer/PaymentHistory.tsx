import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, Calendar, Coins } from 'lucide-react';

export default function PaymentHistory() {
  const { dbUser } = useAuth();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['paymentHistory', dbUser?.email],
    queryFn: async () => {
      const q = query(
        collection(db, 'payments'), 
        where('email', '==', dbUser?.email),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!dbUser?.email,
  });

  if (isLoading) return <div>Loading payment history...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Payment History</h1>
        <p className="text-neutral-500">View all your coin purchases.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Coins Purchased</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Amount Paid</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payments?.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-neutral-500 uppercase">{payment.paymentIntentId || payment.id}</td>
                  <td className="px-6 py-4 text-neutral-600 font-medium">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-neutral-400" />
                        {new Date(payment.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-orange-600">
                        <Coins size={14} className="fill-orange-600" />
                        {payment.coins}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-neutral-900">${payment.price}.00</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-tighter text-green-700">
                      success
                    </span>
                  </td>
                </tr>
              ))}
              {payments?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 italic">No payment history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
