import React, { useState, useEffect } from 'react';
import { Property, Room } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Plus, Search, Trash2, UserPlus, CheckCircle2 } from 'lucide-react';

interface RoomsViewProps {
  property: Property;
  onOpenAddRoom: () => void;
  onAssignBed: (roomId: number) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({ property, onOpenAddRoom, onAssignBed }) => {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVacancy, setFilterVacancy] = useState<'all' | 'vacant' | 'full'>('all');

  const loadRooms = async () => {
    try {
      const data = await api.getRooms(property.id);
      setRooms(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [property.id]);

  const handleDeleteRoom = async (roomId: number, roomNumber: string) => {
    if (!confirm(`Are you sure you want to delete Room ${roomNumber}? This will remove all beds in this room.`)) {
      return;
    }
    try {
      await api.deleteRoom(roomId);
      showToast(`Room ${roomNumber} deleted successfully`);
      loadRooms();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredRooms = rooms
    .filter((r) => r.room_number.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => {
      if (filterVacancy === 'vacant') return r.vacant > 0;
      if (filterVacancy === 'full') return r.vacant === 0;
      return true;
    });

  const totalBeds = rooms.reduce((s, r) => s + r.capacity, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.occupied, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rooms & Bed Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">
            Total {rooms.length} rooms · {occupiedBeds}/{totalBeds} beds occupied ({totalBeds - occupiedBeds} available)
          </p>
        </div>
        <button
          onClick={onOpenAddRoom}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search room number..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={filterVacancy}
          onChange={(e) => setFilterVacancy(e.target.value as any)}
        >
          <option value="all">All Rooms ({rooms.length})</option>
          <option value="vacant">Has Vacancy</option>
          <option value="full">Full Occupancy</option>
        </select>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-semibold animate-pulse text-sm">
          Loading rooms and bed status...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-medium text-xs">
          No rooms match the current search or filters. Click &quot;Add New Room&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              {/* Room Top */}
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900">Room {room.room_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Floor {room.floor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                      <span>{room.room_type}</span>
                      <span>·</span>
                      <span>₹{room.rent_per_bed}/bed</span>
                      {room.has_bathroom ? (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600 font-semibold">Attached Bath</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      room.vacant === 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {room.occupied}/{room.capacity} Beds
                  </span>
                </div>

                {/* Beds visual layout */}
                <div className="grid grid-cols-2 gap-2.5 my-4">
                  {room.beds.map((bed) => {
                    const isOccupied = bed.status === 'occupied';
                    return (
                      <div
                        key={bed.id}
                        className={`p-3 rounded-2xl border text-center flex flex-col justify-between min-h-[74px] ${
                          isOccupied
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/50 border-dashed border-amber-300 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span>Bed {bed.bed_number}</span>
                          {isOccupied ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-700">
                              Vacant
                            </span>
                          )}
                        </div>

                        <div className="truncate text-xs font-bold mt-1">
                          {isOccupied ? (
                            <span>{bed.tenant_name || 'Occupied'}</span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">Available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Foot Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="font-semibold text-slate-500">
                  {room.vacant > 0 ? (
                    <strong className="text-emerald-600">{room.vacant} bed(s) free</strong>
                  ) : (
                    <span className="text-slate-400">Fully Occupied</span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  {room.vacant > 0 && (
                    <button
                      onClick={() => onAssignBed(room.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold text-xs transition"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Assign</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRoom(room.id, room.room_number)}
                    title="Delete Room"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
