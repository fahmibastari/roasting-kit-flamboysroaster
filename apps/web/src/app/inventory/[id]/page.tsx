/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/app/inventory/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';

export default function BeanDetailPage() {
    const params = useParams();
    const router = useRouter(); // Kept for future use if needed
    const [bean, setBean] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // API findOne yang baru kita update tadi (sudah include batches)
        api.get(`/beans/${params.id}`)
            .then(res => setBean(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-stone-400 text-sm font-medium">Loading Details...</div>
        </div>
    );
    if (!bean) return <div className="p-10 text-center text-stone-500">Data not found.</div>;

    return (
        <div className="space-y-8">
            {/* Tombol Back */}
            <div>
                <Link href="/inventory" className="flex items-center text-stone-500 hover:text-stone-900 font-medium w-fit text-sm">
                    <ArrowLeft size={16} className="mr-2" /> Back to Inventory
                </Link>
            </div>

            {/* Header Info Kopi */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bean.sackPhotoUrl || 'https://placehold.co/100'} alt="sack" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-stone-900 mb-1">{bean.name}</h1>
                    <p className="text-stone-400 text-xs uppercase font-bold tracking-wider mb-6">Origin Details</p>

                    <div className="flex gap-4">
                        <div className="bg-stone-50 px-5 py-3 rounded-xl border border-stone-100">
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">Green Bean Stock</p>
                            <p className="text-lg font-mono font-medium text-stone-800">{bean.stockGB.toLocaleString()} g</p>
                        </div>
                        <div className="bg-stone-50 px-5 py-3 rounded-xl border border-stone-100">
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">Roasted Stock</p>
                            <p className="text-lg font-mono font-medium text-amber-900">{bean.stockRB.toLocaleString()} g</p>
                        </div>
                        <div className="bg-stone-50 px-5 py-3 rounded-xl border border-stone-100">
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">Total Batches</p>
                            <p className="text-lg font-mono font-medium text-stone-800">{bean.batches?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabel Riwayat Roasting */}
            <div>
                <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-stone-400" /> Roasting Logs
                </h2>

                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-stone-600 min-w-[900px]">
                            <thead className="bg-stone-50 text-xs uppercase font-bold text-stone-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Roast Date</th>
                                    <th className="px-6 py-4">Roaster</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">Input (GB)</th>
                                    <th className="px-6 py-4">Yield (RB)</th>
                                    <th className="px-6 py-4 text-center">QC Score</th>
                                    <th className="px-6 py-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {bean.batches?.map((batch: any) => (
                                    <tr key={batch.id} className="hover:bg-stone-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-medium text-stone-900">
                                                <Calendar size={14} className="text-stone-400" />
                                                {format(new Date(batch.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                                            </div>
                                            <div className="text-xs text-stone-400 mt-0.5">Batch #{batch.batchNumber}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {batch.roaster?.fullName || batch.roaster?.username || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {batch.finalTime ? (
                                                <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-stone-200">Finished</span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-amber-200 animate-pulse">In Progress</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{batch.initialWeight.toLocaleString()} g</td>
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-stone-800">
                                            {batch.actualYield ? batch.actualYield.toLocaleString() : '-'} g
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {batch.cuppingScore ? (
                                                <span className={`font-mono font-bold ${batch.cuppingScore >= 80 ? 'text-stone-800' : 'text-stone-400'}`}>
                                                    {batch.cuppingScore}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/roasting/${batch.id}`}
                                                className="text-stone-400 hover:text-amber-700 flex justify-end transition-colors"
                                            >
                                                <ArrowRight size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {(!bean.batches || bean.batches.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-stone-400">
                                            No roasting history available for this bean.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}