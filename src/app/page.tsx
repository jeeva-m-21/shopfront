import React from 'react';
import { CHENNAI_LOCALITIES } from '@/domain/localities';
import { searchShops, type SearchShopsInput } from '@/search/search-shops';
import { SearchInterface } from './SearchInterface';
import type { ShopCategory } from '@/search/stage1';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage(props: PageProps) {
  const resolvedParams = props.searchParams ? await props.searchParams : {};

  const q = typeof resolvedParams.q === 'string'
    ? resolvedParams.q
    : typeof resolvedParams.query === 'string'
    ? resolvedParams.query
    : '';

  const locality = typeof resolvedParams.locality === 'string'
    ? resolvedParams.locality
    : '';

  const category = (typeof resolvedParams.category === 'string'
    ? resolvedParams.category
    : '') as ShopCategory;

  const maxPriceStr = typeof resolvedParams.max_price_inr === 'string'
    ? resolvedParams.max_price_inr
    : undefined;
  const maxPriceInr = maxPriceStr ? Number(maxPriceStr) : undefined;

  const openNow = resolvedParams.open_now === 'true' || resolvedParams.open_now === '1';

  const radiusKmStr = typeof resolvedParams.radius_km === 'string'
    ? resolvedParams.radius_km
    : undefined;
  const radiusKm = radiusKmStr ? Number(radiusKmStr) : undefined;

  const sortedLocalities = [...CHENNAI_LOCALITIES].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Initial search input
  const searchInput: SearchShopsInput = {
    query: q || undefined,
    locality: locality || undefined,
    category: category || undefined,
    max_price_inr: maxPriceInr,
    open_now: openNow,
    radius_km: radiusKm,
    limit: 10,
  };

  const searchRes = await searchShops(searchInput, 'web');

  const initialShops = searchRes.success ? searchRes.data.shops : [];
  const initialLocationWarning = searchRes.success ? searchRes.data.location_warning : null;
  const initialLocationResolved = searchRes.success ? searchRes.data.location_resolved : null;
  const initialRelaxationHints = searchRes.success ? searchRes.data.relaxation_hints : [];
  const initialReranked = searchRes.success ? searchRes.data.reranked : false;

  return (
    <SearchInterface
      initialLocalities={sortedLocalities}
      initialQuery={q}
      initialLocality={locality}
      initialCategory={category}
      initialMaxPrice={maxPriceInr}
      initialOpenNow={openNow}
      initialShops={initialShops}
      initialLocationWarning={initialLocationWarning}
      initialLocationResolved={initialLocationResolved}
      initialRelaxationHints={initialRelaxationHints}
      initialReranked={initialReranked}
    />
  );
}
