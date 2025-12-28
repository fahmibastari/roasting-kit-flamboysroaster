'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Users, Coffee, LogOut } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('admin_session');
        router.push('/login');
    };

    const menuItems = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/inventory', label: 'Inventory', icon: Package },
        { href: '/users', label: 'Roasters', icon: Users },
    ];

    // Jika di halaman login, jangan tampilkan sidebar
    if (pathname === '/login') return null;

    return (
        <aside className={`w-64 bg-stone-900 text-stone-200 h-screen fixed left-0 top-0 flex flex-col border-r border-stone-800 z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-8 border-b border-stone-800">
                <h1 className="text-xl font-bold tracking-tight text-white uppercase leading-tight">
                    Flamboys<br />
                    <span className="text-amber-600">Roaster</span>
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-stone-800 text-white font-medium shadow-sm'
                                : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-100'
                                }`}
                        >
                            <item.icon size={18} className={isActive ? 'text-amber-500' : 'text-stone-500 group-hover:text-stone-300'} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-stone-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-stone-800/50 hover:text-red-300 transition-all"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
