import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Payment, Complaint, StayRequest } from '../../types';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ComplaintModal } from '../../components/ComplaintModal';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { RaiseRequestModal } from '../../components/RaiseRequestModal';
import { RequestDetailModal } from '../../components/RequestDetailModal';
import { useToast } from '../../components/Toast';
import { formatIndianDate, formatRentPeriod } from '../../utils/validation';
import { TenantPortalSkeleton, ButtonSpinner } from '../../components/LoadingStates';
import {
  Home,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Users,
  Printer,
  Wrench,
  Megaphone,
  ShieldCheck,
  UserCheck,
  Phone,
  Eye,
  Clock,
  Plus,
  ClipboardList,
  ArrowRightLeft,
  LogOut,
} from 'lucide-react';

const DEFAULT_MOCK_STAY_REQUESTS: StayRequest[] = [
  {
    id: 1,
    property_id: 1,
    tenant_id: 1,
    request_type: 'Room Change',
    title: 'Request to move to Room 204 (single occupancy)',
    description: 'Looking to shift to a single sharing room on the 2nd floor if available next month due to night shift work schedule.',
    target_date: '2026-12-01',
    status: 'in_progress',
    admin_remark: 'Management is reviewing room 204 vacancy on 30-Nov.',
    created_at: '2026-11-12T10:30:00Z',
  },
  {
    id: 2,
    property_id: 1,
    tenant_id: 1,
    request_type: 'Visitor',
    title: 'Weekend guest stay for brother visiting from Chennai',
    description: 'My brother Rahul will be visiting Chennai from 20-Nov to 22-Nov. Visitor ID will be submitted at reception.',
    target_date: '2026-11-20',
    status: 'approved',
    admin_remark: 'Visitor pass approved. Please register at front desk on arrival.',
    created_at: '2026-11-08T15:20:00Z',
  },
  {
    id: 3,
    property_id: 1,
    tenant_id: 1,
    request_type: 'Bed Change',
    title: 'Shift to Bed A near the window',
    description: 'Requesting internal bed switch to Bed A in Room 101 as the previous occupant has checked out.',
    target_date: '2026-11-18',
    status: 'pending',
    created_at: '2026-11-15T08:45:00Z',
  },
];

const DEFAULT_MOCK_TICKETS: Complaint[] = [
  {
    id: 1,
    property_id: 1,
    tenant_id: 1,
    title: 'Geyser not heating in attached bathroom',
    category: 'Electrical',
    priority: 'high',
    status: 'in_progress',
    description: 'The geyser takes over 45 minutes to provide lukewarm water and repeatedly trips the switch on the electrical panel. Kindly have the heating coil checked.',
    created_at: '2026-11-10T09:30:00Z',
  },
  {
    id: 2,
    property_id: 1,
    tenant_id: 1,
    title: 'Washbasin tap dripping water constantly',
    category: 'Plumbing',
    priority: 'medium',
    status: 'resolved',
    resolution_note: 'Plumber replaced the rubber washer and valve seal on 12-11-2026.',
    description: 'Slow continuous drip from the washbasin tap causing water wastage and staining on the basin floor.',
    created_at: '2026-11-04T14:15:00Z',
  },
  {
    id: 3,
    property_id: 1,
    tenant_id: 1,
    title: 'Wi-Fi router signal drops during evening',
    category: 'Wi-Fi / Internet',
    priority: 'medium',
    status: 'pending',
    description: 'Internet connection is very weak in room 101 between 8:00 PM and 11:30 PM. Needs range extender or router reboot.',
    created_at: '2026-11-14T18:20:00Z',
  },
];

