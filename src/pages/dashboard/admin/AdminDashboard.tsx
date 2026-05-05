import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import AdminHome from './AdminHome';
import ManageUsers from './ManageUsers';
import ManageTasks from './ManageTasks';
import AdminWithdrawals from './AdminWithdrawals';
import ManageReports from './ManageReports';
import Profile from '../Profile';

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="tasks" element={<ManageTasks />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="reports" element={<ManageReports />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </DashboardLayout>
  );
}
