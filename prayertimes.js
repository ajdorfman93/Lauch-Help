document.addEventListener('DOMContentLoaded', async function () {
    const datePicker = document.getElementById('datePicker');
    const checkPrayerTimesButton = document.getElementById('checkPrayerTimesButton');

    // --- Integrated Zmanim for today's date ---
    function setDateToToday() {
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        datePicker.value = formattedDate;
        fetchZmanim(formattedDate);
    }

    async function fetchZmanim(date) {
        const url = `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&date=${date}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const data = await response.json();

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

            for (const [timeKey, elementId] of Object.entries(zmanimMapping)) {
                const timeValue = data.times[timeKey];
                if (timeValue && document.getElementById(elementId)) {
                    document.getElementById(elementId).textContent = formatTime(timeValue);
                }
            }
        } catch (error) {
            console.error("Error fetching zmanim:", error);
        }
    }

    function formatTime(isoString) {
        const date = new Date(isoString);
        return date.toTimeString().slice(0, 5);
    }

    setDateToToday();

    datePicker.addEventListener("change", () => {
        const selectedDate = datePicker.value;
        if (selectedDate) {
            fetchZmanim(selectedDate);
        }
    });
    // --- End of integrated Zmanim code ---

    class EntryTime {
        constructor(date) {
            this.setDate(date);
        }

        setDate(date) {
            const [year, month, day] = date.split('-').map(Number);
            this.date = new Date(Date.UTC(year, month - 1, day));
        }

        get dateStr() {
            return this.date.toISOString().split('T')[0];
        }

        hebcalUrl() {
            return `https://www.hebcal.com/hebcal?cfg=json&maj=on&min=on&nx=on&start=${this.dateStr}&end=${this.dateStr}&ss=on&mf=on&d=on&c=on&geo=geoname&geonameid=5100280&M=on&s=on&leyning=off`;
        }

        get dayOfWeek() {
            const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            return weekday[this.date.getUTCDay()];
        }
    }

    const conditionMapping = {
        '#SF': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        '#ST': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        '#AW': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        '#XMT': ['Tuesday', 'Wednesday', 'Friday'],
        '#MTT': ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        '#MND': ['Monday'],
        '#TD': ['Tuesday'],
        '#WD': ['Wednesday'],
        '#TH': ['Thursday'],
        '#FR': ['Friday'],
        '#SUN': ['Sunday'],
        '#SHA': ['Saturday'],

        '#RH1': (htmlContent) => htmlContent.includes("1st of Tishrei"),
        '#RH2': (htmlContent) => htmlContent.includes("ראש השנה ב׳"),
        '#YK': (htmlContent) => htmlContent.includes("10 Tishrei"),
        '#SUK1': (htmlContent) => htmlContent.includes("סוכות א"),
        '#SUK2': (htmlContent) => htmlContent.includes("סוכות ב"),
        '#CHM-SUK': (htmlContent) => htmlContent.includes("Sukkot") && htmlContent.includes("CH’’M"),
        '#SHM-SUK': (htmlContent) => htmlContent.includes("Shmini Atzeret"),
        '#SIT': (htmlContent) => htmlContent.includes("Simchat Torah"),

        '#CHAN': (htmlContent) => {
            const eightdays = [
                "25 Kislev", "26 Kislev", "27 Kislev", "28 Kislev", "29 Kislev", "30 Kislev", "1 Tevet", "2 Tevet"
            ];
            return eightdays.some(day => htmlContent.includes(day));
        },
        '#CHAN1': (htmlContent) => htmlContent.includes("25 Kislev"), 
        '#CHAN2': (htmlContent) => htmlContent.includes("26 Kislev"),
        '#CHAN3': (htmlContent) => htmlContent.includes("27 Kislev"),
        '#CHAN4': (htmlContent) => htmlContent.includes("28 Kislev"),
        '#CHAN5': (htmlContent) => htmlContent.includes("29 Kislev"),
        '#CHAN6': (htmlContent) => htmlContent.includes("30 Kislev"),
        '#CHAN7': (htmlContent) => htmlContent.includes("1 Tevet"),
        '#CHAN8': (htmlContent) => htmlContent.includes("2 Tevet"),

        '#BHZ': (htmlContent) => {
            const daysNisanToCheshvan = [
                "1 Nisan", "2 Nisan", "3 Nisan", "4 Nisan", "5 Nisan", "6 Nisan", "7 Nisan", "8 Nisan", "9 Nisan",
                "10 Nisan", "11 Nisan", "12 Nisan", "13 Nisan", "14 Nisan", "15 Nisan", "16 Nisan", "17 Nisan", "18 Nisan", "19 Nisan",
                "20 Nisan", "21 Nisan", "22 Nisan", "23 Nisan", "24 Nisan", "25 Nisan", "26 Nisan", "27 Nisan", "28 Nisan", "29 Nisan",
                "30 Nisan", "1 Iyar", "10 Tishrei", "11 Tishrei", "12 Tishrei", "13 Tishrei", "14 Tishrei", "15 Tishrei", "16 Tishrei",
                "17 Tishrei", "18 Tishrei", "19 Tishrei", "20 Tishrei", "21 Tishrei", "22 Tishrei", "23 Tishrei", "24 Tishrei",
                "25 Tishrei", "26 Tishrei", "27 Tishrei", "28 Tishrei", "29 Tishrei", "30 Tishrei", "1 Cheshvan"
            ];
            return daysNisanToCheshvan.some(day => htmlContent.includes(day));
        },
        '#BHSR': (htmlContent) => {
            const daysAv = [
                "10 Av", "11 Av", "12 Av", "13 Av", "14 Av", "15 Av", "16 Av", "17 Av", "18 Av", "19 Av", "20 Av",
                "21 Av", "22 Av", "23 Av", "24 Av", "25 Av", "26 Av", "27 Av", "28 Av", "29 Av"
            ];
            return daysAv.some(day => htmlContent.includes(day));
        },

        '#EVY': (htmlContent) => htmlContent.includes("Erev Yom Kippur"),
        '#EVPS': (htmlContent) => htmlContent.includes("Erev Pesach"),
        '#EVSUK': (htmlContent) => htmlContent.includes("Erev Sukkot"),
        '#EVRH': (htmlContent) => htmlContent.includes("29 Elul"),

        '#RC': (htmlContent) => htmlContent.toLowerCase().includes("rosh chodesh"),
        '#XRC': (htmlContent) => !htmlContent.toLowerCase().includes("rosh chodesh"),
        '#XFD': (htmlContent) => {
            const minorFastDays = [
                "Fast of Esther",
                "10 Tevet",
                "17 Tammuz",
                "9 Av"
            ];
            return !minorFastDays.some(fast => htmlContent.includes(fast));
        },

        '#FD': (htmlContent) => htmlContent.includes("fast") && !htmlContent.includes("major"),
        '#AMH': (htmlContent) => htmlContent.includes("major") && htmlContent.includes("yomtov"),
        '#ERS': null // Handled separately
    };

    let filteredRecords = [];

    async function loadAndDisplayPrayerTimes() {
        const entryTime = new EntryTime(datePicker.value);

        try {
            // Fetch Hebcal data
            const hebcalResponse = await fetch(entryTime.hebcalUrl());
            if (!hebcalResponse.ok) {
                throw new Error('Failed to fetch Hebcal data');
            }
            const hebcalData = await hebcalResponse.json();
            const htmlContent = JSON.stringify(hebcalData);

            // Fetch prayer times
            const response = await fetch('prayertimes.json');
            if (!response.ok) {
                throw new Error('Failed to fetch prayertimes.json');
            }

            const data = await response.json();
            const records = data.records || [];

            filteredRecords = records.filter(record => {
                const fields = record.fields;
                const strCodeField = fields.strCode;
                let strCodeArray;

                if (typeof strCodeField === 'string') {
                    try {
                        strCodeArray = JSON.parse(strCodeField.replace(/'/g, '"'));
                    } catch (e) {
                        console.warn('Could not parse strCode as JSON. Using raw string check.');
                        strCodeArray = [strCodeField];
                    }
                } else {
                    strCodeArray = strCodeField;
                }

                // Check for exclusions first
                const hasExclusion = strCodeArray.some(code => {
                    const condition = conditionMapping[code];
                    if (condition && typeof condition === 'function') {
                        return !condition(htmlContent); 
                    }
                    return false;
                });
                if (hasExclusion) return false;

                // Check for inclusions
                return strCodeArray.some(code => {
                    if (code === '#ERS') return true; // Handle later separately

                    const condition = conditionMapping[code];
                    if (!condition) {
                        // #ERS alone doesn't include, needs another inclusion code
                        if (code === '#ERS') return false;
                        return false;
                    }
                    if (typeof condition === 'function') {
                        return condition(htmlContent);
                    } else if (Array.isArray(condition)) {
                        return condition.includes(entryTime.dayOfWeek);
                    } else if (typeof condition === 'function') {
                        return condition(htmlContent);
                    }

                    return false;
                });
            });

            await handleERSLogic(filteredRecords, entryTime);

            displayRecords(filteredRecords);

        } catch (error) {
            console.error('Error fetching prayer times:', error);
            const container = document.getElementById('prayerTimesOutput');
            if (container) {
                container.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        }
    }

    async function handleERSLogic(records, entryTime) {
        const ersRecords = records.filter(rec => {
            const codes = rec.fields.strCode;
            const codeArray = Array.isArray(codes) ? codes : JSON.parse(codes.replace(/'/g, '"'));
            return codeArray.includes('#ERS');
        });
    
        if (ersRecords.length === 0) return;
    
        const chosenDate = entryTime.date;
        const dayOfWeek = chosenDate.getUTCDay(); // Sunday=0
        const lastSunday = new Date(chosenDate.getTime());
        lastSunday.setUTCDate(chosenDate.getUTCDate() - dayOfWeek);
    
        const friday = new Date(lastSunday.getTime());
        friday.setUTCDate(lastSunday.getUTCDate() + 5);
    
        const lastSundayStr = lastSunday.toISOString().split('T')[0];
        const fridayStr = friday.toISOString().split('T')[0];
    
        const ersUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&start=${lastSundayStr}&end=${fridayStr}`;
        const ersResp = await fetch(ersUrl);
        if (!ersResp.ok) {
            console.error('Failed to fetch ERS Zmanim data');
            return;
        }
        const ersData = await ersResp.json();
    
        let earliestSunrise = null;
    
        // Debugging: Log each sunrise time being processed
        console.log("Processing sunrise times for date range:", lastSundayStr, "to", fridayStr);
        for (const [date, time] of Object.entries(ersData.times.sunrise || {})) {
            const sunriseTime = new Date(time);
            console.log(`Date: ${date}, Sunrise: ${sunriseTime.toISOString()}`); // Log each sunrise
    
            if (!earliestSunrise || sunriseTime < earliestSunrise) {
                console.log(`New earliest sunrise found: ${sunriseTime.toISOString()}`); // Log updates
                earliestSunrise = sunriseTime;
            }
        }
    
        if (!earliestSunrise) {
            console.warn("No sunrise found in the Sunday to Friday range for ERS");
            return;
        }
    
        console.log(`Earliest sunrise for the week: ${earliestSunrise.toISOString()}`); // Final result
    
        for (const rec of ersRecords) {
            const fields = rec.fields;
            const formula = fields.Time_for_formula;
            if (formula) {
                const adjustedTime = applyTimeFormula(earliestSunrise, formula);
                console.log(`Adjusted time for record (${rec.fields.StrShulName2}): ${adjustedTime}`); // Log adjusted time
                fields.Time = adjustedTime;
            }
        }
    }
    

    function applyTimeFormula(baseTime, formula) {
        const sign = formula.startsWith('-') ? -1 : 1;
        const cleanFormula = formula.replace('-', '');
        const [hh, mm] = cleanFormula.split(':').map(Number);

        const adjustedDate = new Date(baseTime.getTime());
        adjustedDate.setMinutes(adjustedDate.getMinutes() + sign * (hh * 60 + mm));

        return adjustedDate.toTimeString().slice(0, 5);
    }

    function displayRecords(records) {
        const container = document.getElementById('prayerTimesOutput');
        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = `<p>No matching prayer times found.</p>`;
            return;
        }

        let tableHtml = '<table><tr><th>Shul</th><th>Tefilah</th><th>Time</th><th>Data</th><th>strCode</th></tr>';
        for (const record of records) {
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
    }

    if (checkPrayerTimesButton) {
        checkPrayerTimesButton.addEventListener('click', loadAndDisplayPrayerTimes);
    }

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('tefilah-button')) {
            const tefilahFilter = e.target.getAttribute('data-tefilah');

            let filteredByTefilah;
            if (tefilahFilter === "Special") {
                filteredByTefilah = filteredRecords.filter(record => {
                    const t = record.fields.Tefilah_Tefilahs || '';
                    return t !== 'Shachris' && t !== 'Mincha' && t !== 'Maariv';
                });
            } else {
                filteredByTefilah = filteredRecords.filter(record => {
                    const t = record.fields.Tefilah_Tefilahs || '';
                    return t.toLowerCase() === tefilahFilter.toLowerCase();
                });
            }

            displayRecords(filteredByTefilah);
        }
    });
});
