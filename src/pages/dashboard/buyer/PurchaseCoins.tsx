import { useState } from 'react';
import StripeProvider from '../../../components/StripeProvider';
import CheckoutForm from './CheckoutForm';
import { Coins, Package } from 'lucide-react';

const coinPackages = [
  { coins: 10, price: 1 },
  { coins: 150, price: 10 },
  { coins: 500, price: 20 },
  { coins: 1000, price: 35 },
];

export default function PurchaseCoins() {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Purchase Coins</h1>
        <p className="text-neutral-500">Add coins to your balance for posting tasks. $1 = 10 Coins.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {coinPackages.map((pkg, i) => (
          <button 
            key={i}
            onClick={() => setSelectedPackage(pkg)}
            className={`group relative flex flex-col items-center justify-center rounded-3xl border-2 p-8 transition-all ${
              selectedPackage?.coins === pkg.coins 
                ? 'border-orange-600 bg-orange-50' 
                : 'border-neutral-200 bg-white hover:border-orange-200'
            }`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform">
              <Coins size={28} className="fill-orange-600" />
            </div>
            <div className="text-2xl font-black text-neutral-900">{pkg.coins} Coins</div>
            <div className="mt-1 font-bold text-neutral-500">${pkg.price}.00 USD</div>
            
            {selectedPackage?.coins === pkg.coins && (
              <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center text-white">
                <Package size={14} />
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedPackage && (
        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8">
            <h2 className="mb-6 text-xl font-bold">Secure Checkout</h2>
            <StripeProvider>
              <CheckoutForm pkg={selectedPackage} onSuccess={() => setSelectedPackage(null)} />
            </StripeProvider>
          </div>
        </div>
      )}
    </div>
  );
}