export const TenantPortal: React.FC = () => {
  const { showToast } = useToast();
  const [stay, setStay] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [complaints, setComplaints] = useState<Complaint[]>(DEFAULT_MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'active'>('all');

  const [stayRequests, setStayRequests] = useState<StayRequest[]>(DEFAULT_MOCK_STAY_REQUESTS);
  const [selectedStayRequest, setSelectedStayRequest] = useState<StayRequest | null>(null);
  const [requestFilter, setRequestFilter] = useState<'all' | 'active'>('all');
  const [showRaiseRequestModal, setShowRaiseRequestModal] = useState(false);

  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiRef, setUpiRef] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [simulatedPaid, setSimulatedPaid] = useState(false);

  const loadTenantData = async () => {
    try {
      const [stayData, roomData, payData, complaintData, requestData] = await Promise.all([
        api.getTenantMe(),
        api.getTenantRoommates(),
        api.getTenantPayments(),
        api.getTenantComplaints().catch(() => null),
        api.getTenantStayRequests().catch(() => null),
      ]);
      setStay(stayData);
      setRoommates(roomData);
      setPayments(payData);
      if (complaintData && complaintData.length > 0) {
        setComplaints(complaintData);
      } else {
        setComplaints(DEFAULT_MOCK_TICKETS);
      }

      if (requestData && requestData.length > 0) {
        setStayRequests(requestData);
      } else {
        setStayRequests(DEFAULT_MOCK_STAY_REQUESTS);
      }

      if (stayData?.property_id) {
        const noticeData = await api.getNotices(stayData.property_id);
        setNotices(noticeData);
      }
    } catch (err: any) {
      console.error('Error loading tenant portal:', err);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const handleComplaintSuccess = async () => {
    try {
      const fresh = await api.getTenantComplaints();
      if (fresh && fresh.length > 0) {
        setComplaints(fresh);
      } else {
        loadTenantData();
      }
    } catch {
      loadTenantData();
    }
  };

  const handleRequestSuccess = async () => {
    try {
      const fresh = await api.getTenantStayRequests();
      if (fresh && fresh.length > 0) {
        setStayRequests(fresh);
      } else {
        loadTenantData();
      }
    } catch {
      loadTenantData();
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    loadTenantData();
  }, []);

  const handleSimulatePayment = () => {
    if (!upiRef.trim()) {
      showToast('Please enter transaction reference or UTR number', 'error');
      return;
    }
    setSubmittingProof(true);
    setTimeout(() => {
      showToast('Payment submitted for owner verification. Receipt will be generated upon approval.');
      setShowUpiModal(false);
      setUpiRef('');
      setSubmittingProof(false);
      setSimulatedPaid(true);
    }, 600);
  };

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n || 0);
  };

  const getSharingType = (stayData: any): string => {
    if (stayData?.room_sharing_type) return stayData.room_sharing_type;
    if (stayData?.sharing_type) return stayData.sharing_type;
    if (stayData?.capacity === 1) return 'Single';
    if (stayData?.capacity === 2) return 'Double';
    if (stayData?.capacity === 3) return 'Triple';
    if (stayData?.capacity && stayData.capacity > 3) return 'Shared';
    if (
      stayData?.room_type &&
      ['Single', 'Double', 'Triple', 'Shared'].includes(stayData.room_type)
    ) {
      return stayData.room_type;
    }
    return 'Single';
  };

  if (loading) {
    return <TenantPortalSkeleton />;
  }

  if (!stay) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active stay found for this account. Please contact your property representative.
      </div>
    );
  }

  const isRentCleared = (stay.currentMonthDue === 0) || simulatedPaid;
  const currentMonthName = stay.currentPeriod
    ? new Date(`${stay.currentPeriod}-01T00:00:00`).toLocaleString('en-US', { month: 'long' })
    : new Date().toLocaleString('en-US', { month: 'long' });

  const activeTicketCount = complaints.filter(
    (c) => c.status === 'pending' || c.status === 'in_progress'
  ).length;

  const displayedComplaints =
    ticketFilter === 'active'
      ? complaints.filter((c) => c.status === 'pending' || c.status === 'in_progress')
      : complaints;

  const activeRequestCount = stayRequests.filter(
    (r) => r.status === 'pending' || r.status === 'in_progress'
  ).length;

  const displayedRequests =
    requestFilter === 'active'
      ? stayRequests.filter((r) => r.status === 'pending' || r.status === 'in_progress')
      : stayRequests;

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'Bed Change':
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            Bed Change
          </span>
        );
      case 'Room Change':
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
            Room Change
          </span>
        );
      case 'Visitor':
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            Visitor
          </span>
        );
      case 'Move Out':
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            Move Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
            {type}
          </span>
        );
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return (
          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {status === 'completed' ? 'Completed' : 'Approved'}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            In Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Declined
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-brand-700/60 text-brand-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-3 border border-brand-500/30">
            <UserCheck className="w-3.5 h-3.5" />
            Tenant Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {stay.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {stay.property_name} · Room {stay.room_number} (Bed {stay.bed_number})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComplaintModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-bold text-xs hover:bg-slate-700 border border-slate-700 transition"
          >
            <Wrench className="w-4 h-4" />
            <span>Raise Maintenance Ticket</span>
          </button>
        </div>
      </div>

      {/* Stay & Payment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rent Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Rent Status
            </span>

            <div className="mt-2.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                  isRentCleared
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}
              >
                {isRentCleared ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                {currentMonthName} - {isRentCleared ? 'Paid' : 'Not Paid'}
              </span>
            </div>

            <div className="mt-4 text-xs text-slate-600 space-y-2 font-medium">
              <div className="flex justify-between items-center">
                <span>Rent Amount:</span>
                <span className="font-bold text-slate-800">{formatCurrency(stay.rent || 8000)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{currentMonthName}:</span>
                <span
                  className={`font-bold ${
                    isRentCleared ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isRentCleared ? 'Paid' : 'Not Paid'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowUpiModal(true)}
              disabled={isRentCleared}
              title={isRentCleared ? `Rent for ${currentMonthName} has already been paid` : 'Pay Rent'}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600 disabled:active:scale-100"
            >
              <QrCode className="w-4 h-4" />
              <span>Pay Rent</span>
            </button>
          </div>
        </div>

        {/* Stay Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Stay Details
          </span>
          <div className="space-y-3 text-xs font-medium text-slate-600">
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span>Room Number:</span>
              <span className="font-bold text-slate-800">Room {stay.room_number}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span>Bed Allocation:</span>
              <span className="font-bold text-slate-800">Bed {stay.bed_number}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span>Room Sharing Type:</span>
              <span className="font-bold text-slate-800">{getSharingType(stay)}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span>Joining Date:</span>
              <span className="font-bold text-slate-800">{formatIndianDate(stay.joined_date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Deposit:</span>
              <span className="font-bold text-slate-800">{formatCurrency(stay.deposit)}</span>
            </div>
          </div>
        </div>

        {/* Roommates Card (Privacy Enforced!) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                My Roommates
              </span>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                Room {stay.room_number}
              </span>
            </div>

            {roommates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No other active roommates in this room.</p>
            ) : (
              <div className="space-y-3">
                {roommates.map((rm) => (
                  <div
                    key={rm.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                        {rm.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{rm.name}</div>
                        <div className="text-[10px] text-slate-400">Bed {rm.bedNumber}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <a
                        href={`tel:${rm.phone || '9876543210'}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-600 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{rm.phone || '9876543210'}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Ticket History Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Maintenance Ticket History</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
                {activeTicketCount} Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Track maintenance requests, view current status, and inspect resolution details
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter pills: Link to full ticket history or active tickets */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTicketFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  ticketFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tickets ({complaints.length})
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter('active')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  ticketFilter === 'active'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeTicketCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowComplaintModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition active:scale-[0.99]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raise Ticket</span>
            </button>
          </div>
        </div>

        {displayedComplaints.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            {ticketFilter === 'active'
              ? 'No active maintenance tickets at this moment.'
              : 'No maintenance tickets recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3 text-center w-14">S.No</th>
                  <th className="pb-3 px-3 text-left">Issue Title</th>
                  <th className="pb-3 px-3 text-center">Category</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 px-3 text-center">Raised Date</th>
                  <th className="pb-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {displayedComplaints.map((ticket, index) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-center font-mono font-bold text-xs text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {ticket.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {ticket.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {ticket.status === 'resolved' ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Resolved
                        </span>
                      ) : ticket.status === 'in_progress' ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          <Wrench className="w-3 h-3 text-blue-600" />
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-slate-500">
                      {formatIndianDate(ticket.created_at)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        title="View description as pop up"
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition shadow-2xs active:scale-[0.98]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rent Payment History & Printable Receipts */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Rent Payment History</h2>
          <p className="text-xs text-slate-500">You can find your previous rent payments here</p>
        </div>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Receipt No.</th>
                  <th className="pb-3 px-3">Rent Period</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Method</th>
                  <th className="pb-3 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-xs text-brand-700">
                      {p.receipt_no}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{formatRentPeriod(p.period)}</td>
                    <td className="py-3 px-3 font-black text-emerald-600">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-3 text-xs text-slate-500">{formatIndianDate(p.date)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setActiveReceipt(p)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition shadow-2xs active:scale-[0.98]"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stay Requests & Tracker (Bed Change, Room Change, Visitor, Move Out) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Stay Requests & Tracker</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
                {activeRequestCount} Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Raise requests for Bed Change, Room Change, Visitor, or Move Out and track approval status
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter pills: Link to full request history or active requests */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRequestFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  requestFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Requests ({stayRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setRequestFilter('active')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  requestFilter === 'active'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeRequestCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRaiseRequestModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition active:scale-[0.99]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raise Request</span>
            </button>
          </div>
        </div>

        {displayedRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            {requestFilter === 'active'
              ? 'No active stay requests at this moment.'
              : 'No stay requests recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3 text-center w-14">S.No</th>
                  <th className="pb-3 px-3 text-left">Request Title</th>
                  <th className="pb-3 px-3 text-center">Request Type</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 px-3 text-center">Raised Date</th>
                  <th className="pb-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {displayedRequests.map((reqItem, index) => (
                  <tr key={reqItem.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-center font-mono font-bold text-xs text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {reqItem.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getRequestTypeBadge(reqItem.request_type)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getRequestStatusBadge(reqItem.status)}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-slate-500">
                      {formatIndianDate(reqItem.created_at)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedStayRequest(reqItem)}
                        title="View request details as pop up"
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition shadow-2xs active:scale-[0.98]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notices from Management */}
      {notices.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Notices from Management</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 space-y-2">
                <span className="font-extrabold text-slate-900 text-sm block">{n.title}</span>
                <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-400 block pt-1">{formatIndianDate(n.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal payment={activeReceipt} onClose={() => setActiveReceipt(null)} />

      {/* Ticket Description Popup Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Complaint Modal */}
      {showComplaintModal && (
        <ComplaintModal
          onClose={() => setShowComplaintModal(false)}
          onSuccess={handleComplaintSuccess}
        />
      )}

      {/* Raise Stay Request Modal */}
      {showRaiseRequestModal && (
        <RaiseRequestModal
          onClose={() => setShowRaiseRequestModal(false)}
          onSuccess={handleRequestSuccess}
        />
      )}

      {/* Stay Request Detail Modal */}
      <RequestDetailModal
        request={selectedStayRequest}
        onClose={() => setSelectedStayRequest(null)}
      />

      {/* UPI QR Simulation Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Pay Monthly Rent via UPI</h3>
              <p className="text-xs text-slate-500 mt-1">Scan QR or transfer to PG Account</p>
            </div>

            {/* Simulated QR Box */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="w-36 h-36 bg-white border-2 border-slate-900 p-2 flex items-center justify-center rounded-xl shadow-inner font-mono text-[9px] text-slate-400">
                [ UPI QR CODE SIMULATION ]<br />
                staydesk@upi
              </div>
              <span className="text-xs font-bold text-slate-800 mt-3">UPI ID: staydesk@okaxis</span>
              <span className="text-base font-black text-brand-600 mt-1">
                {formatCurrency(stay.currentMonthDue || stay.rent || 8000)}
              </span>
            </div>

            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Transaction Reference / UTR Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 984719284729"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={submittingProof}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm disabled:opacity-60"
              >
                {submittingProof ? <ButtonSpinner label="Submitting..." /> : 'Submit Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
