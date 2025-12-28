/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, Plus, ArrowRight, Bean, Droplets, Eye, X, Save } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const [beans, setBeans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE MODAL MANAGE ---
  const [selectedBean, setSelectedBean] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'RESTOCK' | 'EDIT' | 'DELETE'>('RESTOCK');

  // Tab 1: Restock
  const [restockAmount, setRestockAmount] = useState('');
  const [restockType, setRestockType] = useState<'GB' | 'RB'>('GB');

  // Tab 2: Edit
  const [editName, setEditName] = useState('');
  const [editStockGB, setEditStockGB] = useState('');
  const [editStockRB, setEditStockRB] = useState('');

  // Tab 3: Delete (Confirmation state is implicit by being on the tab)

  // --- STATE MODAL CREATE NEW BEAN ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBean, setNewBean] = useState({
    name: '',
    stockGB: '',
    stockRB: '',
    sackPhotoUrl: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchBeans = () => {
    setLoading(true);
    api.get('/beans')
      .then(res => setBeans(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBeans(); }, []);

  // LOGIC: MANAGE OPEN
  const openManageModal = (bean: any) => {
    setSelectedBean(bean);
    setActiveTab('RESTOCK');
    // Pre-fill Edit Data
    setEditName(bean.name);
    setEditStockGB(bean.stockGB.toString());
    setEditStockRB(bean.stockRB.toString());
    // Reset Restock
    setRestockAmount('');
    setRestockType('GB');
  };

  // LOGIC: RESTOCK
  const handleRestock = async () => {
    if (!selectedBean || !restockAmount) return;
    try {
      await api.patch(`/beans/${selectedBean.id}/restock`, {
        amount: parseInt(restockAmount),
        type: restockType
      });
      alert(`Success: Restocked ${selectedBean.name}!`);
      setSelectedBean(null);
      fetchBeans();
    } catch (err) {
      alert('Failed to restock.');
    }
  };

  // LOGIC: UPDATE
  const handleUpdate = async () => {
    if (!selectedBean) return;
    try {
      await api.patch(`/beans/${selectedBean.id}`, {
        name: editName,
        stockGB: parseInt(editStockGB),
        stockRB: parseInt(editStockRB)
      });
      alert('Bean details updated!');
      setSelectedBean(null);
      fetchBeans();
    } catch (err) {
      alert('Failed to update.');
    }
  };

  // LOGIC: DELETE
  const handleDelete = async () => {
    if (!selectedBean) return;
    if (!confirm(`Are you sure you want to delete ${selectedBean.name}? This cannot be undone.`)) return;

    try {
      await api.delete(`/beans/${selectedBean.id}`);
      alert('Bean deleted.');
      setSelectedBean(null);
      fetchBeans();
    } catch (err) {
      alert('Failed to delete. It might be used in roasting logs.');
    }
  };

  // LOGIC: CREATE NEW BEAN
  const handleCreateBean = async () => {
    if (!newBean.name || !newBean.stockGB) {
      alert("Nama dan Stok Green Bean wajib diisi!");
      return;
    }

    setIsCreating(true);
    try {
      // Placeholder foto jika kosong
      const finalPhoto = newBean.sackPhotoUrl ||
        `https://placehold.co/600x400/orange/white?text=${encodeURIComponent(newBean.name)}`;

      await api.post('/beans', {
        name: newBean.name,
        stockGB: parseInt(newBean.stockGB),
        stockRB: parseInt(newBean.stockRB || '0'),
        sackPhotoUrl: finalPhoto
      });

      alert("Kopi baru berhasil didaftarkan! 🎉");
      setShowCreateModal(false);
      setNewBean({ name: '', stockGB: '', stockRB: '', sackPhotoUrl: '' });
      fetchBeans();
    } catch (error) {
      console.error(error);
      alert("Gagal membuat kopi baru. Cek koneksi backend.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Inventory</h1>
          <p className="text-stone-500 mt-1 text-sm">Manage Green Bean stock and estimated roast yields.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-stone-900 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 w-full md:w-auto justify-center"
        >
          <Plus size={16} /> New Bean
        </button>
      </div>

      {/* Tabel List Inventory */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-stone-400 text-sm font-medium">Loading Inventory...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-stone-50 text-xs uppercase font-bold text-stone-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Bean Name</th>
                  <th className="px-6 py-4">Green Bean (Raw)</th>
                  <th className="px-4 py-4 text-center text-stone-300"><ArrowRight size={14} /></th>
                  <th className="px-6 py-4">Est. Yield (RB)</th>
                  <th className="px-6 py-4">Roasted Bean (Ready)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {beans.map((bean) => {
                  // RUMUS ESTIMASI: GB * 0.7
                  const estimatedRB = Math.round(bean.stockGB * 0.7);

                  return (
                    <tr key={bean.id} className="hover:bg-stone-50/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-stone-900 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                          <img
                            src={bean.sackPhotoUrl || 'https://placehold.co/100'}
                            alt="bean"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {bean.name}
                      </td>

                      {/* GB */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-700 font-medium bg-stone-100 px-2 py-0.5 rounded text-xs">{bean.stockGB.toLocaleString()} g</span>
                          {bean.stockGB < 2000 && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 font-medium">Low Stock</span>}
                        </div>
                      </td>

                      {/* Panah */}
                      <td className="px-4 py-4 text-center text-stone-300">
                        <span className="text-[10px] uppercase font-medium">30% Loss</span>
                      </td>

                      {/* Estimasi */}
                      <td className="px-6 py-4 text-stone-500 font-mono text-xs">
                        ~{estimatedRB.toLocaleString()} g
                      </td>

                      {/* RB */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded text-sm">{bean.stockRB.toLocaleString()} g</span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openManageModal(bean)}
                            className="text-stone-600 hover:text-stone-900 text-xs font-medium px-3 py-1.5 rounded hover:bg-stone-200 transition"
                          >
                            Manage
                          </button>
                          <Link
                            href={`/inventory/${bean.id}`}
                            className="text-stone-600 hover:text-amber-700 text-xs font-medium px-3 py-1.5 rounded hover:bg-amber-50 transition flex items-center gap-1"
                          >
                            <Eye size={14} /> History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {beans.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-stone-400">Inventory is empty.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Keterangan Bawah */}
      <div className="flex gap-8 text-xs text-stone-400 mt-4 border-t border-stone-100 pt-4">
        <div className="flex items-center gap-2">
          <Bean size={14} /> Roasted stock updates automatically upon finishing a batch.
        </div>
        <div className="flex items-center gap-2">
          <Droplets size={14} /> Estimates based on standard 30% moisture loss.
        </div>
      </div>

      {/* === MODAL 1: RESTOCK === */}
      {/* === MODAL 1: MANAGE BEAN (RESTOCK / EDIT / DELETE) === */}
      {selectedBean && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl border border-stone-200">
            <h3 className="text-lg font-bold mb-4 text-stone-900">Manage {selectedBean.name}</h3>

            {/* TABS */}
            <div className="flex border-b border-stone-200 mb-6">
              {['RESTOCK', 'EDIT', 'DELETE'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 pb-2 text-xs font-bold tracking-wider transition-colors ${activeTab === tab ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: RESTOCK */}
            {activeTab === 'RESTOCK' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs text-stone-500 mb-4">Add new stock to inventory.</p>
                <div className="grid grid-cols-2 gap-2 mb-4 bg-stone-100 p-1 rounded-lg">
                  <button onClick={() => setRestockType('GB')} className={`text-xs font-bold py-2 rounded-md transition-all ${restockType === 'GB' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Green Bean</button>
                  <button onClick={() => setRestockType('RB')} className={`text-xs font-bold py-2 rounded-md transition-all ${restockType === 'RB' ? 'bg-amber-100 text-amber-900 shadow' : 'text-stone-400 hover:text-stone-600'}`}>Roasted</button>
                </div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Amount Adding (Grams)</label>
                <input type="number" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-3 text-stone-900 font-mono mb-6 focus:ring-2 focus:ring-amber-500/20 outline-none" placeholder="0" autoFocus value={restockAmount} onChange={e => setRestockAmount(e.target.value)} />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setSelectedBean(null)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={handleRestock} className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 text-sm font-medium">Confirm Restock</button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: EDIT */}
            {activeTab === 'EDIT' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Name</label>
                  <input type="text" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Stock GB</label>
                    <input type="number" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm" value={editStockGB} onChange={e => setEditStockGB(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Stock RB</label>
                    <input type="number" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm" value={editStockRB} onChange={e => setEditStockRB(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setSelectedBean(null)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={handleUpdate} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">Save Changes</button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DELETE */}
            {activeTab === 'DELETE' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                  <X size={24} />
                </div>
                <h4 className="text-stone-900 font-bold mb-2">Delete {selectedBean.name}?</h4>
                <p className="text-stone-500 text-sm mb-6">This action cannot be undone. This will permanently remove the bean and its history.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setSelectedBean(null)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Yes, Delete Bean</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* === MODAL 2: CREATE NEW BEAN === */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl border border-stone-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Add New Bean Variety</h3>
                <p className="text-xs text-stone-500">Register a new coffee origin to the system.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Variety Name</label>
                <input type="text" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" placeholder="e.g. Aceh Gayo Wine" value={newBean.name} onChange={e => setNewBean({ ...newBean, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Initial Green Bean</label>
                  <input type="number" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" placeholder="0" value={newBean.stockGB} onChange={e => setNewBean({ ...newBean, stockGB: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Initial Roasted Bean</label>
                  <input type="number" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" placeholder="0" value={newBean.stockRB} onChange={e => setNewBean({ ...newBean, stockRB: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Sack Photo URL (Optional)</label>
                <input type="text" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" placeholder="https://..." value={newBean.sackPhotoUrl} onChange={e => setNewBean({ ...newBean, sackPhotoUrl: e.target.value })} />
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-stone-100 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-sm font-medium" disabled={isCreating}>Cancel</button>
              <button onClick={handleCreateBean} disabled={isCreating} className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 text-sm font-medium flex items-center gap-2">
                {isCreating ? 'Saving...' : <><Save size={16} /> Save Bean</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}