import { Link } from 'react-router-dom';
import { Facebook, Github, Linkedin, Twitter, Coins } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    { icon: <Linkedin size={20} />, href: 'https://linkedin.com/in/aminboni070', label: 'LinkedIn' },
    { icon: <Facebook size={20} />, href: 'https://facebook.com/aminboni070', label: 'Facebook' },
    { icon: <Github size={20} />, href: 'https://github.com/aminboni070', label: 'GitHub' },
    { icon: <Twitter size={20} />, href: 'https://twitter.com/aminboni070', label: 'Twitter' },
  ];

  return (
    <footer className="border-t border-neutral-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-3">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
                <Coins size={20} />
              </div>
              <span>MicroTask<span className="text-orange-600">Pro</span></span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-neutral-500">
              Empowering workers to earn and buyers to grow. The leading platform for micro-tasking and digital growth.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Connect</h3>
            <div className="mt-4 flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 transition hover:text-orange-600"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-neutral-100 pt-8 text-center">
          <p className="text-sm text-neutral-400">
            &copy; {new Date().getFullYear()} MicroTaskPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
