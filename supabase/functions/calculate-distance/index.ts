import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  restaurantCoords?: { lat: number; lng: number };
  customerCoords?: { lat: number; lng: number };
  restaurantAddress?: string;
  customerAddress?: string;
}

// Geocode address using OpenStreetMap Nominatim (free, no API key needed)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=za&limit=1`,
      {
        headers: {
          'User-Agent': 'PlatePal-Delivery-App/1.0'
        }
      }
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Calculate distance and duration using OSRM (free, no API key needed)
async function calculateRoute(
  fromCoords: { lat: number; lng: number },
  toCoords: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationMinutes: number } | null> {
  try {
    // OSRM public API for driving directions
    const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=false`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distanceKm: Math.round((route.distance / 1000) * 10) / 10, // meters to km
        durationMinutes: Math.ceil(route.duration / 60) // seconds to minutes
      };
    }
    return null;
  } catch (error) {
    console.error("OSRM routing error:", error);
    return null;
  }
}

// Haversine formula for straight-line distance fallback
function haversineDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    console.log("Calculate distance request:", body);

    let restaurantCoords: { lat: number; lng: number } | null = body.restaurantCoords || null;
    let customerCoords: { lat: number; lng: number } | null = body.customerCoords || null;

    // Geocode restaurant address if coordinates not provided
    if (!restaurantCoords && body.restaurantAddress) {
      console.log("Geocoding restaurant address:", body.restaurantAddress);
      restaurantCoords = await geocodeAddress(body.restaurantAddress);
      if (restaurantCoords) {
        console.log("Restaurant geocoded:", restaurantCoords);
      } else {
        console.log("Failed to geocode restaurant address");
      }
    }

    // Geocode customer address if coordinates not provided
    if (!customerCoords && body.customerAddress) {
      console.log("Geocoding customer address:", body.customerAddress);
      customerCoords = await geocodeAddress(body.customerAddress);
      if (customerCoords) {
        console.log("Customer geocoded:", customerCoords);
      } else {
        console.log("Failed to geocode customer address");
      }
    }

    // If we couldn't get both coordinates, return a default estimate
    if (!restaurantCoords || !customerCoords) {
      console.log("Could not determine coordinates, returning default estimate");
      return new Response(
        JSON.stringify({ 
          distanceKm: 5,
          durationMinutes: 15,
          method: 'default-estimate',
          note: 'Could not calculate exact distance - addresses could not be geocoded'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try OSRM for accurate driving distance/duration
    console.log("Calculating route via OSRM...");
    const routeResult = await calculateRoute(restaurantCoords, customerCoords);
    
    if (routeResult) {
      console.log("OSRM route calculated:", routeResult);
      return new Response(
        JSON.stringify({
          distanceKm: routeResult.distanceKm,
          durationMinutes: routeResult.durationMinutes,
          method: 'driving'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to straight-line distance with estimated drive time
    console.log("OSRM failed, using straight-line fallback");
    const distanceKm = haversineDistance(restaurantCoords, customerCoords);
    // Estimate 2.5 min per km for urban driving (accounts for traffic, turns, etc.)
    const durationMinutes = Math.ceil(distanceKm * 2.5);

    return new Response(
      JSON.stringify({ 
        distanceKm: Math.round(distanceKm * 10) / 10,
        durationMinutes: Math.max(5, durationMinutes), // minimum 5 minutes
        method: 'straight-line'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error calculating distance:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        distanceKm: 5,
        durationMinutes: 15,
        method: 'error-fallback',
        error: message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
