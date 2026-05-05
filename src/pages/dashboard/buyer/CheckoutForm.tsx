import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Loader2, CreditCard } from 'lucide-react';
import { StripeCardElement } from '@stripe/stripe-js';

export default function CheckoutForm({ pkg, onSuccess }: { pkg: any, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { dbUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) return;

    setLoading(true);
    setError(null);

    // Dummy Payment Fallback if Stripe is not initialized
    const isStripeActive = !!stripe && !!elements && !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    try {
      if (!isStripeActive) {
        // Simulate background delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update Coins & Record Payment
        const userRef = doc(db, 'users', dbUser.uid);
        await updateDoc(userRef, {
          coins: increment(pkg.coins)
        });

        await addDoc(collection(db, 'payments'), {
          email: dbUser.email,
          coins: pkg.coins,
          price: pkg.price,
          paymentIntentId: 'demo_' + Math.random().toString(36).substring(7),
          date: new Date().toISOString(),
          status: 'success',
          isDemo: true
        });

        alert(`Demo Payment Success! Added ${pkg.coins} coins.`);
        onSuccess();
        return;
      }

      const cardElement = elements?.getElement(CardElement);
      if (!cardElement) {
        setLoading(false);
        return;
      }
      
      // 1. Create Payment Intent
      const { data } = await axios.post('/api/create-payment-intent', { amount: pkg.price });
      const clientSecret = data.clientSecret;

      // 2. Confirm Payment
      const result = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement as any,
          billing_details: {
            name: dbUser.name,
            email: dbUser.email,
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent.status === 'succeeded') {
        const userRef = doc(db, 'users', dbUser.uid);
        await updateDoc(userRef, {
          coins: increment(pkg.coins)
        });

        await addDoc(collection(db, 'payments'), {
          email: dbUser.email,
          coins: pkg.coins,
          price: pkg.price,
          paymentIntentId: result.paymentIntent.id,
          date: new Date().toISOString()
        });

        alert(`Successfully purchased ${pkg.coins} coins!`);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isDemo = !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isDemo ? (
        <div className="rounded-xl border border-neutral-200 p-4">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1a1a1a',
                  '::placeholder': { color: '#aab7c4' },
                },
                invalid: { color: '#dc2626' },
              },
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-orange-50 p-6 border border-orange-100 flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <CreditCard size={24} />
          </div>
          <div>
            <h4 className="font-black text-orange-950">Demo Payment Mode</h4>
            <p className="text-xs text-orange-800 opacity-80">Stripe keys are not configured. Use this button to simulate a successful payment for testing.</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <button 
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 font-black text-white shadow-lg transition hover:bg-black active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <>{!isDemo ? <><CreditCard size={18} /> Pay ${pkg.price}.00</> : 'Confirm Test Payment Packet'}</>}
      </button>
    </form>
  );
}
