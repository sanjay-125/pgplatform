import React from 'react';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

interface SkeletonBoxProps {
  className?: string;
}

/** A single animated shimmer rectangle. */
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`bg-slate-200 motion-safe:animate-pulse rounded ${className}`}
  />
);

interface SkeletonTextProps {
  className?: string;
  width?: string;
}

/** An animated text-line shimmer. */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  className = '',
  width = 'w-full',
}) => (
  <div
    aria-hidden="true"
    className={`bg-slate-200 motion-safe:animate-pulse rounded h-4 ${width} ${className}`}
  />
);

// ---------------------------------------------------------------------------
// Table primitives
// ---------------------------------------------------------------------------

interface TableRowSkeletonProps {
  cols: number;
  className?: string;
}

/** A full table row with `cols` shimmer cells. */
export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
  cols,
  className = '',
}) => (
  <tr className={className}>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <SkeletonBox
          className={`h-4 ${
            i === 0
              ? 'w-28'
              : i === cols - 1
              ? 'w-16 ml-auto'
              : i % 2 === 0
              ? 'w-24'
              : 'w-20'
          }`}
        />
      </td>
    ))}
  </tr>
);

interface TableSkeletonProps {
  cols: number;
  rows?: number;
  className?: string;
}

/**
 * A complete table skeleton: one header row followed by
 * `rows` data-row skeletons.
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  cols,
  rows = 5,
  className = '',
}) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading table data..."
    className={`w-full overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
  >
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead>
        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="pb-3 pt-4 px-4">
              <SkeletonBox className="h-3 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <TableRowSkeleton key={r} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

// ---------------------------------------------------------------------------
// Card skeletons
// ---------------------------------------------------------------------------

interface CardSkeletonProps {
  className?: string;
}

/**
 * Card-shaped skeleton matching generic cards.
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({ className = '' }) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading..."
    className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 ${className}`}
  >
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-5 w-20 rounded-full" />
      <SkeletonBox className="h-5 w-12 rounded-full" />
    </div>
    <SkeletonBox className="h-5 w-3/4 rounded-lg mt-1" />
    <SkeletonBox className="h-3.5 w-full mt-1" />
    <SkeletonBox className="h-3.5 w-5/6" />
    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="h-8 w-20 rounded-xl" />
    </div>
  </div>
);

/**
 * Mimics the real StatCard layout:
 * label (xs uppercase) | icon placeholder, then big value + subtitle
 */
export const StatCardSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading metric..."
    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
  >
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="h-8 w-8 rounded-xl" />
    </div>
    <div className="mt-3">
      <SkeletonBox className="h-7 w-28 rounded-lg" />
      <SkeletonBox className="h-3 w-36 mt-2" />
    </div>
  </div>
);

/**
 * Mimics room card in RoomsView.tsx (with bed matrix placeholders).
 */
export const RoomCardSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading room..."
    className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between"
  >
    <div>
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-6 w-24 rounded-lg" />
            <SkeletonBox className="h-4 w-14 rounded-full" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <SkeletonBox className="h-3 w-16" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        </div>
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>

      {/* Beds visual layout 2x2 grid */}
      <div className="grid grid-cols-2 gap-2.5 my-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-2xl border border-slate-100 bg-slate-50 min-h-[74px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-2.5 w-12" />
              <SkeletonBox className="h-3.5 w-3.5 rounded-full" />
            </div>
            <SkeletonBox className="h-3 w-20 mt-1" />
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
      <SkeletonBox className="h-4 w-24" />
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-7 w-16 rounded-lg" />
        <SkeletonBox className="h-7 w-7 rounded-lg" />
      </div>
    </div>
  </div>
);

/** Grid of 6 room card skeletons (3-col). */
export const RoomsGridSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading rooms and bed status..."
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <RoomCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Notice card skeleton matching NoticesView.tsx.
 */
export const NoticeCardSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading announcement..."
    className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <SkeletonBox className="w-5 h-5 rounded-lg" />
        <SkeletonBox className="h-5 w-40 rounded-lg" />
      </div>
      <SkeletonBox className="h-5 w-16 rounded-md" />
    </div>
    <SkeletonBox className="h-3 w-full" />
    <SkeletonBox className="h-3 w-4/5" />
    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
      <SkeletonBox className="w-3.5 h-3.5 rounded" />
      <SkeletonBox className="h-3 w-28" />
    </div>
  </div>
);

/**
 * Complaint card skeleton matching ComplaintsView.tsx.
 */
export const ComplaintCardSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading maintenance request..."
    className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-5 w-48 rounded-lg" />
          <SkeletonBox className="h-4 w-16 rounded-md" />
        </div>
        <SkeletonBox className="h-3 w-64" />
      </div>
      <SkeletonBox className="h-6 w-24 rounded-full" />
    </div>
    <div className="p-3.5 rounded-2xl bg-slate-50 space-y-1.5">
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-3/4" />
    </div>
    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
      <SkeletonBox className="h-3 w-32" />
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-7 w-28 rounded-lg" />
        <SkeletonBox className="h-7 w-28 rounded-lg" />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Page-level skeletons
// ---------------------------------------------------------------------------

