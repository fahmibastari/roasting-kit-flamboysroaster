/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { UserPlus, ArrowLeft, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', password: '' });

  // --- MANAGE STATE ---
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchUsers = () => {
    api.get('/users').then(res => setUsers(res.data));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!newUser.username || !newUser.password) return alert("Please fill all required fields.");
    try {
      await api.post('/users', newUser);
      alert("Roaster added successfully!");
      setNewUser({ username: '', fullName: '', password: '' });
      fetchUsers();
    } catch (e) { alert("Failed to create user."); }
  };

  // HANDLER: OPEN EDIT
  const openEdit = (user: any) => {
    setSelectedUser(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username);
    setEditPassword('');
    setShowDeleteConfirm(false);
  };

  // HANDLER: UPDATE
  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
      await api.patch(`/users/${selectedUser.id}`, {
        fullName: editFullName,
        username: editUsername,
        password: editPassword
      });
      alert("User updated successfully!");
      setSelectedUser(null);
      fetchUsers();
    } catch (e) { alert("Failed to update user."); }
  };

  // HANDLER: DELETE
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/users/${selectedUser.id}`);
      alert("User deleted.");
      setSelectedUser(null);
      fetchUsers();
    } catch (e) { alert("Failed to delete user."); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-6 gap-4">
        <div>
          <Link href="/" className="flex items-center text-stone-500 hover:text-stone-900 font-medium w-fit text-sm mb-4">
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Roaster Management</h1>
          <p className="text-stone-500 mt-1 text-sm">Manage access for floor staff and roasters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        {/* Form Tambah - Sticky */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-8">
            <h2 className="font-bold mb-6 flex items-center gap-2 text-stone-900 border-b border-stone-100 pb-4">
              <UserPlus size={18} className="text-amber-600" /> New Roaster Account
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Username (for Mobile App)</label>
                <input
                  type="text"
                  placeholder="e.g. roaster01"
                  className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Budi Santoso"
                  className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  value={newUser.fullName}
                  onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              <button
                onClick={handleCreate}
                className="w-full bg-stone-900 text-white py-2.5 rounded-lg font-bold hover:bg-stone-800 transition-all text-sm mt-4 shadow-sm"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        {/* List User */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-200 bg-stone-50/50 flex justify-between items-center">
              <h2 className="font-bold text-stone-900 flex items-center gap-2">
                <Users size={18} className="text-stone-400" /> Active Roasters
              </h2>
              <span className="text-xs bg-stone-200 text-stone-600 px-2 py-1 rounded font-bold">{users.length} Users</span>
            </div>
            <div className="divide-y divide-stone-100">
              {users.map(u => (
                <div key={u.id} className="p-4 hover:bg-stone-50 transition-colors flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold border border-stone-200">
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">{u.fullName}</div>
                      <div className="text-xs text-stone-500 font-mono">@{u.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => openEdit(u)} className="text-stone-500 hover:text-stone-900 text-xs font-bold px-3 py-1.5 rounded hover:bg-stone-200 transition">Manage</button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="p-10 text-center text-stone-400 text-sm">No active users found.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MANAGE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl border border-stone-200">
            {!showDeleteConfirm ? (
              <>
                <h3 className="text-lg font-bold mb-4 text-stone-900">Edit User</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input type="text" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm" value={editFullName} onChange={e => setEditFullName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Username</label>
                    <input type="text" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">New Password (Optional)</label>
                    <input type="password" placeholder="Leave empty to keep current" className="w-full border border-stone-200 bg-stone-50 rounded-lg p-2.5 text-sm" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                  <button onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-700 text-xs font-bold">Delete Account</button>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedUser(null)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-sm font-medium">Cancel</button>
                    <button onClick={handleUpdate} className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 text-sm font-medium">Save Changes</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-stone-900 font-bold mb-2">Delete {selectedUser.fullName}?</h4>
                <p className="text-stone-500 text-sm mb-6">Are you sure? This action cannot be undone.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Yes, Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}