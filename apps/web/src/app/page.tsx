/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Package, AlertTriangle, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';

export default function Dashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalGB: 0,
    totalRB: 0,
    lowStockCount: 0,
    totalBatches: 0
  });
  const [loading, setLoading] = useState(true);

  // 1. CEK LOGIN (SATPAM)
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/login');
    }
  }, [router]);

  // 2. FETCH DATA STATISTIK
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resBeans, resRoast] = await Promise.all([
          api.get('/beans'),
          api.get('/roasting')
        ]);

        const beans = resBeans.data;
        const roasts = resRoast.data;

        setStats({
          totalGB: beans.reduce((acc: number, b: any) => acc + b.stockGB, 0),
          totalRB: beans.reduce((acc: number, b: any) => acc + b.stockRB, 0),
          lowStockCount: beans.filter((b: any) => b.stockGB < 2000).length,
          totalBatches: roasts.length
        });
      } catch (error) {
        console.error("Gagal load dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-pulse text-stone-400 text-sm font-medium">Loading Overview...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Overview</h1>
        <p className="text-stone-500 mt-1">Summary of production and warehouse performance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Green Beans"
          value={`${(stats.totalGB / 1000).toFixed(1)} kg`}
          icon={Package}
          trend="neutral"
          trendValue="Raw Material"
        />
        <StatCard
          title="Roasted Beans"
          value={`${(stats.totalRB / 1000).toFixed(1)} kg`}
          icon={CheckCircle}
          trend="up"
          trendValue="Ready to Sell"
        />
        <StatCard
          title="Total Batches"
          value={`${stats.totalBatches}`}
          icon={Flame}
          trend="neutral"
          trendValue="Production"
        />
        <StatCard
          title="Low Stock Alert"
          value={`${stats.lowStockCount}`}
          icon={AlertTriangle}
          alert={stats.lowStockCount > 0}
          trend={stats.lowStockCount > 0 ? 'down' : 'neutral'}
          trendValue="Action Needed"
        />
      </div>

      {/* Quick Actions Menu */}
      <div>
        <h2 className="text-lg font-bold text-stone-900 mb-4 tracking-tight">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/inventory" className="block group">
            <div className="bg-white p-6 rounded-xl border border-stone-200 hover:border-amber-400/50 hover:shadow-md transition-all h-full group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 group-hover:text-amber-800 transition-colors">
                    Inventory & Log
                  </h3>
                  <p className="text-stone-500 text-sm mt-2 max-w-sm leading-relaxed">
                    Manage green bean stocks and view detailed roasting history per variety.
                  </p>
                </div>
                <div className="bg-stone-50 p-2 rounded-lg group-hover:bg-amber-50 transition-colors">
                  <ArrowRight size={20} className="text-stone-400 group-hover:text-amber-600" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/users" className="block group">
            <div className="bg-white p-6 rounded-xl border border-stone-200 hover:border-amber-400/50 hover:shadow-md transition-all h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 group-hover:text-amber-800 transition-colors">
                    Roaster Management
                  </h3>
                  <p className="text-stone-500 text-sm mt-2 max-w-sm leading-relaxed">
                    Manage system access, create new roaster accounts, or reset credentials.
                  </p>
                </div>
                <div className="bg-stone-50 p-2 rounded-lg group-hover:bg-amber-50 transition-colors">
                  <ArrowRight size={20} className="text-stone-400 group-hover:text-amber-600" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}