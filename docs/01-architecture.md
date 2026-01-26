# Architecture

## High-Level Components
- **Client UI:** Mobile-first interface with adaptive navigation (Dashboard hidden for customers).
- **Location Services:**
    - **Geocoding:** Nominatim (OpenStreetMap) for address-to-coordinate conversion.
    - **Routing Engine:** OSRM (Open Source Routing Machine) for calculating driving distance and travel time.
- **Storage:** Supabase Storage buckets for hosting menu item imagery.



## Key Flows (Updated)
### Adaptive Order Flow
1. **Fulfillment Selection:** User selects Delivery or Collection.
2. **Logic Branching:** - If **Collection**: RLS logic bypasses delivery address requirements and sets delivery fee to R0. 
    - If **Delivery**: OSRM calculates distance and adds a flat R25 fee.
3. **Validation:** `create_validated_order` recalculates prices and validates restaurant status using `SECURITY DEFINER` permissions.

### Real-Time Payment Feedback
1. **Observer:** `OrderDetail` page uses a Supabase Realtime listener on the `payments` table.
2. **UI State:** Automatically transitions from "Processing" to "Confirmed" via websocket signal upon successful webhook verification.

### Location & ETA Logic
- **Formula:** `Total ETA = Prep Time (Fixed) + Driving Duration (OSRM API)`.
- **Fallback:** Haversine formula calculates straight-line distance if the OSRM routing service is unreachable.
