import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Bell, Clock, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dbUser?.email) return;

    const q = query(
      collection(db, 'notifications'), 
      where('toEmail', '==', dbUser.email),
      orderBy('time', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [dbUser?.email]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read && !n.isRead).length;

  const handleToggle = async () => {
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    
    if (newStatus && unreadCount > 0) {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.read || !n.isRead) {
          batch.update(doc(db, 'notifications', n.id), { read: true, isRead: true });
        }
      });
      await batch.commit();
    }
  };

  const handleNotifClick = (n: any) => {
    setIsOpen(false);
    if (n.actionRoute) {
      navigate(n.actionRoute);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={handleToggle}
        className="relative flex items-center justify-center rounded-full border border-neutral-200 p-2.5 text-neutral-500 transition-all hover:bg-neutral-50 hover:text-orange-600 hover:border-orange-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-orange-600 border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-1 ring-orange-100">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="absolute right-0 mt-3 z-50 w-80 lg:w-96 rounded-[2.5rem] border border-neutral-100 bg-white p-6 shadow-2xl shadow-neutral-200/50"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <h4 className="text-lg font-black text-neutral-900 tracking-tight">Notifications</h4>
                 {unreadCount > 0 && (
                   <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                     {unreadCount} NEW
                   </span>
                 )}
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[450px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-400 font-bold flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-3xl bg-neutral-50 flex items-center justify-center">
                    <Bell size={32} className="opacity-20" />
                  </div>
                  <p className="uppercase tracking-widest text-[10px]">All caught up!</p>
                </div>
              ) : (
                notifications.map((note) => (
                  <button 
                    key={note.id}
                    onClick={() => handleNotifClick(note)}
                    className={`group w-full text-left p-4 rounded-3xl border transition-all duration-300 ${
                      note.read ? 'border-neutral-50 bg-neutral-50/20 opacity-80' : 'border-orange-100 bg-orange-50/30'
                    } hover:border-orange-300 hover:bg-white hover:shadow-lg hover:shadow-orange-100 hover:translate-x-1`}
                  >
                    <p className="text-sm font-bold text-neutral-800 leading-snug group-hover:text-neutral-900">
                      {note.message}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        <Clock size={12} strokeWidth={2.5} />
                        {new Date(note.time).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {note.actionRoute && (
                        <ChevronRight size={14} className="text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
