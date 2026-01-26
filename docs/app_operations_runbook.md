# Operations Runbook: Nosty'$ Fresh Fast Food

This guide is for the restaurant owner to manage daily operations, maintain the digital menu, and troubleshoot the "Fresh & Fast" platform infrastructure.

---

## 1. Menu & Asset Management
The menu system now supports native image hosting via Supabase Storage.

### Managing Menu Items
1. **Access:** Navigate to the **Dashboard** > **Menu** tab.
2. **Adding Items:** Click **"Add Item"**. You must provide a Name, Category, and Price.
3. **Uploading Photos:** - Click **"Upload Image"** to select a file from your device.
    - **Specs:** Maximum file size is **5MB**. Supported formats: JPG, PNG, WebP.
    - **Preview:** A thumbnail will appear immediately. Click the "X" on the preview to remove or replace it.
4. **Availability:** If an ingredient is out of stock, use the **"Available" toggle** on the main menu list. This hides the item from customers instantly without deleting your data.

### Storage Maintenance
- Assets are stored in the `menu-images` bucket.
- **Organization:** Files are automatically renamed using UUIDs and stored in folders named after your `restaurant_id` to prevent naming conflicts.

---

## 2. Location & Routing Services
The app uses OpenStreetMap (OSM) technologies to provide free, high-accuracy routing.

### Address Search (Nominatim)
- **Issue:** A customer cannot find their specific street address.
- **Action:** Nominatim relies on community-driven maps. If an address is missing, advise the customer to use the nearest landmark or street intersection.
- **Verification:** You can verify if a location exists by searching on [OpenStreetMap.org](https://www.openstreetmap.org).

### Distance & ETA (OSRM)
- **Mechanism:** Driving time is calculated using the **Open Source Routing Machine (OSRM)**.
- **Fallback:** If the OSRM API is down, the system defaults to the **Haversine Formula** (as-the-crow-flies distance). 
- **Note:** ETAs include a 20-minute buffer for food preparation.

---

## 3. Order Fulfillment Workflow

### Hybrid Options
- **Delivery:** Fixed R25 fee. The system calculates distance from Nosty'$ to the customer.
- **Collection:** R0 fee. The tracker skips the "Out for Delivery" stage and moves directly to **"Ready for Pickup"**.

### Payment Status
1. **Real-time Monitoring:** The `OrderDetail` page updates automatically when a payment is confirmed.
2. **Stuck Payments:** If a customer claims they paid but the status is "Awaiting Payment":
    - Verify the transaction in your **Yoco Portal**.
    - If confirmed in Yoco, you can manually progress the order status in the dashboard to "Preparing."

---

## 4. Emergency Procedures

### Rotating Yoco Webhook Secrets
If security is compromised:
1. Generate a new **Webhook Secret** in the Yoco Dashboard.
2. Go to **Supabase Dashboard** > **Edge Functions** > **Secrets**.
3. Update `YOCO_WEBHOOK_SECRET` with the new value.
4. Redeploy or restart the function to apply changes.

### Emergency Store Closure
1. Navigate to **Dashboard** > **Settings**.
2. Toggle the **Store Open** switch to **OFF**.
3. This disables the "Add to Cart" and "Checkout" functions for all users until you re-open.

---

## 5. Troubleshooting Log
| Symptom | Probable Cause | Resolution |
|---|---|---|
| Image upload fails | File > 5MB or poor connection | Resize image or check Wi-Fi. |
| ETA shows "0 mins" | Location permissions denied | Customer must allow GPS or enter address manually. |
| Dashboard hidden | Identity mismatch | Ensure you are logged in with the email designated as the `owner_id`. |
