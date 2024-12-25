// This sample uses the Places Autocomplete widget to:
// 1. Help the user select a place
// 2. Retrieve the address components associated with that place
// 3. Populate the form fields with those address components.
// This sample requires the Places library, Maps JavaScript API.
// Include the libraries=places parameter when you first load the API.
// For example: <script
// src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
let autocomplete;
let address1Field;
let postalField;

async function initAutocomplete() {
  address1Field = document.querySelector("#ship-address");
  postalField = document.querySelector("#postcode");
  // Create the autocomplete object, restricting the search predictions to
  // addresses in the US and Canada.
  autocomplete = new google.maps.places.Autocomplete(address1Field, {
    componentRestrictions: { country: ["us", "ca"] },
    fields: ["address_components", "geometry"],
    types: ["address"],
  });
  address1Field.focus();
  // When the user selects an address from the drop-down, populate the
  // address fields in the form.
  autocomplete.addListener("place_changed", fillInAddress);
}

function fillInAddress() {
  // Get the place details from the autocomplete object.
  const place = autocomplete.getPlace();
  let address1 = "";
  let postcode = "";

  // Get each component of the address from the place details,
  // and then fill-in the corresponding field on the form.
  // place.address_components are google.maps.GeocoderAddressComponent objects
  // which are documented at http://goo.gle/3l5i5Mr
  for (const component of place.address_components) {
    // @ts-ignore remove once typings fixed
    const componentType = component.types[0];

    switch (componentType) {
      case "street_number": {
        address1 = `${component.short_name} ${address1}`;
        break;
      }

      case "route": {
        address1 += component.short_name;
        break;
      }

      case "postal_code": {
        postcode = `${component.long_name}${postcode}`;
        break;
      }

      case "postal_code_suffix": {
        postcode = `${postcode}-${component.long_name}`;
        break;
      }
      case "locality":
        document.querySelector("#locality").value = component.long_name;
        break;
      case "administrative_area_level_1": {
        document.querySelector("#state").value = component.short_name;
        break;
      }
      case "postcode":
        document.querySelector("#postcode").value = component.long_name;
        break;
    }
  }

  address1Field.value = address1;
  postalField.value = postcode;
}

/****************************************************
 * 2) UPDATE THE IFRAME MAP ON BUTTON CLICK
 ****************************************************/
// Once the DOM is loaded, attach a click listener to the "Save address" button
document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.querySelector(".checkPrayerTimesButton");
    const mapIframe = document.getElementById("mapIframe");
  
    saveBtn.addEventListener("click", () => {
      // Build the address from the form fields
      const addressLine = document.getElementById("ship-address").value.trim();
      const city = document.getElementById("locality").value.trim();
      const state = document.getElementById("state").value.trim();
      const zip = document.getElementById("postcode").value.trim();
  
      // Make sure the user has entered all fields
      if (!addressLine || !city || !state || !zip) {
        alert("Please fill in all address fields.");
        return;
      }
  
      // Combine them into a single string, then URL-encode
      const combinedAddress = encodeURIComponent(
        `${addressLine}, ${city}, ${state} ${zip}`
      );
  
      // Build the new Map Embed URL
      // *** Replace "YOUR_API_KEY" with your real key ***
      const newSrc = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBOtVjKr3D0vZmwg1QlxCy6SR4rVQenaPU&q=${combinedAddress}`;
  
      // Update the iframe src
      mapIframe.src = newSrc;
    });
  });

// Single API key for Geocoding + Maps
const GEOCODE_API_KEY = "AIzaSyBOtVjKr3D0vZmwg1QlxCy6SR4rVQenaPU";

// Geocode a single address => returns { lat, lng } or null
async function geocodeAddress(address) {
  if (!address) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${GEOCODE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } else {
      console.error("Geocode API error:", data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

// Update iframe map based on address
async function updateIframeMap(address) {
  const geocodeResult = await geocodeAddress(address);

  if (geocodeResult) {
    const { lat, lng } = geocodeResult;

    // Update the iframe src with new location
    const mapIframe = document.getElementById("mapIframe");
    mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=${GEOCODE_API_KEY}&q=${lat},${lng}`;
    console.log(`Map updated to lat: ${lat}, lng: ${lng}`);
  } else {
    alert("Failed to geocode the address. Please check the address and try again.");
  }
}

// Usage example with form submission
document.addEventListener("DOMContentLoaded", () => {
  const addressForm = document.querySelector("#address-form");
  addressForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const address = document.querySelector("#ship-address").value.trim();
    if (address) {
      updateIframeMap(address);
    } else {
      alert("Please enter an address.");
    }
  });
});

window.initAutocomplete = initAutocomplete;