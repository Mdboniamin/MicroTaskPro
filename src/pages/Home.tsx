import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Users, ArrowRight, CheckCircle2, Star, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import 'swiper/css';
import 'swiper/css/pagination';

const stats = [
  { label: 'Active Workers', value: '10k+', icon: Users },
  { label: 'Tasks Completed', value: '500k+', icon: CheckCircle2 },
  { label: 'Paid to Workers', value: '$1.2M+', icon: Zap },
];

const testimonials = [
  { name: 'Sarah Jenkins', role: 'Premium Worker', text: 'I earned my first $50 within a week. The tasks are simple and intuitive!', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { name: 'Marcus Davis', role: 'Business Owner', text: 'Excellent platform for getting micro-tasks done quickly and reliably.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
  { name: 'Elena Rodriguez', role: 'Operations Manager', text: 'Managing thousands of users is a breeze with our advanced marketplace tools.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
];

const dummyWorkers = [
  { id: 'd1', name: 'Alex Rivera', coins: 14500, photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  { id: 'd2', name: 'James Wilson', coins: 12800, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { id: 'd3', name: 'Maria Garcia', coins: 11200, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { id: 'd4', name: 'David Chen', coins: 9800, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
  { id: 'd5', name: 'Sophie Turner', coins: 8500, photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' },
  { id: 'd6', name: 'Michael B.', coins: 7900, photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
];

export default function Home() {
  const { user, dbUser } = useAuth();
  const [topWorkers, setTopWorkers] = useState<any[]>(dummyWorkers);

  useEffect(() => {
    const fetchTopWorkers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'worker'), orderBy('coins', 'desc'), limit(6));
        const querySnapshot = await getDocs(q);
        const workers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (workers.length > 0) {
          setTopWorkers(workers);
        }
      } catch (error) {
        console.error('Error fetching top workers:', error);
      }
    };
    fetchTopWorkers();
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/register';
    return `/dashboard/${dbUser?.role || ''}`;
  };

  const getDashboardLabel = () => {
    if (!user) return 'Get Your Free Account';
    return 'Go to Dashboard';
  };

  const getWorkerLink = () => {
    if (!user) return '/register';
    if (dbUser?.role === 'worker') return '/dashboard/worker/tasks';
    return `/dashboard/${dbUser?.role || ''}`;
  };

  const getWorkerLabel = () => {
    if (!user) return 'Get Started as Worker';
    if (dbUser?.role === 'worker') return 'Browse New Tasks';
    return 'Go to Dashboard';
  };

  const getBuyerLink = () => {
    if (!user) return '/register';
    if (dbUser?.role === 'buyer') return '/dashboard/buyer/post-task';
    return `/dashboard/${dbUser?.role || ''}`;
  };

  const getBuyerLabel = () => {
    if (!user) return 'Join as a Buyer';
    if (dbUser?.role === 'buyer') return 'Post a New Task';
    return 'Go to Dashboard';
  };

  const getTasksLink = () => {
    if (!user) return '/login';
    if (dbUser?.role === 'worker') return '/dashboard/worker/tasks';
    if (dbUser?.role === 'buyer') return '/dashboard/buyer/my-tasks';
    return `/dashboard/${dbUser?.role || ''}`;
  };

  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* 1. Hero Slider */}
      <section className="relative h-[85vh] w-full">
        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          className="h-full w-full"
        >
          {/* Banner 1: For Workers */}
          <SwiperSlide>
            <div className="relative flex h-full items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-black/40 z-10" />
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" 
                className="absolute inset-0 h-full w-full object-cover"
                alt="Working remotely"
              />
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-20 max-w-5xl px-4 text-center text-white"
              >
                <h1 className="mb-6 text-5xl font-black md:text-7xl lg:text-8xl tracking-tighter">
                  Earning Made <span className="text-orange-500 underline decoration-white/30">Simple</span>
                </h1>
                <p className="mx-auto mb-10 max-w-2xl text-xl text-neutral-200 md:text-2xl font-medium">
                  Complete small tasks, earn coins, and withdraw real money. Join 10k+ workers growing daily.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link to={getWorkerLink()} className="rounded-full bg-orange-600 px-10 py-4 text-lg font-bold transition hover:bg-orange-700 active:scale-95 shadow-lg shadow-orange-600/30">
                    {getWorkerLabel()}
                  </Link>
                  <Link to={getTasksLink()} className="rounded-full bg-white/10 px-10 py-4 text-lg font-bold backdrop-blur-md transition hover:bg-white/20">
                    View Available Tasks
                  </Link>
                </div>
              </motion.div>
            </div>
          </SwiperSlide>

          {/* Banner 2: For Buyers */}
          <SwiperSlide>
            <div className="relative flex h-full items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-black/50 z-10" />
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2000" 
                className="absolute inset-0 h-full w-full object-cover scale-105"
                alt="Team collaboration"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-20 max-w-5xl px-4 text-center text-white"
              >
                <h1 className="mb-6 text-5xl font-black md:text-7xl lg:text-8xl tracking-tighter">
                  Scale Your <span className="text-orange-500">Business</span> Faster
                </h1>
                <p className="mx-auto mb-10 max-w-2xl text-xl text-neutral-200 md:text-2xl font-medium">
                  Delegate micro-tasks to our global workforce. High quality results, delivered in minutes.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link to={getBuyerLink()} className="rounded-full bg-orange-600 px-10 py-4 text-lg font-bold transition hover:bg-orange-700 active:scale-95 shadow-lg shadow-orange-600/30">
                    {getBuyerLabel()}
                  </Link>
                  <a href="#how-it-works" onClick={scrollToHowItWorks} className="rounded-full bg-white/10 px-10 py-4 text-lg font-bold backdrop-blur-md transition hover:bg-white/20">
                    Learn How it Works
                  </a>
                </div>
              </motion.div>
            </div>
          </SwiperSlide>

          {/* Banner 3: Trust & Platform */}
          <SwiperSlide>
            <div className="relative flex h-full items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-black/50 z-10" />
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000" 
                className="absolute inset-0 h-full w-full object-cover scale-105"
                alt="Digital community"
              />
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-20 max-w-5xl px-4 text-center text-white"
              >
                <h1 className="mb-6 text-5xl font-black md:text-7xl lg:text-8xl tracking-tighter">
                  The <span className="text-orange-500">Trusted</span> Marketplace
                </h1>
                <p className="mx-auto mb-10 max-w-2xl text-xl text-neutral-200 md:text-2xl font-medium">
                  Transparency, security, and fairness. Our platform connects thousands of people everyday.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link to={getDashboardLink()} className="rounded-full bg-orange-600 px-10 py-4 text-lg font-bold transition hover:bg-orange-700 active:scale-95 shadow-lg shadow-orange-600/30">
                    {getDashboardLabel()}
                  </Link>
                  <Link to="/about" className="rounded-full bg-white/10 px-10 py-4 text-lg font-bold backdrop-blur-md transition hover:bg-white/20">
                    About the Platform
                  </Link>
                </div>
              </motion.div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      {/* 2. Best Workers Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-black text-neutral-900 md:text-5xl">Our Best Workers</h2>
            <p className="text-lg text-neutral-600">Top 6 industrious workers leading our global community by earnings.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-6">
            {topWorkers.length > 0 ? topWorkers.map((worker, i) => (
              <motion.div 
                key={worker.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="mb-6 relative">
                  <div className="absolute inset-0 rounded-full bg-orange-600 blur-lg opacity-0 transition-opacity group-hover:opacity-20" />
                  <img 
                    src={worker.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.name || worker.id}`} 
                    alt={worker.name || 'Worker'} 
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-xl relative z-10"
                  />
                  <div className="absolute top-0 right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white font-black text-sm shadow-md ring-4 ring-white">
                    #{i + 1}
                  </div>
                </div>
                <h4 className="text-lg font-black text-neutral-900 truncate w-full px-2">{worker.name || 'Verified Worker'}</h4>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-orange-600 font-black text-base bg-orange-50 px-3 py-1 rounded-full">
                  <Coins size={16} className="fill-orange-600" />
                  {worker.coins}
                </div>
              </motion.div>
            )) : (
              // Fallback if no workers yet
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center animate-pulse">
                  <div className="mb-4 h-24 w-24 rounded-full bg-neutral-200" />
                  <div className="h-4 w-20 bg-neutral-200 rounded mb-2" />
                  <div className="h-4 w-12 bg-neutral-200 rounded" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3. Testimonials Section */}
      <section className="bg-neutral-50 py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-black tracking-tight text-neutral-900 md:text-5xl">Voices of Our Community</h2>
            <p className="text-lg text-neutral-600">Hear from the people who power MicroTask Pro every day.</p>
          </div>
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            className="pb-16"
          >
            {testimonials.map((t, i) => (
              <SwiperSlide key={i}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex h-full flex-col rounded-[2.5rem] bg-white p-10 transition-colors hover:bg-orange-50 shadow-sm border border-neutral-100"
                >
                  <div className="mb-8 flex text-orange-600">
                    {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                  </div>
                  <p className="mb-10 flex-grow text-xl font-medium leading-relaxed text-neutral-800">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <img 
                      src={t.avatar} 
                      alt={t.name} 
                      className="h-14 w-14 rounded-2xl object-cover ring-4 ring-white shadow-sm" 
                    />
                    <div>
                      <div className="text-lg font-bold text-neutral-900">{t.name}</div>
                      <div className="text-sm font-medium text-orange-600">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* 4. How it Works Section */}
      <section id="how-it-works" className="bg-white py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-black tracking-tight text-neutral-900 sm:text-5xl">How it <span className="text-orange-600">Works</span></h2>
            <p className="mx-auto max-w-2xl text-lg font-bold text-neutral-500">
              Simple, transparent, and secure steps for both workers and buyers to collaborate effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* For Workers */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-[3rem] bg-orange-50 p-8 sm:p-12 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
              <div className="mb-8 flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-xl font-bold text-white shadow-lg shadow-orange-600/20">W</div>
                <h3 className="text-2xl font-black text-neutral-900">For Workers</h3>
              </div>
              <div className="space-y-10 relative z-10">
                <div className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-orange-600 shadow-sm border border-neutral-100">1</div>
                  <div>
                    <h4 className="mb-1 font-black text-neutral-900">Choose a Task</h4>
                    <p className="text-neutral-600 font-medium">Browse available micro-tasks that match your interests. We have thousands of social and technical tasks.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-orange-600 shadow-sm border border-neutral-100">2</div>
                  <div>
                    <h4 className="mb-1 font-black text-neutral-900">Submit Proof</h4>
                    <p className="text-neutral-600 font-medium">Follow simple instructions, complete the task, and upload a screenshot or text as evidence.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-orange-600 shadow-sm border border-neutral-100">3</div>
                  <div>
                    <h4 className="mb-1 font-black text-neutral-900">Get Paid</h4>
                    <p className="text-neutral-600 font-medium">Once approved by the buyer, coins are credited to your balance instantly. Withdraw to real money easily!</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* For Buyers */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-[3rem] bg-neutral-900 p-8 sm:p-12 text-white relative overflow-hidden group"
            >
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 transition-transform group-hover:scale-150 duration-700" />
              <div className="mb-8 flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-bold text-neutral-900">B</div>
                <h3 className="text-2xl font-black">For Buyers</h3>
              </div>
              <div className="space-y-10 relative z-10">
                <div className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 font-black text-white shadow-sm border border-white/10">1</div>
                  <div>
                    <h4 className="mb-1 font-black">Post a Task</h4>
                    <p className="text-neutral-400 font-medium">Create a campaign with set budget and specific instructions. Reach thousands of workers globally.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 font-black text-white shadow-sm border border-white/10">2</div>
                  <div>
                    <h4 className="mb-1 font-black">Review Work</h4>
                    <p className="text-neutral-400 font-medium">Review submissions in real-time. Approve quality work or reject if it doesn't meet requirements.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 font-black text-white shadow-sm border border-white/10">3</div>
                  <div>
                    <h4 className="mb-1 font-black">Get Results</h4>
                    <p className="text-neutral-400 font-medium">Get the results you need quickly from a global community. Scale your business, SEO, or social presence.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. Ecosystem Benefits Section */}
      <section className="bg-neutral-900 py-32 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 h-96 w-96 rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-96 w-96 rounded-full bg-orange-600/5 blur-[100px]" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-4xl font-black md:text-5xl lg:text-6xl tracking-tight">Ecosystem Benefits</h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">Providing the infrastructure for the next generation of digital work.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Star, title: "Quality Guard", desc: "AI-powered checks and a peer-review system ensure only top-tier work is rewarded.", color: "bg-orange-600" },
              { icon: Zap, title: "Lightning Payouts", desc: "Earnings are processed near-instantly upon task approval. No long holding periods.", color: "bg-orange-600" },
              { icon: Shield, title: "Escrow Security", desc: "Funds are locked securely until work is delivered, protecting both buyers and workers.", color: "bg-orange-600" },
              { icon: Users, title: "Global Talent", desc: "Connect with thousands of workers in every timezone ready to scale your projects.", color: "bg-orange-600" }
            ].map((benefit, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -15 }}
                className="rounded-[2.5rem] bg-white/5 p-10 border border-white/10 backdrop-blur-xl transition-all hover:bg-white/10 hover:border-orange-500/50"
              >
                <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl ${benefit.color} text-white shadow-lg shadow-orange-600/20`}>
                  <benefit.icon size={32} />
                </div>
                <h3 className="mb-4 text-2xl font-black text-white">{benefit.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-lg">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Extra Section 3: Why Choose Us */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 items-center">
            <div>
              <h2 className="mb-8 text-4xl font-black text-neutral-900 md:text-5xl leading-tight">Built for Unmatched Quality and Speed</h2>
              <div className="grid grid-cols-1 gap-6">
                <motion.div whileHover={{ x: 10 }} className="flex gap-5 rounded-3xl border border-neutral-100 p-8 shadow-sm transition-all hover:shadow-md hover:border-orange-100">
                  <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xl font-black text-neutral-900">Verified Marketplace</h4>
                    <p className="text-neutral-600 text-lg">Multi-step verification processes ensure high trust and platform integrity.</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ x: 10 }} className="flex gap-5 rounded-3xl border border-neutral-100 p-8 shadow-sm transition-all hover:shadow-md hover:border-orange-100">
                  <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xl font-black text-neutral-900">Agile Scalability</h4>
                    <p className="text-neutral-600 text-lg">Scale from 1 to 10,000 tasks in minutes with our automated distributions.</p>
                  </div>
                </motion.div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-100 rounded-[3rem] blur-2xl opacity-50 -z-10" />
              <img 
                src="https://images.unsplash.com/photo-15222071823991-b9671f9d7f1f?w=800&auto=format&fit=crop&q=60" 
                alt="Community Focus" 
                className="rounded-[3rem] shadow-2xl"
              />
              <div className="absolute -bottom-8 -left-8 rounded-[2rem] bg-orange-600 p-10 text-white shadow-2xl shadow-orange-600/30">
                <div className="text-5xl font-black mb-1">99.8%</div>
                <div className="text-lg font-bold opacity-80 uppercase tracking-widest">Growth Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 bg-neutral-50">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[3.5rem] bg-orange-600 px-8 py-24 text-center text-white shadow-2xl shadow-orange-600/40 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_5s_infinite]" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="mb-8 text-5xl font-black md:text-7xl tracking-tighter">Ready to Start Your Journey?</h2>
            <p className="mx-auto mb-12 max-w-2xl text-xl md:text-2xl text-white/90 font-medium">
              Join thousands of workers earning and buyers growing their business on the most trusted micro-tasking platform.
            </p>
            <div className="grid grid-cols-1 sm:flex flex-wrap justify-center gap-6">
              <Link 
                to={getDashboardLink()} 
                className="rounded-full bg-white px-12 py-5 text-xl font-black text-orange-600 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
              >
                {getDashboardLabel()}
              </Link>
              {!user && (
                <Link 
                  to="/login" 
                  className="rounded-full bg-black/10 px-12 py-5 text-xl font-black text-white backdrop-blur-md transition-all hover:bg-black/20 hover:scale-105 active:scale-95 border border-white/20"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
