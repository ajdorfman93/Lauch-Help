/**
 * Fetch geocodes for each record using the Google Geocoding API.
 *
 * @param {Array} records - Array of record objects.
 *   Each record should have a `fields` property with:
 *     - Address
 *     - City
 *     - State
 *
 * @returns {Promise<Array>} Promise that resolves to an array of geocode results.
 *   Each result includes the original record plus the latitude and longitude.
 */
async function getGeocodes(records) {
  const apiKey = 'AIzaSyBOtVjKr3D0vZmwg1QlxCy6SR4rVQenaPU';
  
  // Map each record to a Promise that fetches the geocode
  const geocodePromises = records.map(async (record) => {
    const fields = record.fields || {};
    
    // Construct the address string
    const addressStr = `${fields.Address || ''}, ${fields.City || ''}, ${fields.State || ''}`;
    // Encode the address for use in the URL
    const encodedAddress = encodeURIComponent(addressStr.trim());
    
    // Build the Geocoding API URL
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Check if the response contains valid geocoding results
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          ...record,
          latitude: location.lat,
          longitude: location.lng,
        };
      } else {
        // Return the record untouched if no geocode found
        console.warn(`No geocode found for: ${addressStr}`);
        return {
          ...record,
          latitude: null,
          longitude: null,
        };
      }
    } catch (error) {
      console.error(`Error fetching geocode for ${addressStr}:`, error);
      // Return the record untouched if there's an error
      return {
        ...record,
        latitude: null,
        longitude: null,
      };
    }
  });

  // Wait for all Promises to resolve
  const geocodes = await Promise.all(geocodePromises);
  
  return geocodes;
}

// Example usage:
// (async () => {
//   const records = [
//     { fields: { Address: '1600 Amphitheatre Parkway', City: 'Mountain View', State: 'CA' } },
//     { fields: { Address: '1 Infinite Loop', City: 'Cupertino', State: 'CA' } }
//   ];
//   const geocodedRecords = await getGeocodes(records);
console.log('Geocoded Records:', geocodedRecords);
// })();
