/****************************************************
 * 1) Autocomplete setup for the origin address
 ****************************************************/
let autocomplete;
let address1Field;
let postalField;

/**
 * Called by the Google Maps script (callback=initAutocomplete).
 * Initializes the Autocomplete for the origin text input.
 */
function initAutocomplete() {
  address1Field = document.querySelector("#ship-address");
  postalField = document.querySelector("#postcode");

  // Limit autocomplete to US/CA addresses
  autocomplete = new google.maps.places.Autocomplete(address1Field, {
    componentRestrictions: { country: ["us", "ca"] },
    fields: ["address_components", "geometry"],
    types: ["address"],
  });

  autocomplete.addListener("place_changed", fillInAddress);
}

/**
 * Parse address components from the selected place,
 * then fill them into the corresponding form fields.
 */
function fillInAddress() {
  const place = autocomplete.getPlace();

  let streetNumber = "";
  let route = "";
  let postcode = "";

  for (const component of place.address_components) {
    const componentType = component.types[0];

    switch (componentType) {
      case "street_number":
        streetNumber = component.short_name;
        break;
      case "route":
        route = component.short_name;
        break;
      case "locality":
        document.querySelector("#locality").value = component.long_name;
        break;
      case "administrative_area_level_1":
        document.querySelector("#state").value = component.short_name;
        break;
      case "postal_code":
        postcode = component.long_name;
        break;
      case "postal_code_suffix":
        postcode = `${postcode}-${component.long_name}`;
        break;
      default:
        break;
    }
  }

  // Assign the combined street address to the input
  address1Field.value = `${streetNumber} ${route}`.trim();
  postalField.value = postcode;
}

/****************************************************
 * 2) Destination addresses (example list)
 *    In a real scenario, you might fetch from your
 *    prayertimes.json or filteredRecords array.
 ****************************************************/
const destinationAddresses = [
  "1600 Amphitheatre Pkwy, Mountain View, CA 94043",
  "1 Infinite Loop, Cupertino, CA 95014",
  "1355 Market St, San Francisco, CA 94103",
  "1350 Charleston Rd, Mountain View, CA 94043",
  "345 Spear St, San Francisco, CA 94105",
  "111 8th Ave, New York, NY 10011",
  "770 Broadway, New York, NY 10003",
];

/****************************************************
 * 3) Distance Matrix request
 ****************************************************/
async function getDistancesMatrix(originAddress, destinations, apiKey) {
  if (!originAddress || destinations.length === 0) {
    throw new Error("Origin or destinations missing.");
  }

  // The Distance Matrix API can receive addresses separated by "|"
  // e.g. &destinations=addr1|addr2|addr3
  const joinedDestinations = encodeURIComponent(destinations.join("|"));
  const encodedOrigin = encodeURIComponent(originAddress);

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
    `destinations=${joinedDestinations}` +
    `&origins=${encodedOrigin}` +
    `&units=imperial` +
    `&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Distance Matrix response:", data);
      throw new Error("Distance Matrix request failed: " + data.status);
    }
    return data;
  } catch (err) {
    console.error("Error calling Distance Matrix API:", err);
    throw err;
  }
}

/****************************************************
 * 4) Geocode addresses to place markers on the map
 ****************************************************/
async function geocodeAddress(geocoder, address) {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          address,
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        console.warn("Geocode failed for address:", address, status);
        resolve(null); // treat as non-blocking
      }
    });
  });
}

/****************************************************
 * 5) Initialize map + add markers
 ****************************************************/
let map;

async function initMap() {
  // This function is auto-called if you have the google.maps.importLibrary approach.
  // For a simple example, we’ll do a standard map init:

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.8283, lng: -98.5795 }, // Approx center of US
    zoom: 4,
  });
}

/**
 * Place markers for the top-5 addresses on the map.
 */
async function placeMarkersOnMap(addresses) {
  if (!map) {
    initMap();
  }
  const geocoder = new google.maps.Geocoder();

  // For each address, geocode to lat/lng, then place a marker
  for (const addr of addresses) {
    const geoResult = await geocodeAddress(geocoder, addr);
    if (!geoResult) continue; // skip if geocode failed

    const marker = new google.maps.Marker({
      map,
      position: { lat: geoResult.lat, lng: geoResult.lng },
      title: geoResult.address,
    });
  }
}

/****************************************************
 * 6) The "Find 5 Closest" button click
 ****************************************************/
document.getElementById("distance-btn").addEventListener("click", async () => {
  // 1) Build the origin address from the form
  const origin = buildOriginAddress();
  if (!origin) {
    alert("Please fill in the address form first.");
    return;
  }

  // 2) Call Distance Matrix with all possible destinations
  try {
    const apiKey = "AIzaSyBOtVjKr3D0vZmwg1QlxCy6SR4rVQenaPU"; // <-- Put your real key here.
    const matrixResult = await getDistancesMatrix(
      origin,
      destinationAddresses,
      apiKey
    );

    // "matrixResult.rows" will contain an array (each 'row' corresponds to an origin).
    // We used only 1 origin => matrixResult.rows[0].elements are the distances to each destination.
    const distancesArray = matrixResult.rows[0].elements.map((el, i) => {
      return {
        address: destinationAddresses[i],
        distanceValue: el.distance ? el.distance.value : Infinity, // in meters
        distanceText: el.distance ? el.distance.text : "N/A",
        durationText: el.duration ? el.duration.text : "N/A",
      };
    });

    // 3) Sort by distance ascending
    distancesArray.sort((a, b) => a.distanceValue - b.distanceValue);

    // 4) Take the 5 closest
    const closest5 = distancesArray.slice(0, 5);

    // 5) Log or display them
    console.log("Closest 5 destinations:", closest5);

    // 6) Place them on the map
    const addressesForMarkers = closest5.map((item) => item.address);
    await placeMarkersOnMap(addressesForMarkers);

    // Optionally, zoom map to fit all markers with a bounds approach
    zoomMapToMarkers(addressesForMarkers);

  } catch (err) {
    console.error("Error in distance matrix flow:", err);
    alert("Could not retrieve distances. Check console for details.");
  }
});

/****************************************************
 * 7) Helper: build a single-line origin address
 ****************************************************/
function buildOriginAddress() {
  const addr = document.getElementById("ship-address").value.trim();
  const city = document.getElementById("locality").value.trim();
  const st = document.getElementById("state").value.trim();
  const zip = document.getElementById("postcode").value.trim();

  if (!addr || !city || !st || !zip) {
    return null;
  }
  return `${addr}, ${city}, ${st} ${zip}`;
}

/****************************************************
 * 8) Helper: automatically zoom map to show markers
 ****************************************************/
async function zoomMapToMarkers(addresses) {
  if (!map) return;
  const geocoder = new google.maps.Geocoder();
  const bounds = new google.maps.LatLngBounds();

  for (const addr of addresses) {
    const geoResult = await geocodeAddress(geocoder, addr);
    if (geoResult) {
      bounds.extend(new google.maps.LatLng(geoResult.lat, geoResult.lng));
    }
  }
  map.fitBounds(bounds);
}
