import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import WorkerHome from './WorkerHome';
import TaskList from './TaskList';
import TaskDetails from './TaskDetails';
import MySubmissions from './MySubmissions';
import WithdrawForm from './WithdrawForm';
import Profile from '../Profile';

export default function WorkerDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<WorkerHome />} />
        <Route path="tasks" element={<TaskList />} />
        <Route path="task/:id" element={<TaskDetails />} />
        <Route path="submissions" element={<MySubmissions />} />
        <Route path="withdraw" element={<WithdrawForm />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </DashboardLayout>
  );
}
