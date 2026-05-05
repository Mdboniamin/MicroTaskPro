import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coins, LogOut, Menu, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import NotificationCenter from './NotificationCenter';
import { db } from '../lib/firebase';

export default function Navbar() {
  const { user, dbUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [newGithubUrl, setNewGithubUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!dbUser) return '/';
    if (dbUser.email === 'aminboni070@gmail.com') return '/dashboard/admin';
    return `/dashboard/${dbUser.role}`;
  };

  const getProfileLink = () => {
    return `${getDashboardLink()}/profile`;
  };

  const githubUrl = dbUser?.githubUrl;

  const handleJoinDeveloper = (e: React.MouseEvent) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (githubUrl) {
      window.open(githubUrl, '_blank', 'noopener,noreferrer');
    } else {
      e.preventDefault();
      setIsGithubModalOpen(true);
    }
  };

  const handleSaveGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser || !newGithubUrl) return;
    
    // Simple validation
    if (!newGithubUrl.toLowerCase().includes('github.com')) {
      alert("Please enter a valid GitHub profile URL");
      return;
    }

    setIsSaving(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', dbUser.uid);
      await updateDoc(userRef, { githubUrl: newGithubUrl });
      setIsGithubModalOpen(false);
      window.open(newGithubUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Error saving github url:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
            <Coins size={20} />
          </div>
          <span>MicroTask<span className="text-orange-600">Pro</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-6">
          {user ? (
            <>
              <Link to={getDashboardLink()} className="text-sm font-medium text-neutral-600 hover:text-orange-600">Dashboard</Link>
              
              {dbUser?.role === 'buyer' ? (
                <Link 
                  to="/dashboard/buyer/purchase" 
                  className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-orange-700 transition hover:bg-orange-100" 
                  title="Buy More Coins"
                >
                  <Coins size={14} className="fill-orange-600" />
                  <span className="text-sm font-bold">{dbUser?.coins || 0}</span>
                </Link>
              ) : dbUser?.role === 'worker' ? (
                <Link 
                  to="/dashboard/worker/withdraw" 
                  className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-orange-700 transition hover:bg-orange-100" 
                  title="Withdraw Coins"
                >
                  <Coins size={14} className="fill-orange-600" />
                  <span className="text-sm font-bold">{dbUser?.coins || 0}</span>
                </Link>
              ) : (
                <Link 
                  to="/dashboard/admin/withdrawals"
                  className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-orange-700 transition hover:bg-orange-100" 
                  title="Manage Withdrawals"
                >
                  <Coins size={14} className="fill-orange-600" />
                  <span className="text-sm font-bold">{dbUser?.coins || 0}</span>
                </Link>
              )}

              <div className="flex items-center gap-4 border-l border-neutral-200 pl-4">
                {/* Notifications */}
                <NotificationCenter />

                <Link to={getProfileLink()} title="My Profile" className="flex items-center gap-2">
                  <img 
                    src={dbUser?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                    alt="profile" 
                    className="h-8 w-8 rounded-full border border-neutral-200 object-cover transition-transform hover:scale-110"
                  />
                  <span className="text-sm font-medium text-neutral-700">{dbUser?.name || 'User'}</span>
                </Link>
                <button onClick={handleLogout} className="text-neutral-600 hover:text-red-600" title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-orange-600">Login</Link>
              <Link 
                to="/register" 
                className="rounded-full bg-orange-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-700 active:scale-95"
              >
                Register
              </Link>
            </>
          )}

          <button 
            onClick={handleJoinDeveloper}
            className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Join as Developer
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-4 md:hidden">
          {user && <NotificationCenter />}

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-neutral-600 hover:text-orange-600"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-neutral-200 bg-white md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {user ? (
                <>
                  <Link to={getDashboardLink()} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-600 hover:bg-orange-50 hover:text-orange-600">Dashboard</Link>
                  
                  {dbUser?.role === 'buyer' ? (
                    <Link 
                      to="/dashboard/buyer/purchase" 
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-orange-600 hover:bg-orange-50"
                    >
                      <Coins size={18} />
                      <span className="font-bold">{dbUser?.coins || 0} Coins (Buy More)</span>
                    </Link>
                  ) : dbUser?.role === 'worker' ? (
                    <Link 
                      to="/dashboard/worker/withdraw" 
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-orange-600 hover:bg-orange-50"
                    >
                      <Coins size={18} />
                      <span className="font-bold">{dbUser?.coins || 0} Coins (Withdraw)</span>
                    </Link>
                  ) : (
                    <Link 
                      to="/dashboard/admin/withdrawals" 
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-orange-600 hover:bg-orange-50"
                    >
                      <Coins size={18} />
                      <span className="font-bold">{dbUser?.coins || 0} Coins (Manage)</span>
                    </Link>
                  )}
                  
                  <Link to={getProfileLink()} className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-neutral-600 hover:bg-orange-50 hover:text-orange-600">
                    <User size={18} />
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
                  <Link to="/login" className="flex items-center justify-center rounded-md border border-neutral-200 py-2 text-sm font-medium text-neutral-600">Login</Link>
                  <Link to="/register" className="flex items-center justify-center rounded-md bg-orange-600 py-2 text-sm font-medium text-white">Register</Link>
                </div>
              )}
              
              <button 
                onClick={handleJoinDeveloper}
                className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-neutral-600 hover:bg-orange-50 hover:text-orange-600"
              >
                Join as Developer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* GitHub URL Modal */}
      <AnimatePresence>
        {isGithubModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                </div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Add GitHub Profile</h2>
                <p className="mt-2 text-neutral-500 font-medium">Link your GitHub account to join our expert developer network.</p>
              </div>

              <form onSubmit={handleSaveGithub} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-700">GitHub URL</label>
                  <input 
                    type="url"
                    required
                    value={newGithubUrl}
                    onChange={(e) => setNewGithubUrl(e.target.value)}
                    placeholder="https://github.com/your-username"
                    className="w-full rounded-2xl border border-neutral-200 py-4 px-6 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsGithubModalOpen(false)}
                    className="flex-1 rounded-2xl py-4 font-black text-neutral-500 hover:bg-neutral-50 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 font-black text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-100 uppercase tracking-widest text-xs"
                  >
                    {isSaving ? 'Saving...' : 'Save & Join'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