/** Full dashboard page skeleton: banner + 4 stat cards + 2-col visual grid + table. */
export const DashboardSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading property dashboard..."
    className="space-y-6"
  >
    {/* Welcome Banner Skeleton */}
    <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-3">
        <div className="h-5 w-32 rounded-full bg-brand-700/60 motion-safe:animate-pulse" />
        <div className="h-8 w-64 rounded-xl bg-brand-700/40 motion-safe:animate-pulse" />
        <div className="h-4 w-96 max-w-full rounded bg-brand-700/20 motion-safe:animate-pulse" />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="h-10 w-32 rounded-xl bg-white/20 motion-safe:animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-emerald-500/30 motion-safe:animate-pulse" />
        <div className="h-10 w-28 rounded-xl bg-slate-800 motion-safe:animate-pulse" />
      </div>
    </div>

    {/* Metric Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Secondary 2-col visual grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 space-y-2">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <SkeletonBox className="h-5 w-32" />
            <SkeletonBox className="h-3 w-20" />
          </div>
          <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 flex flex-col items-center justify-center py-6 space-y-2">
            <SkeletonBox className="h-10 w-24" />
            <SkeletonBox className="h-3 w-36" />
          </div>
        </div>
      </div>
    </div>

    {/* Outstanding Rent Attention Table */}
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonBox className="h-5 w-44" />
          <SkeletonBox className="h-3 w-64" />
        </div>
        <SkeletonBox className="h-4 w-36" />
      </div>
      <TableSkeleton cols={6} rows={4} className="border-0 shadow-none rounded-none" />
    </div>
  </div>
);

/**
 * TenantPortal skeleton:
 * banner + 3 overview cards + roommates + payment table rows (5 cols).
 */
export const TenantPortalSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading your personal tenant portal..."
    className="max-w-5xl mx-auto space-y-8 pb-12"
  >
    {/* Banner */}
    <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-3">
        <div className="h-5 w-36 rounded-full bg-brand-700/60 motion-safe:animate-pulse" />
        <div className="h-8 w-48 rounded-xl bg-brand-700/40 motion-safe:animate-pulse" />
        <div className="h-4 w-72 rounded bg-brand-700/20 motion-safe:animate-pulse" />
      </div>
      <div className="h-10 w-48 rounded-xl bg-slate-800 motion-safe:animate-pulse" />
    </div>

    {/* 3 Overview Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Roommates Card Skeleton */}
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-5 w-5 rounded" />
        <SkeletonBox className="h-5 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-3 w-20" />
            <SkeletonBox className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>

    {/* Payments History Skeleton */}
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-5 w-5 rounded" />
        <SkeletonBox className="h-5 w-48" />
      </div>
      <TableSkeleton cols={5} rows={3} className="border-0 shadow-none rounded-none" />
    </div>
  </div>
);

/**
 * SuperAdmin skeleton:
 * banner + 4 stat cards + properties table (6 cols) + audit log table (4 cols).
 */
export const SuperAdminSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading platform administrator dashboard..."
    className="max-w-6xl mx-auto space-y-8 pb-12"
  >
    {/* Header Banner */}
    <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-3">
        <div className="h-5 w-36 rounded-full bg-purple-800/60 motion-safe:animate-pulse" />
        <div className="h-8 w-64 rounded-xl bg-purple-800/40 motion-safe:animate-pulse" />
        <div className="h-4 w-96 max-w-full rounded bg-purple-800/20 motion-safe:animate-pulse" />
      </div>
      <div className="h-10 w-44 rounded-xl bg-purple-500/30 motion-safe:animate-pulse" />
    </div>

    {/* Platform Metric Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Properties Table Skeleton */}
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonBox className="h-5 w-36" />
          <SkeletonBox className="h-3 w-56" />
        </div>
      </div>
      <TableSkeleton cols={6} rows={4} className="border-0 shadow-none rounded-none" />
    </div>

    {/* Audit Log Table Skeleton */}
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-5 w-5 rounded" />
        <SkeletonBox className="h-5 w-36" />
      </div>
      <TableSkeleton cols={4} rows={5} className="border-0 shadow-none rounded-none" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Spinners
// ---------------------------------------------------------------------------

interface InlineSpinnerProps {
  className?: string;
  size?: number;
}

/** Tiny spin-only SVG, no label. */
export const InlineSpinner: React.FC<InlineSpinnerProps> = ({
  className = '',
  size = 16,
}) => (
  <svg
    aria-hidden="true"
    focusable="false"
    className={`motion-safe:animate-spin text-current shrink-0 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={size}
    height={size}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

interface ButtonSpinnerProps {
  label: string;
  className?: string;
  spinnerSize?: number;
}

/** Inline spinner + text label, suitable for loading button states. */
export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({
  label,
  className = '',
  spinnerSize = 16,
}) => (
  <span
    role="status"
    aria-busy="true"
    aria-label={label}
    className={`inline-flex items-center justify-center gap-2 ${className}`}
  >
    <InlineSpinner size={spinnerSize} />
    <span>{label}</span>
  </span>
);

// ---------------------------------------------------------------------------
// App init / splash skeleton
// ---------------------------------------------------------------------------

/**
 * Full-screen splash skeleton shown while the session is being restored.
 * Dark background (`bg-slate-900`) matching the real app init screen.
 */
export const AppInitSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Initializing StayDesk..."
    className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-4"
  >
    <div
      aria-hidden="true"
      className="w-12 h-12 rounded-2xl bg-brand-600/90 flex items-center justify-center font-black text-2xl mb-4 shadow-xl motion-safe:animate-pulse"
    >
      S
    </div>
    <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
      <InlineSpinner size={16} className="text-brand-400" />
      <span>Initializing StayDesk...</span>
    </div>
    <div className="flex flex-col gap-2.5 w-full max-w-xs mt-8">
      <div className="h-2 rounded bg-slate-800 motion-safe:animate-pulse w-full" />
      <div className="h-2 rounded bg-slate-800 motion-safe:animate-pulse w-4/5 mx-auto" />
      <div className="h-2 rounded bg-slate-800 motion-safe:animate-pulse w-3/5 mx-auto" />
    </div>
  </div>
);
