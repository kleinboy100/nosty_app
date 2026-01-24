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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    if (!mapboxToken) {
      // Return fallback estimate if no token configured
      console.log("Mapbox token not configured, returning default estimate");
      return new Response(
        JSON.stringify({ 
          distanceKm: 5,
          durationMinutes: 15,
          method: 'default-estimate'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    console.log("Calculate distance request:", body);

    let restaurantCoords = body.restaurantCoords;
    let customerCoords = body.customerCoords;

    // Geocode restaurant address if coordinates not provided
    if (!restaurantCoords && body.restaurantAddress) {
      try {
        const geocodeRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(body.restaurantAddress)}.json?access_token=${mapboxToken}&country=za&limit=1`
        );
        const geocodeData = await geocodeRes.json();
        
        if (geocodeData.features && geocodeData.features.length > 0) {
          const [lng, lat] = geocodeData.features[0].center;
          restaurantCoords = { lat, lng };
          console.log("Geocoded restaurant:", body.restaurantAddress, "->", restaurantCoords);
        } else {
          console.log("No geocode results for restaurant address:", body.restaurantAddress);
        }
      } catch (geocodeError) {
        console.error("Failed to geocode restaurant address:", geocodeError);
      }
    }

    // Geocode customer address if coordinates not provided
    if (!customerCoords && body.customerAddress) {
      try {
        const geocodeRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(body.customerAddress)}.json?access_token=${mapboxToken}&country=za&limit=1`
        );
        const geocodeData = await geocodeRes.json();
        
        if (geocodeData.features && geocodeData.features.length > 0) {
          const [lng, lat] = geocodeData.features[0].center;
          customerCoords = { lat, lng };
          console.log("Geocoded customer:", body.customerAddress, "->", customerCoords);
        } else {
          console.log("No geocode results for customer address:", body.customerAddress);
        }
      } catch (geocodeError) {
        console.error("Failed to geocode customer address:", geocodeError);
      }
    }

    // If we couldn't get both coordinates, return a default estimate instead of an error
    if (!restaurantCoords || !customerCoords) {
      console.log("Could not determine coordinates, returning default estimate");
      return new Response(
        JSON.stringify({ 
          distanceKm: 5,
          durationMinutes: 15,
          method: 'default-estimate',
          note: 'Could not calculate exact distance'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get directions from Mapbox
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${restaurantCoords.lng},${restaurantCoords.lat};${customerCoords.lng},${customerCoords.lat}?access_token=${mapboxToken}&overview=false`;
    
    console.log("Fetching directions...");
    const directionsRes = await fetch(directionsUrl);
    const directionsData = await directionsRes.json();

    if (!directionsData.routes || directionsData.routes.length === 0) {
      // Fallback to straight-line distance
      const R = 6371; // Earth's radius in km
      const dLat = (customerCoords.lat - restaurantCoords.lat) * Math.PI / 180;
      const dLon = (customerCoords.lng - restaurantCoords.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(restaurantCoords.lat * Math.PI / 180) * Math.cos(customerCoords.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;
      
      // Estimate 2 min per km for driving
      const durationMinutes = Math.ceil(distanceKm * 2);

      console.log("Using straight-line fallback:", { distanceKm, durationMinutes });
      
      return new Response(
        JSON.stringify({ 
          distanceKm: Math.round(distanceKm * 10) / 10,
          durationMinutes,
          method: 'straight-line'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = directionsData.routes[0];
    const distanceKm = route.distance / 1000; // Convert meters to km
    const durationMinutes = Math.ceil(route.duration / 60); // Convert seconds to minutes

    console.log("Route calculated:", { distanceKm, durationMinutes });

    return new Response(
      JSON.stringify({
        distanceKm: Math.round(distanceKm * 10) / 10,
        durationMinutes,
        method: 'driving'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error calculating distance:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
