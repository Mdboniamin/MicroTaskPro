import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { uploadImage } from '../lib/imgbb';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Coins, User, Mail, Lock, Camera, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, dbUser } = useAuth();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && dbUser) {
      const role = dbUser.email === 'aminboni070@gmail.com' ? 'admin' : dbUser.role;
      navigate(`/dashboard/${role}`);
    }
  }, [user, dbUser, navigate]);

  const watchedImage = watch('image');

  useEffect(() => {
    if (watchedImage && watchedImage[0]) {
      const file = watchedImage[0];
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [watchedImage]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { name, email, password, role, image } = data;
      
      // Upload image to ImgBB
      let imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
      if (image && image[0]) {
        const uploaded = await uploadImage(image[0]);
        if (uploaded) {
          imageUrl = uploaded;
        }
      }
      
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, { displayName: name, photoURL: imageUrl });

      // Save to Firestore
      const isAdmin = email === 'aminboni070@gmail.com';
      const actualRole = isAdmin ? 'admin' : role;
      const coins = actualRole === 'worker' ? 10 : (actualRole === 'admin' ? 1000 : 50);
      
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        photo: imageUrl,
        role: actualRole,
        coins,
        createdAt: new Date().toISOString()
      });

      // Store secret access token as per requirement
      localStorage.setItem('access-token', `secret-task-token-${user.uid}-${Date.now()}`);

      // Show specific success message
      alert(`Registration successful! You've received ${coins} starting coins.`);

      navigate(`/dashboard/${role}`);
    } catch (error: any) {
      console.error("Register error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("This email is already registered. Please try logging in instead.");
      } else if (error.code === 'auth/weak-password') {
        alert("Password is too weak. Please use a stronger password.");
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
      
      // Default as worker for social login if not already exists
      const isAdmin = user.email === 'aminboni070@gmail.com';
      const role = isAdmin ? 'admin' : 'worker'; 
      const coins = role === 'admin' ? 1000 : 10;

      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        role: role,
        coins: coins,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Store secret access token as per requirement
      localStorage.setItem('access-token', `secret-task-token-${user.uid}-${Date.now()}`);

      navigate(`/dashboard/${role}`);
    } catch (error: any) {
      console.error("Google Sign In error:", error);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-neutral-900">Create Account</h1>
            <p className="mt-2 text-neutral-500">Join the micro-task revolution today.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-neutral-700">Full Name</label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  {...register('name', { required: 'Name is required' })}
                  className="w-full rounded-xl border border-neutral-200 py-3 pr-4 pl-10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-neutral-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  type="email"
                  className="w-full rounded-xl border border-neutral-200 py-3 pr-4 pl-10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-neutral-700">Password</label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    {...register('password', { 
                      required: 'Password is required', 
                      minLength: { value: 8, message: "Minimum 8 characters" },
                      validate: {
                        strength: (value) => 
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/.test(value) || 
                          "Must include uppercase, lowercase, number and symbol"
                      }
                    })}
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-neutral-200 py-3 pr-10 pl-10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
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
                {errors.password && <p className="mt-1 text-[10px] text-red-500 leading-tight">{errors.password.message as string}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-neutral-700">Select Role</label>
                <select 
                   {...register('role', { required: 'Role is required' })}
                   className="w-full rounded-xl border border-neutral-200 py-3 pr-4 pl-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                >
                  <option value="worker">Worker</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700">Profile Photo</label>
              <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:border-orange-400">
                {/* Unified hidden input for validation stability */}
                <input 
                  {...register('image', { required: 'Profile photo is required' })}
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 z-20 cursor-pointer opacity-0"
                />

                {!preview ? (
                  <div className="relative flex h-[50px] items-center px-4">
                    <Camera className="mr-3 text-neutral-400" size={18} />
                    <span className="text-sm font-medium text-neutral-500">Click to upload profile picture</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-6 bg-orange-50/30">
                    <div className="relative mb-4 z-30">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl ring-1 ring-orange-100" 
                      />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreview(null);
                          setValue('image', null);
                        }}
                        className="absolute -right-1 -top-1 rounded-full bg-white p-1.5 text-red-500 shadow-md transition hover:scale-110 active:scale-95"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="relative">
                      <span className="text-xs font-bold text-orange-600 hover:underline">Change Photo</span>
                    </div>
                  </div>
                )}
              </div>
              {errors.image && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.image.message as string}</p>}
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-orange-600 py-4 font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-neutral-300">
            <div className="h-px flex-grow bg-neutral-200"></div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Or Register With</span>
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
            Already have an account? <Link to="/login" className="font-bold text-orange-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
