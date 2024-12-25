
async function initMap() {
    // 1) Request the needed libraries from the beta version
    const { Map, InfoWindow } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } =
      await google.maps.importLibrary("marker");

    // 2) Grab the JSON text from the hidden div
    const rawData = document
      .getElementById("prayerTimesOutput")
      .textContent.trim();

    // 3) Parse the JSON into an array of marker definitions
    let tourStops;
    try {
      tourStops = JSON.parse(rawData);
    } catch (err) {
      console.error("Error parsing JSON from #prayerTimesOutput:", err);
      return;
    }

    // 4) Create the map
    const map = new Map(document.getElementById("map"), {
      zoom: 12,
      // A central location near Sedona, for example
      center: { lat: 34.84555, lng: -111.8035 },
      // This mapId is just an example; remove or change if you want
      mapId: "4504f8b37365c3d0",
    });

    // 5) Create a shared InfoWindow
    const infoWindow = new InfoWindow();

    // 6) Loop through the array to create advanced markers
    tourStops.forEach(({ position, title }, i) => {
      // PinElement is optional but provides a nice stylized marker
      const pin = new PinElement({
        glyph: `${i + 1}`, // or any text
        scale: 1.5,        // adjust size
      });

      const marker = new AdvancedMarkerElement({
        position,
        map,
        title: `${i + 1}. ${title}`, // hover text
        content: pin.element,        // actual DOM element for the marker
        gmpClickable: true,          // ensure it's clickable
      });

      // 7) On marker click, open an info window
      marker.addListener("click", ({ domEvent, latLng }) => {
        infoWindow.close();
        infoWindow.setContent(marker.title);
        infoWindow.open(marker.map, marker);
      });
    });
  }