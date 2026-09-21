export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side Reverse Geocoding Route
 * Resolves GPS coordinates (latitude, longitude) to a human-readable street/area address.
 * Uses OpenStreetMap Nominatim with strict timeout and fallback.
 * 100% Free of cost, zero API keys required, and eliminates browser CORS / User-Agent issues.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Latitude and longitude parameters are required.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate values.' },
        { status: 400 }
      );
    }

    const fallbackCoordStr = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

      const res = await fetch(nominatimUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TheSpicyGardenRestaurant/1.0 (BistroOrderDelivery; info@thespicygarden.com)',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        // Extract most descriptive location components
        const parts: string[] = [];

        // Specific location / premises
        const primary =
          addr.road ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.commercial ||
          addr.residential ||
          addr.pedestrian ||
          addr.building;

        if (primary) parts.push(primary);

        // Locality / Area
        const secondary =
          (addr.suburb && addr.suburb !== primary ? addr.suburb : null) ||
          (addr.neighbourhood && addr.neighbourhood !== primary ? addr.neighbourhood : null) ||
          addr.hamlet ||
          addr.village;

        if (secondary) parts.push(secondary);

        // Town / City
        const city = addr.city || addr.town || addr.municipality || addr.county;
        if (city && !parts.includes(city)) parts.push(city);

        // District or State
        const district = addr.state_district;
        if (district && !parts.includes(district)) parts.push(district);

        const state = addr.state;
        if (state && !parts.includes(state)) parts.push(state);

        const postcode = addr.postcode;
        if (postcode) parts.push(postcode);

        const formattedAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || fallbackCoordStr);

        return NextResponse.json({
          success: true,
          address: formattedAddress,
          displayName: data.display_name || formattedAddress,
          lat,
          lng,
          mapsLink,
        });
      }
    } catch (fetchErr) {
      console.warn('[ReverseGeocode] Nominatim request failed or timed out, using coordinate fallback:', fetchErr);
    }

    // Fallback: return formatted coordinates
    return NextResponse.json({
      success: true,
      address: fallbackCoordStr,
      displayName: fallbackCoordStr,
      lat,
      lng,
      mapsLink,
    });
  } catch (err: any) {
    console.error('[ReverseGeocode] Server error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to resolve location' },
      { status: 500 }
    );
  }
}
