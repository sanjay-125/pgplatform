import React, { useState } from 'react';
import { X, BedDouble } from 'lucide-react';
import { useToast } from './Toast';
import { api } from '../services/api';

interface RoomModalProps {
  propertyId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({ propertyId, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    roomNumber: '',
    floor: 1,
    capacity: 2,
    rentPerBed: 6500,
    roomType: 'Non-AC',
    hasBathroom: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roomNumber.trim()) {
      showToast('Please enter room number', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.createRoom(propertyId, {
        roomNumber: form.roomNumber.trim(),
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        rentPerBed: Number(form.rentPerBed),
        roomType: form.roomType,
        hasBathroom: form.hasBathroom,
      });
      showToast(`Room ${form.roomNumber} added with ${form.capacity} beds!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-100 text-brand-700 rounded-lg">
              <BedDouble className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-800">Add New Room</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Room Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 101 or A-12"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Floor</label>
              <input
                type="number"
                min="0"
                max="20"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bed Capacity *
              </label>
              <select
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} Bed{n > 1 ? 's' : ''} ({n}-Sharing)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rent / Bed (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.rentPerBed}
                onChange={(e) => setForm({ ...form, rentPerBed: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
              <select
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
              >
                <option value="Non-AC">Non-AC</option>
                <option value="AC">AC</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  checked={form.hasBathroom}
                  onChange={(e) => setForm({ ...form, hasBathroom: e.target.checked })}
                />
                Attached Bathroom
              </label>
            </div>
          </div>

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
              {loading ? 'Adding...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
