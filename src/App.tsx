import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, OwnerTab } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Login } from './pages/Login';
import { Dashboard } from './pages/owner/Dashboard';
import { RoomsView } from './pages/owner/RoomsView';
import { TenantsView } from './pages/owner/TenantsView';
import { RentPaymentsView } from './pages/owner/RentPaymentsView';
import { RemindersView } from './pages/owner/RemindersView';
import { ExpensesReportsView } from './pages/owner/ExpensesReportsView';
import { ComplaintsView } from './pages/owner/ComplaintsView';
import { NoticesView } from './pages/owner/NoticesView';
import { BackupView } from './pages/owner/BackupView';
import { TenantPortal } from './pages/tenant/TenantPortal';
import { SuperAdminPortal } from './pages/superadmin/SuperAdminPortal';

// Modals
import { RoomModal } from './components/RoomModal';
import { TenantModal } from './components/TenantModal';
import { PaymentModal } from './components/PaymentModal';
import { ExpenseModal } from './components/ExpenseModal';
import { NoticeModal } from './components/NoticeModal';
import { ReceiptModal } from './components/ReceiptModal';
import { api } from './services/api';
import { Payment, Room, Tenant } from './types';

export const App: React.FC = () => {
  const { user, token, activeProperty, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<OwnerTab>('dashboard');

  // Modals state
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [presetRoomId, setPresetRoomId] = useState<number | undefined>();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);

  // Loaded rooms & tenants for modal dropdowns
  const [modalRooms, setModalRooms] = useState<Room[]>([]);
  const [modalTenants, setModalTenants] = useState<Tenant[]>([]);

  // Mobile 'More' menu drawer
  const [showMobileMore, setShowMobileMore] = useState(false);

  const fetchModalData = async () => {
    if (!activeProperty) return;
    try {
      const [r, t] = await Promise.all([
        api.getRooms(activeProperty.id),
        api.getTenants(activeProperty.id, 'active'),
      ]);
      setModalRooms(r);
      setModalTenants(t);
    } catch (e) {
      console.error('Error fetching modal reference data:', e);
    }
  };

  const handleOpenAddTenant = (roomId?: number) => {
    setEditingTenant(null);
    setPresetRoomId(roomId);
    fetchModalData().then(() => setShowTenantModal(true));
  };

  const handleOpenEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setPresetRoomId(tenant.room_id);
    fetchModalData().then(() => setShowTenantModal(true));
  };

  const handleOpenRecordPayment = () => {
    fetchModalData().then(() => setShowPaymentModal(true));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center font-black text-2xl animate-bounce mb-4 shadow-xl">
          S
        </div>
        <p className="text-sm font-bold text-slate-300">Initializing StayDesk...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Login />;
  }

  // Tenant Resident Portal View
  if (user.role === 'tenant') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 p-4 sm:p-8">
          <TenantPortal />
        </main>
      </div>
    );
  }

  // Super Admin Platform Administration View
  if (user.role === 'superadmin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 p-4 sm:p-8">
          <SuperAdminPortal />
        </main>
      </div>
    );
  }

  // PG Owner Multi-Property Management View
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        propertyName={activeProperty?.name}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-4 sm:p-8 pb-20 md:pb-8 max-w-7xl w-full mx-auto">
          {!activeProperty ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">No properties assigned</h2>
              <p className="text-xs text-slate-500 mt-1">
                Please contact the platform super administrator to assign a PG property.
              </p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <Dashboard
                  property={activeProperty}
                  onNavigate={setCurrentTab}
                  onOpenAddTenant={() => handleOpenAddTenant()}
                  onOpenRecordPayment={handleOpenRecordPayment}
                  onOpenAddExpense={() => setShowExpenseModal(true)}
                />
              )}

              {currentTab === 'rooms' && (
                <RoomsView
                  property={activeProperty}
                  onOpenAddRoom={() => setShowRoomModal(true)}
                  onAssignBed={(roomId) => handleOpenAddTenant(roomId)}
                />
              )}

              {currentTab === 'tenants' && (
                <TenantsView
                  property={activeProperty}
                  onOpenAddTenant={() => handleOpenAddTenant()}
                  onEditTenant={handleOpenEditTenant}
                />
              )}

              {currentTab === 'rent' && (
                <RentPaymentsView
                  property={activeProperty}
                  onOpenRecordPayment={handleOpenRecordPayment}
                  onViewReceipt={setActiveReceipt}
                />
              )}

              {currentTab === 'reminders' && (
                <RemindersView
                  property={activeProperty}
                  onViewReceipt={setActiveReceipt}
                />
              )}

              {currentTab === 'expenses' && (
                <ExpensesReportsView
                  property={activeProperty}
                  onOpenAddExpense={() => setShowExpenseModal(true)}
                />
              )}

              {currentTab === 'complaints' && (
                <ComplaintsView property={activeProperty} />
              )}

              {currentTab === 'notices' && (
                <NoticesView
                  property={activeProperty}
                  onOpenAddNotice={() => setShowNoticeModal(true)}
                />
              )}

              {currentTab === 'backup' && (
                <BackupView property={activeProperty} />
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenMore={() => setShowMobileMore(true)}
        />
      </div>

      {/* Mobile More Sheet / Drawer */}
      {showMobileMore && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm md:hidden">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-800">More Management Views</span>
              <button
                onClick={() => setShowMobileMore(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>
            {(['reminders', 'complaints', 'notices', 'backup'] as OwnerTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setCurrentTab(tab);
                  setShowMobileMore(false);
                }}
                className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-100 text-xs font-bold text-slate-700 capitalize"
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Modals */}
      {activeProperty && showRoomModal && (
        <RoomModal
          propertyId={activeProperty.id}
          onClose={() => setShowRoomModal(false)}
          onSuccess={() => {
            fetchModalData();
          }}
        />
      )}

      {activeProperty && showTenantModal && (
        <TenantModal
          propertyId={activeProperty.id}
          rooms={modalRooms}
          editingTenant={editingTenant}
          presetRoomId={presetRoomId}
          onClose={() => setShowTenantModal(false)}
          onSuccess={() => {
            fetchModalData();
          }}
        />
      )}

      {activeProperty && showPaymentModal && (
        <PaymentModal
          propertyId={activeProperty.id}
          tenants={modalTenants}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(receipt) => {
            if (receipt) setActiveReceipt(receipt);
            fetchModalData();
          }}
        />
      )}

      {activeProperty && showExpenseModal && (
        <ExpenseModal
          propertyId={activeProperty.id}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {}}
        />
      )}

      {activeProperty && showNoticeModal && (
        <NoticeModal
          propertyId={activeProperty.id}
          onClose={() => setShowNoticeModal(false)}
          onSuccess={() => {}}
        />
      )}

      <ReceiptModal
        payment={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />
    </div>
  );
};
