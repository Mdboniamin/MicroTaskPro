import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ListTodo, CheckSquare, Wallet, PlusCircle, Users, Bell, LogOut, User, LucideIcon, Coins, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from '../../components/NotificationCenter';

interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const workerItems: SidebarItem[] = [
  { label: 'Home', path: '/dashboard/worker', icon: LayoutDashboard },
  { label: 'Browse Tasks', path: '/dashboard/worker/tasks', icon: ListTodo },
  { label: 'My Submissions', path: '/dashboard/worker/submissions', icon: CheckSquare },
  { label: 'Withdraw Earnings', path: '/dashboard/worker/withdraw', icon: Wallet },
  { label: 'Profile', path: '/dashboard/worker/profile', icon: User },
];

const buyerItems: SidebarItem[] = [
  { label: 'Home', path: '/dashboard/buyer', icon: LayoutDashboard },
  { label: 'Add New Task', path: '/dashboard/buyer/add-task', icon: PlusCircle },
  { label: 'My Tasks', path: '/dashboard/buyer/my-tasks', icon: ListTodo },
  { label: 'Purchase Coins', path: '/dashboard/buyer/purchase', icon: Wallet },
  { label: 'Payment History', path: '/dashboard/buyer/payment-history', icon: CheckSquare },
  { label: 'Profile', path: '/dashboard/buyer/profile', icon: User },
];

const adminItems: SidebarItem[] = [
  { label: 'Home', path: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Manage Users', path: '/dashboard/admin/users', icon: Users },
  { label: 'Manage Tasks', path: '/dashboard/admin/tasks', icon: ListTodo },
  { label: 'Withdrawal Requests', path: '/dashboard/admin/withdrawals', icon: Wallet },
  { label: 'Manage Reports', path: '/dashboard/admin/reports', icon: AlertTriangle },
  { label: 'Profile', path: '/dashboard/admin/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, logout } = useAuth();
  const location = useLocation();

  const getItems = () => {
    if (!dbUser) return [];
    if (dbUser.email === 'aminboni070@gmail.com' || dbUser.role === 'admin') return adminItems;
    if (dbUser.role === 'worker') return workerItems;
    if (dbUser.role === 'buyer') return buyerItems;
    return adminItems;
  };

  const navItems = getItems();

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-neutral-50 lg:flex-row flex-col">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 border-r border-neutral-200 bg-white lg:block flex-shrink-0">
        <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-6 border-b border-neutral-100 hidden lg:flex items-center gap-2">
              <Coins size={32} className="text-orange-600" />
              <span className="text-xl font-black tracking-tight">MicroTask<span className="text-orange-600">Pro</span></span>
            </div>

            <nav className="flex-grow space-y-1 p-4 lg:block flex flex-row lg:space-x-0 space-x-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all whitespace-nowrap ${
                    isActive 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                </Link>
                );
            })}
            </nav>
            
            <button 
                onClick={() => logout()}
                className="mt-8 hidden lg:flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
            >
                <LogOut size={20} />
                <span>Logout</span>
            </button>

            <div className="mt-auto pt-8 border-t border-neutral-100 hidden lg:block">
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                &copy; 2026 MicroTaskPro
              </p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-x-hidden">
        {/* Dashboard Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-neutral-200 bg-white px-8">
            {/* Logo Section (Visible on all screens in header for consistency with diagram) */}
            <div className="flex items-center gap-2">
              <Coins size={32} className="text-orange-600" />
              <span className="text-xl font-black tracking-tight hidden sm:block">MicroTask<span className="text-orange-600">Pro</span></span>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-8">
              {/* Available Coins */}
              <Link 
                to={dbUser?.role === 'buyer' ? '/dashboard/buyer/purchase' : dbUser?.role === 'worker' ? '/dashboard/worker/withdraw' : '/dashboard/admin/withdrawals'}
                className="flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-2 text-orange-600 border border-orange-100 shadow-sm hover:bg-orange-100 transition-colors"
              >
                <Coins size={18} className="fill-orange-600" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Balance</span>
                  <span className="text-sm font-black">{dbUser?.coins || 0}</span>
                </div>
              </Link>

              {/* User Identity */}
              <Link to={location.pathname.startsWith('/dashboard/admin') ? '/dashboard/admin/profile' : location.pathname.includes('/buyer') ? '/dashboard/buyer/profile' : '/dashboard/worker/profile'} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img 
                  src={dbUser?.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
                  alt="Avatar" 
                  className="h-10 w-10 rounded-full border-2 border-orange-100 object-cover shadow-sm"
                />
                <div className="text-left hidden md:block leading-tight">
                  <div className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                    {dbUser?.email === 'aminboni070@gmail.com' ? 'admin' : dbUser?.role}
                  </div>
                  <div className="text-sm font-bold text-neutral-900">{dbUser?.name}</div>
                </div>
              </Link>

              <div className="h-8 w-px bg-neutral-200"></div>

              {/* Notification Center */}
              <NotificationCenter />
            </div>
        </header>

        <div className="p-4 sm:p-8">
            <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
        </div>
      </main>
    </div>
  );
}
