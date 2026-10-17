'use client';

import React, { useState, useTransition } from 'react';
import {
  saveWeeklyHoursAction,
  addClosureAction,
  removeClosureAction,
} from './actions.js';
import type { ShopHourInterval } from '../../../domain/hours.js';
import type { ShopClosureRecord, OwnerHoursAndClosuresData } from '../../../owner/hours-ops.js';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function HoursManager({ initialData }: { initialData: OwnerHoursAndClosuresData }) {
  const [intervals, setIntervals] = useState<ShopHourInterval[]>(initialData.intervals);
  const [closures, setClosures] = useState<ShopClosureRecord[]>(initialData.closures);
  const [isPending, startTransition] = useTransition();

  const [hoursError, setHoursError] = useState<string | null>(null);
  const [hoursSuccess, setHoursSuccess] = useState<string | null>(null);

  const [closureError, setClosureError] = useState<string | null>(null);
  const [closureSuccess, setClosureSuccess] = useState<string | null>(null);

  const [newClosureDate, setNewClosureDate] = useState('');
  const [newClosureReason, setNewClosureReason] = useState('');

  // Minimum date for closure is today in local time
  const todayIso = new Date().toISOString().slice(0, 10);

  const handleAddShift = (weekday: number) => {
    setIntervals((prev) => [
      ...prev,
      { weekday, open_time: '09:00', close_time: '18:00' },
    ]);
  };

  const handleRemoveShift = (index: number) => {
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateShift = (index: number, field: 'open_time' | 'close_time', val: string) => {
    setIntervals((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSaveHours = () => {
    setHoursError(null);
    setHoursSuccess(null);
    startTransition(async () => {
      const res = await saveWeeklyHoursAction(intervals);
      if (!res.success && res.error) {
        setHoursError(res.error);
      } else {
        setHoursSuccess('Weekly hours saved successfully!');
      }
    });
  };

  const handleAddClosure = (e: React.FormEvent) => {
    e.preventDefault();
    setClosureError(null);
    setClosureSuccess(null);

    if (!newClosureDate) {
      setClosureError('Please select a date.');
      return;
    }

    startTransition(async () => {
      const res = await addClosureAction(newClosureDate, newClosureReason);
      if (!res.success && res.error) {
        setClosureError(res.error);
      } else {
        setClosureSuccess(`Closure for ${newClosureDate} added.`);
        setNewClosureDate('');
        setNewClosureReason('');
        window.location.reload();
      }
    });
  };

  const handleRemoveClosure = (closureId: string, dateStr: string) => {
    if (!confirm(`Remove closure for ${dateStr}?`)) return;
    setClosureError(null);
    setClosureSuccess(null);

    startTransition(async () => {
      const res = await removeClosureAction(closureId);
      if (!res.success && res.error) {
        setClosureError(res.error);
      } else {
        setClosures((prev) => prev.filter((c) => c.id !== closureId));
        setClosureSuccess('Closure removed.');
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hours Rule Text Alert */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px 20px',
          color: '#1e3a8a',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        <strong>Opening Hours Guidelines:</strong> If closing time is earlier than opening time,
        the shop closes after midnight on the next day. For 24 hours, use 00:00 to 23:59.
      </div>

      {/* Weekly Schedule Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Weekly Operating Schedule
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
              Add operating intervals for each day of the week. Days without intervals will be shown as closed.
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveHours}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Saving...' : 'Save Weekly Hours'}
          </button>
        </div>

        {hoursError && (
          <div
            role="alert"
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {hoursError}
          </div>
        )}

        {hoursSuccess && (
          <div
            role="status"
            style={{
              padding: '12px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {hoursSuccess}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {WEEKDAYS.map((dayName, weekdayIndex) => {
            const dayIntervals = intervals
              .map((interval, originalIdx) => ({ ...interval, originalIdx }))
              .filter((i) => i.weekday === weekdayIndex);

            return (
              <div
                key={dayName}
                style={{
                  border: '1px solid #f3f4f6',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  backgroundColor: dayIntervals.length > 0 ? '#ffffff' : '#fafafa',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ minWidth: '120px' }}>
                  <strong style={{ fontSize: '14px', color: '#111827' }}>{dayName}</strong>
                  {dayIntervals.length === 0 && (
                    <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af' }}>Closed</span>
                  )}
                </div>

                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayIntervals.map((shift) => (
                    <div
                      key={shift.originalIdx}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <input
                        type="time"
                        value={shift.open_time}
                        onChange={(e) =>
                          handleUpdateShift(shift.originalIdx, 'open_time', e.target.value)
                        }
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      />
                      <span style={{ color: '#6b7280', fontSize: '13px' }}>to</span>
                      <input
                        type="time"
                        value={shift.close_time}
                        onChange={(e) =>
                          handleUpdateShift(shift.originalIdx, 'close_time', e.target.value)
                        }
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveShift(shift.originalIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b91c1c',
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddShift(weekdayIndex)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  + Add Shift
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled Closures Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Planned Closures
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
            Schedule one-off full day closures (holidays, maintenance). Past closures are automatically archived.
          </p>
        </div>

        {closureError && (
          <div
            role="alert"
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {closureError}
          </div>
        )}

        {closureSuccess && (
          <div
            role="status"
            style={{
              padding: '12px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {closureSuccess}
          </div>
        )}

        {/* Add Closure Form */}
        <form
          onSubmit={handleAddClosure}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div>
            <label
              htmlFor="closure_date"
              style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}
            >
              Closure Date *
            </label>
            <input
              id="closure_date"
              type="date"
              min={todayIso}
              value={newClosureDate}
              onChange={(e) => setNewClosureDate(e.target.value)}
              required
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label
              htmlFor="closure_reason"
              style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}
            >
              Reason (optional, max 100 chars)
            </label>
            <input
              id="closure_reason"
              type="text"
              maxLength={100}
              value={newClosureReason}
              onChange={(e) => setNewClosureReason(e.target.value)}
              placeholder="e.g. Pongal Holiday, Deep Cleaning"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '9px 18px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            + Add Closure
          </button>
        </form>

        {/* Existing Closures List */}
        {closures.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic', margin: 0 }}>
            No upcoming closures scheduled.
          </p>
        ) : (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Reason</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {closures.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111827' }}>
                      {c.closed_on}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      {c.reason || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleRemoveClosure(c.id, c.closed_on)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b91c1c',
                          fontSize: '13px',
                          cursor: isPending ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
