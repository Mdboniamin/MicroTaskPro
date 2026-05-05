import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Clean up previous listener if it exists
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setDbUser({ uid: docSnap.id, ...docSnap.data() });
          } else {
            setDbUser(null);
          }
          setLoading(false);
        }, (error) => {
          // If we're logged out, ignore the error as it's expected
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          }
          setLoading(false);
        });
      } else {
        setDbUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
