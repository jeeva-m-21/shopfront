'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import { Button } from '../../components/ui/button.js';
import { Card } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';

interface LocalityOption {
  id: number;
  name: string;
}

interface MerchantApplyFormProps {
  localities: LocalityOption[];
}

export function MerchantApplyForm({ localities }: MerchantApplyFormProps) {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<'repair_service' | 'salon_wellness' | 'food_beverage'>('repair_service');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [localityName, setLocalityName] = useState(localities[0]?.name || 'Adyar');
  const [phone, setPhone] = useState('+91');
  const [whatsapp, setWhatsapp] = useState('+91');
  const [ownerName, setOwnerName] = useState('');
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successData, setSuccessData] = useState<{
    slug: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!consent) {
      setError('You must confirm ownership and consent to be listed on Shopfront.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/merchant/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_name: businessName.trim(),
          category,
          description: description.trim(),
          address: address.trim(),
          locality_name: localityName,
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          owner_name: ownerName.trim(),
          consent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Failed to submit application.');
        if (data.error?.details) {
          setFieldErrors(data.error.details);
        }
      } else {
        setSuccessData({
          slug: data.data.slug,
          message: data.data.message,
        });
      }
    } catch {
      setError('Network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <Card className="p-8 sm:p-12 text-center bg-white border-brand-200 shadow-elevated max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <Badge variant="success" className="text-xs px-3 py-1 mb-4">
          Application Received
        </Badge>

        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
          Welcome to the Shopfront Merchant Network!
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto">
          {successData.message}
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono mb-8 text-left space-y-1">
          <div><span className="font-semibold text-slate-500">Business:</span> {businessName}</div>
          <div><span className="font-semibold text-slate-500">Locality:</span> {localityName}</div>
          <div><span className="font-semibold text-slate-500">Registration Slug:</span> {successData.slug}</div>
          <div><span className="font-semibold text-slate-500">Status:</span> Draft (Verification In Progress)</div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`https://wa.me/919840110112?text=Hi%20Shopfront%20Team%2C%20I%20just%20submitted%20my%20merchant%20application%20for%20%22${encodeURIComponent(
              businessName
            )}%22%20(${successData.slug}).%20Please%20verify%20my%20store!`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700">
              <MessageCircle className="w-4 h-4 mr-2" />
              <span>Speed up via WhatsApp</span>
            </Button>
          </a>

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              setSuccessData(null);
              setBusinessName('');
              setDescription('');
              setAddress('');
              setOwnerName('');
              setPhone('+91');
              setWhatsapp('+91');
              setConsent(false);
            }}
          >
            Submit Another Store
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-10 bg-white border-slate-200 shadow-elevated">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Business Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Store or Business Name *
            </label>
            <input
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Adyar Mac & iPhone Care"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {fieldErrors.business_name && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.business_name[0]}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'repair_service' | 'salon_wellness' | 'food_beverage')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="repair_service">Mobile / Laptop / Electronics Repair</option>
              <option value="salon_wellness">Salon, Spa & Wellness</option>
              <option value="food_beverage">Cafe, Bakery & Dining</option>
            </select>
          </div>

          {/* Locality */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chennai Locality *
            </label>
            <select
              value={localityName}
              onChange={(e) => setLocalityName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {localities.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Full Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Store Address (Street & Door Number) *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="e.g. Shop 4, Gandhi Nagar 2nd Main Road, Adyar, Chennai 600020"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Business Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Business Description & Top Offerings *
            </label>
            <textarea
              required
              rows={3}
              maxLength={500}
              placeholder="Tell customers what you specialize in (e.g., iPhone screen replacement in 30 minutes, certified technician, 90 days warranty)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-[11px] text-slate-400">{description.length}/500 characters</span>
          </div>

          {/* Owner / Contact Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Owner or Manager Name *
            </label>
            <input
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Suresh Kumar"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Primary Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Store Phone Number (+91XXXXXXXXXX) *
            </label>
            <input
              type="text"
              required
              placeholder="+914424410112"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          {/* WhatsApp Number */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              WhatsApp Enquiry Number (+91[6-9]XXXXXXXXX) *
            </label>
            <input
              type="text"
              required
              placeholder="+919840110112"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Customers and AI agents will send enquiries directly to this WhatsApp number.
            </p>
          </div>
        </div>

        {/* Consent check */}
        <div className="pt-4 border-t border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>
              I confirm that I am the authorized owner or manager of this business and agree to be listed in the Shopfront directory and MCP protocol with zero commission fees.
            </span>
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          className="w-full py-3 font-semibold text-base shadow-md"
        >
          <Send className="w-4 h-4 mr-2" />
          <span>{loading ? 'Submitting Application...' : 'Submit Merchant Application (Free)'}</span>
        </Button>
      </form>
    </Card>
  );
}
