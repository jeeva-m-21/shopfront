import { describe, it, expect } from 'vitest';
import { generateActionLink, type ActionLinkShop, type ActionLinkItem } from '@/domain/action-links';

describe('Action Links Domain Module (Pure Unit Tests)', () => {
  const baseShop: ActionLinkShop = {
    name: 'MacFix Care',
    category: 'repair_service',
    phone: '+919876543210',
    whatsapp: '+919876543210',
    action_mode: 'whatsapp',
  };

  const sampleItem: ActionLinkItem = {
    name: 'Screen Replacement',
    price_display: '₹8,500 – ₹14,500',
  };

  it('builds WhatsApp message and link without item', () => {
    const res = generateActionLink({ shop: baseShop });
    expect(res.action_mode).toBe('whatsapp');
    expect(res.message).toBe(
      'Hi MacFix Care, I found you on Shopfront and would like to enquire about your services. (via Shopfront)'
    );
    expect(res.url).toContain('https://wa.me/919876543210?text=');
    expect(res.url).toContain(encodeURIComponent(res.message));
    expect(res.disclaimer).toBe(
      'Opens direct enquiry with the business; not an automatic confirmed booking.'
    );
  });

  it('builds WhatsApp message for repair_service with item', () => {
    const res = generateActionLink({ shop: baseShop, item: sampleItem });
    expect(res.message).toBe(
      'Hi MacFix Care, I\'m enquiring about "Screen Replacement" (₹8,500 – ₹14,500) for repair/estimate. (via Shopfront)'
    );
  });

  it('builds WhatsApp message for salon_wellness with item', () => {
    const salonShop: ActionLinkShop = {
      ...baseShop,
      name: 'Glow Studio',
      category: 'salon_wellness',
    };
    const salonItem: ActionLinkItem = {
      name: 'Bridal Hair Smoothing',
      price_display: 'From ₹4,500',
    };
    const res = generateActionLink({ shop: salonShop, item: salonItem });
    expect(res.message).toBe(
      'Hi Glow Studio, I\'d like to check appointment availability for "Bridal Hair Smoothing" (From ₹4,500). (via Shopfront)'
    );
  });

  it('builds WhatsApp message for food_beverage with item', () => {
    const foodShop: ActionLinkShop = {
      ...baseShop,
      name: 'Sourdough Bakers',
      category: 'food_beverage',
    };
    const foodItem: ActionLinkItem = {
      name: 'Vegan Country Loaf',
      price_display: '₹350',
    };
    const res = generateActionLink({ shop: foodShop, item: foodItem });
    expect(res.message).toBe(
      'Hi Sourdough Bakers, I\'d like to enquire about ordering "Vegan Country Loaf" (₹350). (via Shopfront)'
    );
  });

  it('sanitizes preferred_time and customer_note and appends suffixes in order', () => {
    const res = generateActionLink({
      shop: baseShop,
      item: sampleItem,
      preferred_time: 'Tomorrow\n 5pm\x00',
      customer_note: 'Please confirm \r\n stock\x1B available',
    });

    expect(res.message).toBe(
      'Hi MacFix Care, I\'m enquiring about "Screen Replacement" (₹8,500 – ₹14,500) for repair/estimate. Preferred time: Tomorrow 5pm. Note: Please confirm stock available (via Shopfront)'
    );
  });

  it('generates external_url when action_mode is external_url', () => {
    const webShop: ActionLinkShop = {
      ...baseShop,
      action_mode: 'external_url',
      booking_url: 'https://macfix.in/book',
    };
    const res = generateActionLink({ shop: webShop });
    expect(res.action_mode).toBe('external_url');
    expect(res.url).toBe('https://macfix.in/book');
  });

  it('generates tel: link when action_mode is phone_only', () => {
    const phoneShop: ActionLinkShop = {
      ...baseShop,
      action_mode: 'phone_only',
      phone: '+919876543210',
    };
    const res = generateActionLink({ shop: phoneShop });
    expect(res.action_mode).toBe('phone_only');
    expect(res.url).toBe('tel:+919876543210');
  });
});
