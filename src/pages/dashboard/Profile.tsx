import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { uploadImage } from '../../lib/imgbb';
import { User, Camera, Loader2, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { dbUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: dbUser?.name || '',
      githubUrl: dbUser?.githubUrl || '',
    }
  });

  const onSubmit = async (data: any) => {
    if (!auth.currentUser || !dbUser) return;
    
    setLoading(true);
    setSuccess(false);
    try {
      let imageUrl = dbUser.photo;
      
      // 1. Handle Image Upload if new file selected
      if (data.image && data.image[0]) {
        const uploaded = await uploadImage(data.image[0]);
        if (uploaded) imageUrl = uploaded;
      }

      // 2. Update Firebase Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: data.name,
        photoURL: imageUrl
      });

      // 3. Update Firestore User Document
      const userRef = doc(db, 'users', dbUser.uid);
      await updateDoc(userRef, {
        name: data.name,
        photo: imageUrl,
        githubUrl: data.githubUrl
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Profile update error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-neutral-900">Profile Settings</h1>
        <p className="text-neutral-500">Update your personal information and profile picture.</p>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-4 border-b border-neutral-100 pb-8 sm:flex-row">
            <div className="relative">
              <img 
                src={dbUser?.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
                alt="profile" 
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
              />
              <div className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg">
                <Camera size={14} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">{dbUser?.name}</h3>
              <p className="text-sm text-neutral-500">{dbUser?.email}</p>
              <span className="mt-2 inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-600">
                {dbUser?.email === 'aminboni070@gmail.com' ? 'admin' : dbUser?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-neutral-700">Display Name</label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  {...register('name', { required: 'Name is required' })}
                  className="w-full rounded-xl border border-neutral-200 py-3 pr-4 pl-10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  placeholder="Your Name"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-neutral-700">GitHub Profile URL</label>
              <div className="relative">
                <div className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                </div>
                <input 
                  {...register('githubUrl', { 
                    pattern: {
                      value: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
                      message: 'Please enter a valid GitHub profile URL'
                    }
                  })}
                  className="w-full rounded-xl border border-neutral-200 py-3 pr-4 pl-10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  placeholder="https://github.com/your-username"
                />
              </div>
              {errors.githubUrl && <p className="mt-1 text-xs text-red-500">{errors.githubUrl.message as string}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-neutral-700">New Profile Photo</label>
              <input 
                {...register('image')}
                type="file"
                accept="image/*"
                className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              disabled={loading}
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-8 py-3 font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </button>
            {success && (
              <div className="flex items-center gap-2 text-sm font-bold text-green-600 animate-in fade-in slide-in-from-left-2">
                <CheckCircle size={18} />
                Profile updated successfully!
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
