'use client';

import React, { useState, useTransition, useActionState } from 'react';
import {
  createMenuItemAction,
  updateMenuItemAction,
  toggleMenuItemAvailableAction,
  deleteMenuItemAction,
  type MenuItemActionState,
} from './actions.js';
import type { CatalogItemRecord, ItemKind } from '../../../owner/menu-ops.js';
import type { OwnerShopRecord } from '../../../owner/shop-ops.js';
import type { PriceType } from '../../../domain/pricing.js';
import { formatPriceDisplay } from '../../../domain/pricing.js';

interface MenuManagerProps {
  shop: OwnerShopRecord;
  initialItems: CatalogItemRecord[];
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function MenuManager({ shop, initialItems }: MenuManagerProps) {
  const [items] = useState<CatalogItemRecord[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItemRecord | null>(null);

  // Group items by group_name
  const groupedItems = items.reduce<Record<string, CatalogItemRecord[]>>((acc, item) => {
    if (!acc[item.group_name]) {
      acc[item.group_name] = [];
    }
    acc[item.group_name]!.push(item);
    return acc;
  }, {});

  const existingGroups = Object.keys(groupedItems);

  const handleToggleAvailable = (item: CatalogItemRecord) => {
    setActionError(null);
    startTransition(async () => {
      const res = await toggleMenuItemAvailableAction(item.id, !item.available);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  const handleDelete = (item: CatalogItemRecord) => {
    if (!confirm(`Are you sure you want to delete '${item.name}'?`)) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const res = await deleteMenuItemAction(item.id);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {actionError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '6px',
            fontSize: '14px',
            border: '1px solid #fecaca',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>
            Catalog Size: <strong>{items.length}</strong> / 100 items
          </span>
          {items.length >= 100 && (
            <span style={{ marginLeft: '12px', color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>
              Menu limit reached (100 items)
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={items.length >= 100}
          onClick={() => {
            setActionError(null);
            setIsAddModalOpen(true);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: items.length >= 100 ? '#9ca3af' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: items.length >= 100 ? 'not-allowed' : 'pointer',
          }}
        >
          + Add New Item
        </button>
      </div>

      {/* Items List Grouped by Category/Group */}
      {items.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
            No items in your catalog yet.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        Object.entries(groupedItems).map(([group, groupList]) => (
          <div
            key={group}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                backgroundColor: '#f9fafb',
                padding: '12px 20px',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: '700',
                fontSize: '15px',
                color: '#111827',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{group}</span>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                {groupList.length} {groupList.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div>
              {groupList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    borderBottom: '1px solid #f3f4f6',
                    opacity: item.available ? 1 : 0.65,
                    backgroundColor: item.available ? '#ffffff' : '#fafafa',
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', fontSize: '15px', color: '#111827' }}>
                        {item.name}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: item.kind === 'service' ? '#e0e7ff' : '#f3f4f6',
                          color: item.kind === 'service' ? '#3730a3' : '#374151',
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.kind}
                      </span>
                      {item.diet && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: item.diet === 'veg' ? '#dcfce7' : '#fee2e2',
                            color: item.diet === 'veg' ? '#15803d' : '#b91c1c',
                            textTransform: 'uppercase',
                            fontWeight: '600',
                          }}
                        >
                          {item.diet}
                        </span>
                      )}
                      {!item.available && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            fontWeight: '600',
                          }}
                        >
                          Unavailable
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>
                      <span>Updated {formatDate(item.updated_at)}</span>
                      {item.duration_min && <span>• {item.duration_min} mins</span>}
                      {item.tags.length > 0 && (
                        <span>• Tags: {item.tags.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
                        {formatPriceDisplay(item.price_type, item.price_inr, item.price_max_inr)}
                      </div>
                    </div>

                    {/* Available Toggle */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleAvailable(item)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: item.available ? '#86efac' : '#d1d5db',
                        backgroundColor: item.available ? '#f0fdf4' : '#f3f4f6',
                        color: item.available ? '#166534' : '#4b5563',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: isPending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {item.available ? 'Available' : 'Hidden'}
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setActionError(null);
                        setEditingItem(item);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: isPending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(item)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#b91c1c',
                        cursor: isPending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <ItemModal
          title="Add New Menu Item"
          shop={shop}
          existingGroups={existingGroups}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <ItemModal
          title={`Edit Item: ${editingItem.name}`}
          shop={shop}
          existingGroups={existingGroups}
          initialItem={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function ItemModal({
  title,
  shop,
  existingGroups,
  initialItem,
  onClose,
}: {
  title: string;
  shop: OwnerShopRecord;
  existingGroups: string[];
  initialItem?: CatalogItemRecord;
  onClose: () => void;
}) {
  const isEditing = !!initialItem;
  const [kind, setKind] = useState<ItemKind>(initialItem?.kind ?? 'service');
  const [priceType, setPriceType] = useState<PriceType>(initialItem?.price_type ?? 'fixed');

  const [state, formAction, isPending] = useActionState<MenuItemActionState | null, FormData>(
    async (prev, formData) => {
      let res: MenuItemActionState;
      if (isEditing) {
        formData.set('itemId', initialItem.id);
        res = await updateMenuItemAction(prev, formData);
      } else {
        res = await createMenuItemAction(prev, formData);
      }
      if (res.success) {
        onClose();
        window.location.reload();
      }
      return res;
    },
    null
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
          >
            ✕
          </button>
        </div>

        {state?.error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {state.error}
          </div>
        )}

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="group_name" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
              Group / Section Name *
            </label>
            <input
              id="group_name"
              name="group_name"
              type="text"
              required
              minLength={2}
              maxLength={50}
              list="existing-groups"
              defaultValue={initialItem?.group_name ?? ''}
              placeholder="e.g. Repairs, Haircuts, Main Course"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <datalist id="existing-groups">
              {existingGroups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="name" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
              Item / Service Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              defaultValue={initialItem?.name ?? ''}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="description" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              maxLength={300}
              defaultValue={initialItem?.description ?? ''}
              placeholder="Brief details or specifications (up to 300 characters)"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="kind" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                Item Kind *
              </label>
              <select
                id="kind"
                name="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as ItemKind)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
              >
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
            </div>

            <div>
              <label htmlFor="price_type" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                Price Type *
              </label>
              <select
                id="price_type"
                name="price_type"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as PriceType)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
              >
                <option value="fixed">Fixed Price</option>
                <option value="starting_from">Starting From</option>
                <option value="range">Price Range</option>
                <option value="on_request">Price on Request</option>
              </select>
            </div>
          </div>

          {priceType !== 'on_request' && (
            <div style={{ display: 'grid', gridTemplateColumns: priceType === 'range' ? '1fr 1fr' : '1fr', gap: '12px' }}>
              <div>
                <label htmlFor="price_inr" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                  {priceType === 'range' ? 'Minimum Price (₹) *' : priceType === 'starting_from' ? 'Base Price (₹) *' : 'Price (₹) *'}
                </label>
                <input
                  id="price_inr"
                  name="price_inr"
                  type="number"
                  min={0}
                  max={1000000}
                  step={1}
                  required
                  defaultValue={initialItem?.price_inr ?? ''}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {priceType === 'range' && (
                <div>
                  <label htmlFor="price_max_inr" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                    Maximum Price (₹) *
                  </label>
                  <input
                    id="price_max_inr"
                    name="price_max_inr"
                    type="number"
                    min={0}
                    max={1000000}
                    step={1}
                    required
                    defaultValue={initialItem?.price_max_inr ?? ''}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {kind === 'service' ? (
              <div>
                <label htmlFor="duration_min" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                  Duration (mins: 5–480)
                </label>
                <input
                  id="duration_min"
                  name="duration_min"
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  defaultValue={initialItem?.duration_min ?? ''}
                  placeholder="e.g. 30"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            ) : <div />}

            {shop.category === 'food_beverage' && (
              <div>
                <label htmlFor="diet" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                  Diet Type
                </label>
                <select
                  id="diet"
                  name="diet"
                  defaultValue={initialItem?.diet ?? ''}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">None / Not Specified</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non_veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="egg">Contains Egg</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="tags" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
              Tags (comma-separated, max 10)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              defaultValue={initialItem?.tags ? initialItem.tags.join(', ') : ''}
              placeholder="e.g. battery, screen, express"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: '#374151' }}>
              <input
                type="checkbox"
                name="available"
                defaultChecked={initialItem ? initialItem.available : true}
                style={{ width: '16px', height: '16px' }}
              />
              Available to customers
            </label>

            <div>
              <label htmlFor="sort_order" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                Sort Order
              </label>
              <input
                id="sort_order"
                name="sort_order"
                type="number"
                defaultValue={initialItem?.sort_order ?? 0}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: '8px 20px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? 'Saving...' : isEditing ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
