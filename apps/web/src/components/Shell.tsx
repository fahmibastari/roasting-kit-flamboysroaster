'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
            {!isLoginPage && (
                <>
                    {/* Mobile Header */}
                    <div className="md:hidden bg-stone-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-stone-800 rounded">
                                <Menu size={24} />
                            </button>
                            <span className="font-bold text-lg">Flamboys</span>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                    {/* Mobile Overlay */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}
                </>
            )}

            <main className={`flex-1 transition-all duration-300 ${isLoginPage ? 'w-full' : 'md:ml-64 p-4 md:p-8'}`}>
                {children}
            </main>
        </div>
    );
}
