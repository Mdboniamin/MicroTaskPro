import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import BuyerHome from './BuyerHome';
import AddTask from './AddTask';
import MyTasks from './MyTasks';
import PurchaseCoins from './PurchaseCoins';
import PaymentHistory from './PaymentHistory';
import Profile from '../Profile';

export default function BuyerDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<BuyerHome />} />
        <Route path="add-task" element={<AddTask />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="purchase" element={<PurchaseCoins />} />
        <Route path="payment-history" element={<PaymentHistory />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </DashboardLayout>
  );
}
