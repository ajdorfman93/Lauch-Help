document.addEventListener("DOMContentLoaded", () => {
    const datePicker = document.getElementById("datePicker");
  
    // Set the date input to today's date
    function setDateToToday() {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      datePicker.value = formattedDate; // Set the value of the date picker
      fetchZmanim(formattedDate); // Fetch zmanim for today's date
    }
  
    async function fetchZmanim(date) {
      const url = `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&date=${date}`;
  
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
  
        const data = await response.json();
  
        // Map zmanim keys from API to HTML element IDs
        const zmanimMapping = {
          dawn: "dawn",
          misheyakirMachmir: "misheyakirMachmir",
          sunrise: "sunrise",
          sofZmanShmaMGA: "sofZmanShmaMGA",
          sofZmanShma: "sofZmanShma",
          sofZmanTfilla: "sofZmanTfilla",
          chatzot: "chatzot",
          minchaGedola: "minchaGedola",
          plagHaMincha: "plagHaMincha",
          sunset: "sunset",
          tzeit85deg: "tzeit85deg",
          tzeit72min: "tzeit72min",
        };
  
        // Loop through the mapping and update the times
        for (const [timeKey, elementId] of Object.entries(zmanimMapping)) {
          const timeValue = data.times[timeKey];
          if (timeValue) {
            document.getElementById(elementId).textContent = formatTime(timeValue);
          }
        }
      } catch (error) {
        console.error("Error fetching zmanim:", error);
      }
    }
  
    // Format ISO string to "HH:mm"
    function formatTime(isoString) {
      const date = new Date(isoString);
      return date.toTimeString().slice(0, 5); // Extract "HH:mm"
    }
  
    // Set today's date on page load
    setDateToToday();
  
    // Event listener for date selection
    datePicker.addEventListener("change", () => {
      const selectedDate = datePicker.value;
      if (selectedDate) {
        fetchZmanim(selectedDate);
      }
    });
  });
  