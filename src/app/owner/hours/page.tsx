import React from 'react';
import { Clock } from 'lucide-react';
import { requireOwner } from '../../../auth/guards.js';
import { getOwnerHoursAndClosures } from '../../../owner/hours-ops.js';
import { HoursManager } from './HoursManager.js';

export default async function OwnerHoursPage() {
  const { user } = await requireOwner('/owner/hours');

  let data;
  try {
    data = await getOwnerHoursAndClosures(user.id);
  } catch {
    return (
      <div className="py-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-md mx-auto shadow-paper">
          <Clock className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h1 className="font-display text-xl text-stone-900 mb-1">Operating Hours</h1>
          <p className="text-xs text-stone-500 font-sans">
            No shop is assigned to your account yet. Contact the admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal text-stone-900">
          Operating Hours & Planned Closures
        </h1>
        <p className="text-xs text-stone-500 font-sans mt-0.5">
          Keep your schedule up to date so customers and AI agents know when your business is open in Asia/Kolkata (IST).
        </p>
      </div>

      <HoursManager initialData={data} />
    </div>
  );
}
