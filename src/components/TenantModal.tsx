import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck } from 'lucide-react';
import { useToast } from './Toast';
import { api } from '../services/api';
import { Room, Tenant } from '../types';

interface TenantModalProps {
  propertyId: number;
  rooms: Room[];
  editingTenant?: Tenant | null;
  presetRoomId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const TenantModal: React.FC<TenantModalProps> = ({
  propertyId,
  rooms,
  editingTenant,
  presetRoomId,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const initialRoom = presetRoomId || editingTenant?.room_id || rooms[0]?.id || 0;
  const [selectedRoomId, setSelectedRoomId] = useState<number>(initialRoom);

  const [form, setForm] = useState({
    name: editingTenant?.name || '',
    phone: editingTenant?.phone || '',
    email: editingTenant?.email || '',
    bedId: editingTenant?.bed_id || 0,
    rent: editingTenant?.rent || 6500,
    deposit: editingTenant?.deposit || 10000,
    joinedDate: editingTenant?.joined_date || new Date().toISOString().slice(0, 10),
    idType: editingTenant?.id_type || 'Aadhaar (last 4 only)',
    idDetail: editingTenant?.id_detail || '',
    emergencyName: editingTenant?.emergency_name || '',
    emergencyPhone: editingTenant?.emergency_phone || '',
    shareContact: !!editingTenant?.share_contact,
    createPortalAccount: true,
  });

  const currentRoom = rooms.find((r) => r.id === selectedRoomId);
  const availableBeds = currentRoom?.beds?.filter(
    (b) => b.status === 'vacant' || (editingTenant && b.id === editingTenant.bed_id)
  ) || [];

  useEffect(() => {
    if (!editingTenant && availableBeds.length > 0 && !form.bedId) {
      setForm((prev) => ({ ...prev, bedId: availableBeds[0].id }));
    }
  }, [selectedRoomId, availableBeds, editingTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast('Name and phone number are required', 'error');
      return;
    }

    if (!editingTenant && !form.bedId) {
      showToast('Please select an available bed in this room', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingTenant) {
        await api.updateTenant(editingTenant.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          rent: Number(form.rent),
          deposit: Number(form.deposit),
          id_type: form.idType,
          id_detail: form.idDetail.trim(),
          emergency_name: form.emergencyName.trim(),
          emergency_phone: form.emergencyPhone.trim(),
          share_contact: form.shareContact ? 1 : 0,
        });
        showToast('Tenant details updated successfully');
      } else {
        await api.addTenant(propertyId, {
          roomId: selectedRoomId,
          bedId: form.bedId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          rent: Number(form.rent),
          deposit: Number(form.deposit),
          joinedDate: form.joinedDate,
          id_type: form.idType,
          id_detail: form.idDetail.trim(),
          emergency_name: form.emergencyName.trim(),
          emergency_phone: form.emergencyPhone.trim(),
          share_contact: form.shareContact ? 1 : 0,
          createPortalAccount: form.createPortalAccount,
        });
        showToast(`Tenant ${form.name} checked in successfully!`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-100 text-brand-700 rounded-lg">
              {editingTenant ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </span>
            <h3 className="font-bold text-slate-800">
              {editingTenant ? 'Edit Tenant Details' : 'Check-In New Tenant'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="tenant@example.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.joinedDate}
                onChange={(e) => setForm({ ...form, joinedDate: e.target.value })}
              />
            </div>
          </div>

          {/* Allocation */}
          {!editingTenant && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Room *
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                  value={selectedRoomId}
                  onChange={(e) => {
                    const rId = Number(e.target.value);
                    setSelectedRoomId(rId);
                    const rm = rooms.find((r) => r.id === rId);
                    if (rm?.rent_per_bed) {
                      setForm((prev) => ({ ...prev, rent: rm.rent_per_bed }));
                    }
                  }}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.vacant} vacant of {r.capacity} beds)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Available Bed *
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                  value={form.bedId}
                  onChange={(e) => setForm({ ...form, bedId: Number(e.target.value) })}
                >
                  {availableBeds.length === 0 ? (
                    <option value="0">No vacant beds in this room</option>
                  ) : (
                    availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        Bed {b.bed_number} (Vacant)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Monthly Rent (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.rent}
                onChange={(e) => setForm({ ...form, rent: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* ID & Emergency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ID Proof Type
              </label>
              <select
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.idType}
                onChange={(e) => setForm({ ...form, idType: e.target.value })}
              >
                <option value="Aadhaar (last 4 only)">Aadhaar (last 4 only)</option>
                <option value="Passport">Passport</option>
                <option value="Driving licence">Driving licence</option>
                <option value="Voter ID">Voter ID</option>
                <option value="College / Work ID">College / Work ID</option>
                <option value="Not recorded">Not recorded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ID Reference / Digits
              </label>
              <input
                type="text"
                placeholder="e.g. 4 digits or ID number"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.idDetail}
                onChange={(e) => setForm({ ...form, idDetail: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                placeholder="Parent / Guardian name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.emergencyName}
                onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Emergency Phone
              </label>
              <input
                type="tel"
                placeholder="Emergency phone number"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                value={form.emergencyPhone}
                onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
              />
            </div>
          </div>

          {/* Privacy Consent */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4 shrink-0"
                checked={form.shareContact}
                onChange={(e) => setForm({ ...form, shareContact: e.target.checked })}
              />
              <span className="text-xs text-blue-900 leading-relaxed font-medium">
                <strong>Roommate Privacy Consent:</strong> Tenant has consented to share their phone number with other verified roommates in the same room.
              </span>
            </label>
          </div>

          {!editingTenant && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  checked={form.createPortalAccount}
                  onChange={(e) => setForm({ ...form, createPortalAccount: e.target.checked })}
                />
                Create Tenant Portal login credentials (password defaults to <code>Tenant@123</code>)
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingTenant ? 'Update Tenant' : 'Complete Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
