/******************************************************
 * map.js
 * One Google API key for everything:
 *   AIzaSyBOtVjKr3D0vZmwg1QlxCy6SR4rVQenaPU
 ******************************************************/

/**
 * 0) The JSON Data (sample) 
 *    Each item has: Shul, Tefilah, Time, Data (address), strCode
 */
const prayerTimes = [
  {
    "Shul": "Testing1",
    "Tefilah": "['Shachris']",
    "Time": "12:06 PM",
    "Data": "44 Coles Way, Lakewood, NJ",
    "strCode": "['#ERS']"
  },
  {
    "Shul": "Testing3",
    "Tefilah": "['Shachris']",
    "Time": "4:00 AM | 4:40 AM | 5:20 AM | ...",
    "Data": "269 John St, Lakewood, NJ",
    "strCode": "['#RET']"
  },
  {
    "Shul": "Testing",
    "Tefilah": "['Maariv']",
    "Time": "11:55 AM",
    "Data": "347 Coles Way, Lakewood, NJ",
    "strCode": "['#RSE']"
  },
  {
    "Shul": "Testing1",
    "Tefilah": "['Mincha']",
    "Time": "10:00 AM",
    "Data": "44 Coles Way, Lakewood, NJ",
    "strCode": "['#CUT']"
  },
  {
    "Shul": "Testing3",
    "Tefilah": "['Shachris']",
    "Time": "8:17 AM",
    "Data": "269 John St, Lakewood, NJ",
    "strCode": "['#UST']"
  }
];

/******************************************************
 * 1) geocodeAddress() - returns {lat, lng} or null
 ******************************************************/
async function geocodeAddress(address) {
  const apiKey = "AIzaSyBOtVjKr3D0vZmwg1QlxCy6SR4rVQenaPU";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      };
    } else {
      console.warn("Geocode failed:", address, data.status, data);
      return null;
    }
  } catch (err) {
    console.error("Error in geocodeAddress:", err);
    return null;
  }
}

/******************************************************
 * 2) initMap() - main flow
 ******************************************************/
async function initMap() {
  // 1) Import needed libraries from Google Maps
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

  // 2) Create the map with an initial center/zoom.
  //    We'll re-center after we get lat/lng from the JSON, if desired.
  const map = new Map(document.getElementById("map"), {
    zoom: 12,
    center: { lat: 40.0859, lng: -74.2090 }, // approximate center around Lakewood, NJ
    mapId: "4504f8b37365c3d0", // example map style ID from your sample (optional)
  });

  // 3) Create an info window to reuse for each marker
  const infoWindow = new InfoWindow();

  // 4) Process each item in the JSON
  //    We'll keep track of all marker positions for optional auto-bounds.
  const markerPositions = [];

  for (let i = 0; i < prayerTimes.length; i++) {
    const { Shul, Data } = prayerTimes[i];
    if (!Data) {
      console.warn("No address for item:", prayerTimes[i]);
      continue;
    }

    // 4a) Geocode the address in `Data`
    const latlng = await geocodeAddress(Data);
    if (!latlng) {
      // Geocode failed => skip
      continue;
    }

    // 4b) Create a fancy "pin" with a number or glyph
    const pin = new PinElement({
      glyph: `${i + 1}`, // or you could do Shul name, etc.
      scale: 1.5,
    });

    // 4c) Create an Advanced Marker
    const marker = new AdvancedMarkerElement({
      position: latlng,
      map,
      title: Shul,
      content: pin.element, // optional: custom pin design
      gmpClickable: true,   // allow infoWindow
    });

    // 4d) Marker click => open infoWindow with details
    marker.addListener("click", () => {
      infoWindow.close();
      infoWindow.setContent(`<strong>${Shul}</strong><br>${Data}`);
      infoWindow.open(map, marker);
    });

    markerPositions.push(latlng);
  }

  // 5) If desired, auto-zoom the map to fit all markers
  if (markerPositions.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    markerPositions.forEach((pos) => bounds.extend(pos));
    map.fitBounds(bounds);
  }
}

// 3) Call initMap() once the script loads
initMap();
