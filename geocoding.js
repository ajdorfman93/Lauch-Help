/************************************************************
 * Geocoding.js
 *
 * Usage:
 *   1) <div id="prayerTimesOutput"> ... your JSON array ... </div>
 *   2) <script src="Geocoding.js"></script>
 *   3) Call geocodeJsonInPrayerTimesOutput() to update #prayerTimesOutput.
 ************************************************************/

// Single API key for Geocoding + Maps
const GEOCODE_API_KEY = "AIzaSyBOtVjKr3D0vZmwg1QlxCy6SR4rVQenaPU";

/**
 * Geocode a single address => returns { lat, lng } or null
 */
async function geocodeAddress(address) {
  if (!address) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${GEOCODE_API_KEY}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } else {
      console.warn("Geocode failed:", address, data.status, data);
      return null;
    }
  } catch (error) {
    console.error("Error in geocodeAddress for:", address, error);
    return null;
  }
}

/**
 * Read the JSON from #prayerTimesOutput,
 * geocode each record’s 'Data' address => lat/lng,
 * inject `latitude`, `longitude` into each record,
 * then re-write the entire updated JSON array back into #prayerTimesOutput.
 */
async function geocodeJsonInPrayerTimesOutput() {
  const container = document.getElementById("prayerTimesOutput");
  if (!container) {
    console.error('No element found with id="prayerTimesOutput"');
    return;
  }

  // Parse whatever text content is in #prayerTimesOutput as JSON
  let arr;
  try {
    const rawText = container.textContent.trim();
    arr = JSON.parse(rawText);
  } catch (err) {
    console.error("Could not parse JSON from #prayerTimesOutput:", err);
    return;
  }

  if (!Array.isArray(arr)) {
    console.error("Expected an array in #prayerTimesOutput, but got:", arr);
    return;
  }

  // Loop over each record => geocode => add lat/long
  for (let i = 0; i < arr.length; i++) {
    const record = arr[i];
    if (!record.Data) {
      continue; // skip if no address
    }

    const geo = await geocodeAddress(record.Data);
    if (geo) {
      // Add or overwrite 'latitude' and 'longitude' fields
      record.latitude = geo.lat;
      record.longitude = geo.lng;
    } else {
      record.latitude = null;
      record.longitude = null;
    }
  }

  // Re-stringify the updated array
  const updatedJson = JSON.stringify(arr, null, 2);

  // Re-inject into the same #prayerTimesOutput element
  // so you can confirm it's updated with lat/long
  container.textContent = updatedJson;

  console.log("Updated #prayerTimesOutput JSON with lat/lng:", arr);
}

// Optionally attach to window so you can call from anywhere
window.geocodeJsonInPrayerTimesOutput = geocodeJsonInPrayerTimesOutput;
