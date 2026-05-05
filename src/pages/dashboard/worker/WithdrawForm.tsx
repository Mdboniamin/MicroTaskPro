import { useForm } from 'react-hook-form';
import { useAuth } from '../../../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Wallet, Info, Loader2, Coins, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

export default function WithdrawForm() {
  const { dbUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      withdrawal_coin: 200,
      payment_system: 'bkash',
      account_number: ''
    }
  });

  const coinsToWithdraw = watch('withdrawal_coin');
  const usdAmount = coinsToWithdraw ? Math.floor(Number(coinsToWithdraw) / 20) : 0;
  const totalBalanceUsd = Math.floor((dbUser?.coins || 0) / 20);

  const onSubmit = async (data: any) => {
    if (!dbUser) return;
    
    const withdrawalCoins = Number(data.withdrawal_coin);

    if (dbUser.coins < withdrawalCoins) {
      alert("Insufficient coins for this withdrawal.");
      return;
    }

    if (withdrawalCoins < 200) {
        alert("Minimum withdrawal is 200 coins.");
        return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        worker_email: dbUser.email,
        worker_name: dbUser.name,
        withdrawal_coin: withdrawalCoins,
        withdrawal_amount: Math.floor(withdrawalCoins / 20),
        payment_system: data.payment_system,
        account_number: data.account_number,
        withdraw_date: new Date().toISOString(),
        status: 'pending'
      });

      alert("Withdrawal request submitted successfully!");
      reset();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const hasEnoughCoins = (dbUser?.coins || 0) >= 200;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Withdraw Earnings</h1>
        <p className="text-neutral-500 font-medium">Convert your effort into real-world currency.</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Coins size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Available Coins</p>
              <h3 className="text-2xl font-black text-neutral-900">{dbUser?.coins || 0}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Withdrawal Amount</p>
              <h3 className="text-2xl font-black text-neutral-900">${totalBalanceUsd}.00</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 md:p-10 shadow-sm overflow-hidden relative">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700 uppercase tracking-wider">Coins To Withdraw</label>
                <input 
                  {...register('withdrawal_coin', { 
                    required: "Amount is required", 
                    min: { value: 200, message: "Minimum 200 coins" },
                    max: { value: dbUser?.coins || 0, message: "Exceeds available balance" }
                  })}
                  type="number"
                  placeholder="Min. 200"
                  className="w-full rounded-2xl border border-neutral-200 py-4 px-6 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all outline-none font-bold text-lg"
                />
                {errors.withdrawal_coin && <p className="mt-2 text-xs font-bold text-red-500 uppercase tracking-widest">{errors.withdrawal_coin.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700 uppercase tracking-wider">Withdraw Amount ($)</label>
                <div 
                  className="w-full flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 py-4 px-6 font-black text-neutral-900 text-lg opacity-70"
                >
                  <span>${usdAmount}.00</span>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">Rate: 20 Coins = $1</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700 uppercase tracking-wider">Payment System</label>
                <select 
                  {...register('payment_system', { required: true })}
                  className="w-full rounded-2xl border border-neutral-200 py-4 px-6 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all outline-none font-bold"
                >
                  <option value="stripe">Stripe</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700 uppercase tracking-wider">Account Number</label>
                <input 
                  {...register('account_number', { required: "Account number is required" })}
                  placeholder="Wallet ID / Account No."
                  className="w-full rounded-2xl border border-neutral-200 py-4 px-6 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all outline-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-3xl bg-blue-50/50 p-6 border border-blue-100">
            <Info size={20} className="mt-1 flex-shrink-0 text-blue-600" />
            <div className="text-sm">
              <p className="font-black text-blue-900 uppercase tracking-widest mb-1">Processing Info</p>
              <p className="text-blue-700 font-medium leading-relaxed">Withdrawal requests are processed manually by admins. Once approved, coins will be deducted from your balance and payment will be sent to your account.</p>
            </div>
          </div>

          {hasEnoughCoins ? (
            <button 
              disabled={loading}
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-orange-600 py-5 font-black text-white shadow-xl shadow-orange-100 transition hover:bg-orange-700 hover:shadow-orange-200 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : 'Request Withdrawal'}
            </button>
          ) : (
            <div className="w-full text-center py-6 rounded-3xl border-2 border-dashed border-red-100 bg-red-50/30">
              <p className="text-lg font-black text-red-500 uppercase tracking-widest">Insufficient coin</p>
              <p className="text-xs font-bold text-red-400 mt-1 uppercase tracking-widest">Minimum 200 coins required to withdraw</p>
            </div>
          )}
        </form>

        <Wallet size={120} className="absolute -bottom-10 -right-10 text-neutral-900 opacity-[0.03] pointer-events-none rotate-12" />
      </div>
    </motion.div>
  );
}
