document.addEventListener('DOMContentLoaded', async function() {
    const datePicker = document.getElementById('datePicker');
    const checkPrayerTimesButton = document.getElementById('checkPrayerTimesButton');

    if (checkPrayerTimesButton) {
        checkPrayerTimesButton.addEventListener('click', async () => {
            const entryTime = new EntryTime(datePicker.value);

            try {
                // Fetch the prayer times JSON
                const response = await fetch('prayertimes.json');
                if (!response.ok) {
                    throw new Error('Failed to fetch prayertimes.json');
                }
                
                const data = await response.json();
                const records = data.records || [];

                // Filter the records based on the day of week and strCode conditions
                const filtered = records.filter(record => {
                    const fields = record.fields;
                    const strCodeField = fields.strCode; // e.g. "['#SF']"
                    let strCodeArray;

                    // Convert strCode from string to array if needed
                    if (typeof strCodeField === 'string') {
                        try {
                            // Replace single quotes with double quotes to valid JSON format
                            strCodeArray = JSON.parse(strCodeField.replace(/'/g, '"'));
                        } catch (e) {
                            console.warn('Could not parse strCode as JSON. Using raw string check.');
                            strCodeArray = [strCodeField];
                        }
                    } else {
                        // If strCode is already an array
                        strCodeArray = strCodeField;
                    }

                    // Example condition:
                    // If it's Sunday, show records that contain '#SUN'
                    if (entryTime.dayOfWeek === 'Sunday') {
                        return strCodeArray && strCodeArray.includes('#SUN');
                    }

                    // Add more conditions for other days or holidays as needed
                    // else if (entryTime.dayOfWeek === 'Monday') { ... }

                    // If no conditions match for this day, exclude the record
                    return false;
                });

                // Display the filtered records
                const container = document.getElementById('prayerTimesOutput');
                if (!container) return;

                if (filtered.length === 0) {
                    container.innerHTML = `<p>No matching prayer times found for ${entryTime.dayOfWeek}.</p>`;
                    return;
                }

                let tableHtml = '<table><tr><th>Shul</th><th>Tefilah</th><th>Time</th><th>Data</th><th>strCode</th></tr>';
                for (const record of filtered) {
                    const fields = record.fields;
                    tableHtml += `
                        <tr>
                            <td>${fields.StrShulName2 || ''}</td>
                            <td>${fields.Tefilah_Tefilahs || ''}</td>
                            <td>${fields.Time || ''}</td>
                            <td>${fields.Data || ''}</td>
                            <td>${fields.strCode || ''}</td>
                        </tr>
                    `;
                }
                tableHtml += '</table>';
                container.innerHTML = tableHtml;

            } catch (error) {
                console.error('Error fetching prayer times:', error);
                const container = document.getElementById('prayerTimesOutput');
                if (container) {
                    container.innerHTML = `<p>Error: ${error.message}</p>`;
                }
            }
        });
    }
});
