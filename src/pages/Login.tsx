import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { useState } from 'react';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Store secret access token as per requirement
      localStorage.setItem('access-token', `secret-task-token-${user.uid}-${Date.now()}`);
      
      // Fetch user role to redirect correctly
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }

      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.email === 'aminboni070@gmail.com' ? 'admin' : userData.role;
        navigate(`/dashboard/${role}`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        alert("Invalid email or password. Please try again.");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Store secret access token as per requirement
      localStorage.setItem('access-token', `secret-task-token-${user.uid}-${Date.now()}`);

      // Check if user exists, if not create default as worker
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }

      if (userDoc && !userDoc.exists()) {
        const role = 'worker';
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          role: role,
          coins: 10,
          createdAt: new Date().toISOString()
        });
        navigate(`/dashboard/${role}`);
      } else {
        const userData = userDoc.data();
        const role = userData.email === 'aminboni070@gmail.com' ? 'admin' : userData.role;
        navigate(`/dashboard/${role}`);
      }
    } catch (error: any) {
      console.error("Google Sign In error:", error);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-neutral-900">Welcome Back</h1>
            <p className="mt-2 text-neutral-500">Log in to manage your tasks and earnings.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-neutral-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  className="w-full rounded-xl border border-neutral-200 py-3 pr-4 pl-10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message as string}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-neutral-700">Password</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-neutral-200 py-3 pr-11 pl-10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-orange-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message as string}</p>}
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-orange-600 py-4 font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Log In'}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-neutral-300">
            <div className="h-px flex-grow bg-neutral-200"></div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Or Login With</span>
            <div className="h-px flex-grow bg-neutral-200"></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 py-4 font-bold text-neutral-700 transition hover:bg-neutral-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="h-5 w-5" />
            Google Sign-In
          </button>

          <p className="mt-8 text-center text-sm text-neutral-500">
            Don't have an account? <Link to="/register" className="font-bold text-orange-600 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
