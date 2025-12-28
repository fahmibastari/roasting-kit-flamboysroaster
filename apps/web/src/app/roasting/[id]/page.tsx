/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { ArrowLeft, Thermometer, Wind, Clock, TrendingUp, Award, ClipboardCheck, Scale, Target, ArrowRight } from 'lucide-react';

export default function RoastingDetail() {
  const params = useParams();
  const router = useRouter(); // Kept for future use
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State Form QC
  const [qcMode, setQcMode] = useState(false);
  const [qcForm, setQcForm] = useState({ score: '', notes: '', isApproved: true });

  const fetchData = () => {
    api.get(`/roasting/${params.id}`)
      .then(res => {
        setData(res.data);
        if (res.data.cuppingScore) {
          setQcForm({
            score: res.data.cuppingScore.toString(),
            notes: res.data.sensoryNotes || '',
            isApproved: res.data.isApproved
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const handleSaveQC = async () => {
    try {
      await api.patch(`/roasting/${params.id}/qc`, {
        score: parseFloat(qcForm.score),
        notes: qcForm.notes,
        isApproved: qcForm.isApproved
      });
      alert("QC Data Saved Successfully!");
      setQcMode(false);
      fetchData();
    } catch (error) {
      alert("Failed to save QC data.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-stone-50">
      <div className="animate-pulse text-stone-400 text-sm font-medium">Loading Roasting Data...</div>
    </div>
  );
  if (!data) return <div className="p-10 text-center text-stone-500">Data not found.</div>;

  const fcLog = data.logs.find((log: any) => log.isFirstCrack);

  // Hitung % Penyusutan Real
  const shrinkage = data.actualYield
    ? (((data.initialWeight - data.actualYield) / data.initialWeight) * 100).toFixed(1)
    : '-';

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.back()} className="flex items-center text-stone-500 hover:text-stone-900 font-medium w-fit text-sm mb-4">
          <ArrowLeft size={16} className="mr-2" /> Back to Bean Details
        </button>
      </div>

      {/* HEADER UTAMA */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-900">{data.beanType.name}</h1>
              {data.cuppingScore > 0 && (
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${data.isApproved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {data.isApproved ? 'QC Passed' : 'QC Rejected'}
                </span>
              )}
            </div>
            <p className="text-stone-500 mt-1 flex items-center gap-2 text-sm">
              Batch #{data.batchNumber} <span className="text-stone-300">•</span> Roaster: <span className="font-bold text-stone-900">{data.roaster.fullName}</span>
            </p>
          </div>

          <div className="text-right flex gap-3">
            <div className="bg-stone-50 px-4 py-2 rounded-lg border border-stone-100 text-right">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Target Profile</div>
              <div className="text-sm font-bold text-stone-800">{data.targetProfile || 'Standard'}</div>
            </div>
            <div className="bg-stone-50 px-4 py-2 rounded-lg border border-stone-100 text-right">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Density</div>
              <div className="text-sm font-bold text-stone-800">{data.density ? `${data.density} g/L` : '-'}</div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-stone-100">
          <StatBox icon={<Thermometer />} label="Final Temp" value={`${data.finalTemp || '-'}°C`} />
          <StatBox icon={<Clock />} label="Total Duration" value={data.finalTime || '-'} />
          <StatBox icon={<Scale />} label="Weight In (GB)" value={`${data.initialWeight} g`} />
          <StatBox icon={<TrendingUp />} label="Yield (RB)" value={`${data.actualYield || '-'} g`} />
          <StatBox icon={<Target />} label="Shrinkage" value={`${shrinkage}%`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART AREA (KIRI) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-full">
            <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-stone-400" /> Roasting Curve (Rate of Rise)
            </h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.logs} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis
                    dataKey="timeIndex"
                    tickFormatter={(val) => `${Math.floor(val / 60)}:${(val % 60).toString().padStart(2, '0')}`}
                    stroke="#a8a29e"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke="#a8a29e"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(val) => `Time: ${Math.floor(val / 60)}:${(val % 60).toString().padStart(2, '0')}`}
                  />
                  <Line type="monotone" dataKey="temperature" stroke="#d97706" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 6, fill: "#d97706" }} name="Bean Temp" />
                  {fcLog && <ReferenceDot x={fcLog.timeIndex} y={fcLog.temperature} r={6} fill="#fbbf24" stroke="none" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {fcLog && (
              <div className="mt-6 flex items-center gap-3 bg-amber-50 p-4 rounded-lg text-sm text-amber-900 border border-amber-100">
                <span className="h-2 w-2 bg-amber-500 rounded-full block animate-pulse"></span>
                First Crack detected at <strong>{Math.floor(fcLog.timeIndex / 60)}:{(fcLog.timeIndex % 60).toString().padStart(2, '0')}</strong> with temperature <strong>{fcLog.temperature}°C</strong>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR KANAN */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Result Photo</h2>
            {data.resultPhotoUrl ? (
              <div className="rounded-lg overflow-hidden border border-stone-200">
                <img src={data.resultPhotoUrl} alt="Result" className="w-full h-auto object-cover" />
                <div className="p-3 bg-stone-50 text-[10px] text-stone-500 text-center uppercase font-bold tracking-wider">Captured at Finish</div>
              </div>
            ) : (
              <div className="h-40 bg-stone-50 rounded-lg flex items-center justify-center text-stone-400 text-sm border border-dashed border-stone-200">No photo available</div>
            )}
          </div>

          {/* QUALITY CONTROL */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Award className="text-amber-600" size={20} /> Quality Control
              </h2>
              {!qcMode && (
                <button onClick={() => setQcMode(true)} className="text-xs text-amber-700 font-bold hover:underline uppercase tracking-wide">
                  {data.cuppingScore > 0 ? 'Edit Score' : '+ Input QC'}
                </button>
              )}
            </div>

            {qcMode ? (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Cupping Score (1-100)</label>
                  <input
                    type="number" className="w-full border border-stone-200 bg-stone-50 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20" placeholder="85.5"
                    value={qcForm.score} onChange={e => setQcForm({ ...qcForm, score: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Sensory Notes</label>
                  <textarea
                    className="w-full border border-stone-200 bg-stone-50 p-2.5 rounded-lg h-24 text-sm outline-none focus:ring-2 focus:ring-amber-500/20" placeholder="e.g. Medium acidity, full body..."
                    value={qcForm.notes} onChange={e => setQcForm({ ...qcForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setQcMode(false)} className="flex-1 py-2 text-stone-500 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50 transition">Cancel</button>
                  <button onClick={handleSaveQC} className="flex-1 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition">Save QC</button>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 p-5 rounded-xl border border-stone-100">
                {data.cuppingScore > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-stone-200 pb-4">
                      <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">Final Score</span>
                      <span className="text-4xl font-bold text-stone-900">{data.cuppingScore}</span>
                    </div>
                    <p className="text-stone-700 text-sm italic leading-relaxed">"{data.sensoryNotes}"</p>
                    <div className={`text-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border ${data.isApproved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {data.isApproved ? 'Batch Approved' : 'Batch Rejected'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-400 text-sm">
                    <ClipboardCheck size={32} className="mx-auto mb-3 opacity-30" />
                    No QC data recorded yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-2">
      <div className="text-stone-400">{icon}</div>
      <div>
        <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">{label}</div>
        <div className="font-bold text-stone-900 text-base">{value}</div>
      </div>
    </div>
  );
}