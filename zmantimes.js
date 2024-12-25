document.addEventListener('DOMContentLoaded', async function () {
    const datePicker = document.getElementById('datePicker');
    const checkPrayerTimesButton = document.getElementById('checkPrayerTimesButton');
    let currentTefilahFilter = null;

    
    // Class to handle the chosen date
    class EntryTime {
        constructor(date) {
            this.setDate(date);
        }

        setDate(date) {
            const [year, month, day] = date.split('-').map(Number);
            // We'll store it in local time
            this.date = new Date(year, month - 1, day, 0, 0, 0);
        }

        get dateStr() {
            // Convert to YYYY-MM-DD in local time
            const y = this.date.getFullYear();
            const m = String(this.date.getMonth() + 1).padStart(2, "0");
            const d = String(this.date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        }

        hebcalUrl() {
            // For day-of-week / holiday checks
            return `https://www.hebcal.com/hebcal?cfg=json&maj=on&min=on&nx=on&start=${this.dateStr}&end=${this.dateStr}&ss=on&mf=on&d=on&c=on&geo=geoname&geonameid=5100280&M=on&s=on&leyning=off`;
        }

        get dayOfWeek() {
            const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            return weekday[this.date.getDay()]; 
        }
    }

    // conditionMapping for day-of-week and holiday logic
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
                "25 Kislev","26 Kislev","27 Kislev","28 Kislev",
                "29 Kislev","30 Kislev","1 Tevet","2 Tevet"
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
                "1 Nisan","2 Nisan","3 Nisan","4 Nisan","5 Nisan","6 Nisan","7 Nisan","8 Nisan","9 Nisan",
                "10 Nisan","11 Nisan","12 Nisan","13 Nisan","14 Nisan","15 Nisan","16 Nisan","17 Nisan","18 Nisan","19 Nisan",
                "20 Nisan","21 Nisan","22 Nisan","23 Nisan","24 Nisan","25 Nisan","26 Nisan","27 Nisan","28 Nisan","29 Nisan",
                "30 Nisan","1 Iyar","10 Tishrei","11 Tishrei","12 Tishrei","13 Tishrei","14 Tishrei","15 Tishrei","16 Tishrei",
                "17 Tishrei","18 Tishrei","19 Tishrei","20 Tishrei","21 Tishrei","22 Tishrei","23 Tishrei","24 Tishrei",
                "25 Tishrei","26 Tishrei","27 Tishrei","28 Tishrei","29 Tishrei","30 Tishrei","1 Cheshvan"
            ];
            return daysNisanToCheshvan.some(day => htmlContent.includes(day));
        },
        '#BHSR': (htmlContent) => {
            const daysAv = [
                "10 Av","11 Av","12 Av","13 Av","14 Av","15 Av","16 Av","17 Av","18 Av","19 Av","20 Av",
                "21 Av","22 Av","23 Av","24 Av","25 Av","26 Av","27 Av","28 Av","29 Av"
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
                "Fast of Esther","10 Tevet","17 Tammuz","9 Av"
            ];
            return !minorFastDays.some(fast => htmlContent.includes(fast));
        },

        '#FD': (htmlContent) => htmlContent.includes("fast") && !htmlContent.includes("major"),
        '#AMH': (htmlContent) => htmlContent.includes("major") && htmlContent.includes("yomtov"),

        // Additional codes to be processed by custom logic:
        '#ERS': null,  // handleERSLogic
        '#RSE': null,  // handleRSELogic
        '#UCT': null,  // handleUCTLogic
        '#RET': null,  // handleRETLogic
        '#UST': null,  // handleUSTLogic
        // #CUT => exclude if (Cut_off_Time) <= (Zman Start Time + Zman_Start_Adjustment)
        '#CUT': null
    };

    // We'll store the final filtered records here
    let filteredRecords = [];

    // Main function to load & display
    async function loadAndDisplayPrayerTimes() {
        const entryTime = new EntryTime(datePicker.value);

        try {
            // 1) Fetch Hebcal data for day-of-week/holiday checks
            const hebcalResponse = await fetch(entryTime.hebcalUrl());
            if (!hebcalResponse.ok) {
                throw new Error('Failed to fetch Hebcal data');
            }
            const hebcalData = await hebcalResponse.json();
            const htmlContent = JSON.stringify(hebcalData);

            // 2) Fetch local prayertimes.json
            const response = await fetch('prayertimes.json');
            if (!response.ok) {
                throw new Error('Failed to fetch prayertimes.json');
            }
            const data = await response.json();
            const records = data.records || [];

            // 3) Filter by day-of-week & holiday logic (using conditionMapping)
            filteredRecords = records.filter(record => {
                const fields = record.fields;
                const strCodeField = fields.strCode;
                let strCodeArray;

                if (typeof strCodeField === 'string') {
                    try {
                        // e.g. "['#CUT','#UST']" => ["#CUT","#UST"]
                        strCodeArray = JSON.parse(strCodeField.replace(/'/g, '"'));
                    } catch {
                        console.warn('Could not parse strCode as JSON. Using raw string check.');
                        strCodeArray = [strCodeField];
                    }
                } else {
                    strCodeArray = strCodeField; // If it's already an array
                }

                // Check for any "exclusion" code that returns false => exclude
                const hasExclusion = strCodeArray.some(code => {
                    const condition = conditionMapping[code];
                    if (condition && typeof condition === 'function') {
                        return !condition(htmlContent);
                    }
                    return false;
                });
                if (hasExclusion) return false;

                // Check for "inclusion" codes
                return strCodeArray.some(code => {
                    if (code in conditionMapping) {
                        const condition = conditionMapping[code];
                        if (!condition) {
                            // code is handled by custom logic (#CUT, #UST, etc.)
                            return true;
                        } 
                        if (typeof condition === 'function') {
                            return condition(htmlContent);
                        }
                        if (Array.isArray(condition)) {
                            return condition.includes(entryTime.dayOfWeek);
                        }
                        return false;
                    }
                    return false;
                });
            });

            // 4) Process special codes in order:
            await handleERSLogic(filteredRecords, entryTime);
            await handleRSELogic(filteredRecords, entryTime);
            await handleUSTLogic(filteredRecords, entryTime);  // #UST
            await handleUCTLogic(filteredRecords, entryTime);  // #UCT
            await handleRETLogic(filteredRecords, entryTime);  // #RET

            // #CUT => exclude if (Cut_off_Time) <= (ZmanStart + ZmanStartAdjustment)
            await handleCUTLogic(filteredRecords, entryTime);

            // 5) Display the resulting records
            displayRecords(filteredRecords);

        } catch (error) {
            console.error('Error fetching prayer times:', error);
            const container = document.getElementById('prayerTimesOutput');
            if (container) {
                container.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        }
    }

    // #ERS logic (Sunday->Friday range)
    async function handleERSLogic(records, entryTime) {
        const ersRecords = records.filter(rec => hasCode(rec, '#ERS'));
        if (ersRecords.length === 0) return;

        // Build Sunday->Friday range
        const chosenDate = entryTime.date;
        const dayOfWeek = chosenDate.getDay(); 
        const lastSunday = new Date(chosenDate.getTime());
        lastSunday.setDate(chosenDate.getDate() - dayOfWeek);

        const friday = new Date(lastSunday.getTime());
        friday.setDate(lastSunday.getDate() + 5);

        const ersUrl = buildZmanimRangeUrl(lastSunday, friday);
        const ersResp = await fetch(ersUrl);
        if (!ersResp.ok) {
            console.error('Failed to fetch ERS Zmanim data');
            return;
        }
        const ersData = await ersResp.json();

        for (const rec of ersRecords) {
            const fields = rec.fields;
            const zmanType = fields.strZman_Start_Time || "sunrise";
            const zmanObj = ersData.times[zmanType] || {};

            let earliestTime = null;
            for (const isoTime of Object.values(zmanObj)) {
                const currentTime = new Date(isoTime);
                if (!earliestTime || currentTime < earliestTime) {
                    earliestTime = currentTime;
                }
            }

            if (!earliestTime) {
                console.warn(`No ${zmanType} found in Sunday->Friday for #ERS`);
                continue;
            }

            // If Time_for_formula is given, apply
            if (fields.Time_for_formula) {
                const offsetDate = applyTimeFormula(earliestTime, fields.Time_for_formula);
                fields.Time = convertToAmPm(offsetDate.toTimeString().slice(0,5));
            }
        }
    }

    // #RSE logic (Sunday->Friday range)
    async function handleRSELogic(records, entryTime) {
        const rseRecords = records.filter(rec => hasCode(rec, '#RSE'));
        if (rseRecords.length === 0) return;

        // Sunday->Friday range
        const chosenDate = entryTime.date;
        const dayOfWeek = chosenDate.getDay();
        const lastSunday = new Date(chosenDate.getTime());
        lastSunday.setDate(chosenDate.getDate() - dayOfWeek);

        const friday = new Date(lastSunday.getTime());
        friday.setDate(lastSunday.getDate() + 5);

        const rseUrl = buildZmanimRangeUrl(lastSunday, friday);
        const rseResp = await fetch(rseUrl);
        if (!rseResp.ok) {
            console.error('Failed to fetch RSE Zmanim data');
            return;
        }
        const rseData = await rseResp.json();

        for (const rec of rseRecords) {
            const fields = rec.fields;
            const zmanType = fields.strZman_Start_Time || "sunrise";
            const zmanObj = rseData.times[zmanType] || {};

            let earliestTime = null;
            for (const isoTime of Object.values(zmanObj)) {
                const currentTime = new Date(isoTime);
                if (!earliestTime || currentTime < earliestTime) {
                    earliestTime = currentTime;
                }
            }

            if (!earliestTime) {
                console.warn(`No ${zmanType} found in Sunday->Friday for #RSE`);
                continue;
            }

            // Round earliestTime to nearest 5 minutes
            const roundedTime = roundToNearestFiveMinutes(earliestTime);
            fields.Time = convertToAmPm(roundedTime.toTimeString().slice(0,5));
        }
    }

    // #UST => fields.Time = (Zman_Start_Time) + (Zman_Start_Adjustment)
    async function handleUSTLogic(records, entryTime) {
        const ustRecords = records.filter(rec => hasCode(rec, '#UST'));
        if (ustRecords.length === 0) return;

        // Single-day Zmanim
        const singleDayUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&date=${entryTime.dateStr}`;
        const resp = await fetch(singleDayUrl);
        if (!resp.ok) {
            console.error('Failed to fetch single-day Zmanim for #UST');
            return;
        }
        const singleDayData = await resp.json();
        const zmanObj = singleDayData.times || {};

        for (const rec of ustRecords) {
            const fields = rec.fields;
            if (!fields.strZman_Start_Time) continue;

            const baseIso = zmanObj[fields.strZman_Start_Time.trim()];
            if (!baseIso) continue;

            let baseTime = new Date(baseIso);

            if (fields.Zman_Start_Adjustment) {
                baseTime = applyTimeFormula(baseTime, fields.Zman_Start_Adjustment);
                                }
                    
                                const hhmm = baseTime.toTimeString().slice(0,5);
                                fields.Time = convertToAmPm(hhmm);
                            }
                        }
                    
                    
                            // #UCT Logic (for single-time records not having #RET)
                            async function handleUCTLogic(records, entryTime) {
                                // All #UCT but no #RET
                                const uctRecordsNoRet = records.filter(rec => {
                                    return hasCode(rec, '#UCT') && !hasCode(rec, '#RET');
                                });
                                if (uctRecordsNoRet.length === 0) return;
                    
                                // 1) Single-day Zmanim
                                const singleDayUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&date=${entryTime.dateStr}`;
                                const resp = await fetch(singleDayUrl);
                                if (!resp.ok) {
                                    console.error('Failed to fetch single-day Zmanim for #UCT');
                                    return;
                                }
                                const singleDayData = await resp.json();
                                const zmanObj = singleDayData.times || {};
                    
                                // 2) Exclude if cutoff <= record's Time
                                for (let i = uctRecordsNoRet.length - 1; i >= 0; i--) {
                                    const rec = uctRecordsNoRet[i];
                                    const fields = rec.fields;
                    
                                    if (!fields.strZman_Cutoff_Time || !fields.Time) continue;
                    
                                    const cutoffZmanType = fields.strZman_Cutoff_Time.trim();
                                    const cutoffBaseIso = zmanObj[cutoffZmanType];
                                    if (!cutoffBaseIso) continue;
                    
                                    const recordTimeDate = parseTimeOnSameDate(entryTime.date, fields.Time);
                                    let cutoffTimeDate = new Date(cutoffBaseIso);
                    
                                    if (fields.Zman_Cutoff_Adjustment) {
                                        cutoffTimeDate = applyTimeFormula(cutoffTimeDate, fields.Zman_Cutoff_Adjustment);
                                    }
                    
                                    // If cutoff <= recordTime => remove
                                    if (cutoffTimeDate.getTime() <= recordTimeDate.getTime()) {
                                        const idxInFiltered = records.indexOf(rec);
                                        if (idxInFiltered !== -1) {
                                            records.splice(idxInFiltered, 1);
                                        }
                                    }
                                }
                            }
                    
                            // #RET Logic: repeat from "start" to "end" by Time_for_formula
                            // Start time:
                            //   - If #UST was applied, fields.Time is already overwritten
                            //   - else we parse fields.Time
                            // End time:
                            //   - If #UCT, end is (ZmanCutoffTime + ZmanCutoffAdjustment)
                            //   - else fields.Cut_off_Time
                            async function handleRETLogic(records, entryTime) {
                                const retRecords = records.filter(rec => hasCode(rec, '#RET'));
                                if (retRecords.length === 0) return;
                    
                                // We'll need single-day Zmanim to handle #UCT
                                const singleDayUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&date=${entryTime.dateStr}`;
                                let singleDayData = null;
                                let zmanObj = {};
                                try {
                                    const resp = await fetch(singleDayUrl);
                                    if (resp.ok) {
                                        singleDayData = await resp.json();
                                        zmanObj = singleDayData.times || {};
                                    }
                                } catch (err) {
                                    console.warn("Could not fetch single-day Zmanim for #RET logic.", err);
                                }
                    
                                for (const rec of retRecords) {
                                    const fields = rec.fields;
                                    const intervalStr = fields.Time_for_formula || "00:00";  // "HH:MM"
                                    const [intHh, intMm] = intervalStr.split(':').map(Number);
                                    const intervalMinutes = (intHh * 60) + intMm;
                    
                                    // 1) Start time = parse fields.Time (unless #UST has changed it)
                                    let startDate = parseTimeOnSameDate(entryTime.date, fields.Time);
                                    if (isNaN(startDate.getTime())) {
                                        console.warn("No valid start time for #RET record:", rec);
                                        continue;
                                    }
                    
                                    // 2) End time
                                    let endDate = null;
                                    if (hasCode(rec, '#UCT') && fields.strZman_Cutoff_Time) {
                                        const cutoffZmanType = fields.strZman_Cutoff_Time.trim();
                                        const cutoffBaseIso = zmanObj[cutoffZmanType];
                                        if (cutoffBaseIso) {
                                            endDate = new Date(cutoffBaseIso);
                                            if (fields.Zman_Cutoff_Adjustment) {
                                                endDate = applyTimeFormula(endDate, fields.Zman_Cutoff_Adjustment);
                                            }
                                        }
                                    }
                                    // if not found or #UCT not present => try fields.Cut_off_Time
                                    if (!endDate && fields.Cut_off_Time) {
                                        endDate = parseTimeOnSameDate(entryTime.date, fields.Cut_off_Time);
                                    }
                                    // fallback if still no valid end
                                    if (!endDate || isNaN(endDate.getTime())) {
                                        console.warn("No valid end time for #RET. Using +12h fallback.");
                                        endDate = new Date(startDate.getTime() + 12 * 60 * 60 * 1000);
                                    }
                    
                                    // 3) Generate times from start => end in [intervalStr] increments
                                    const timesArr = [];
                                    let current = new Date(startDate.getTime());
                                    while (current <= endDate) {
                                        const hhmm = current.toTimeString().slice(0, 5);
                                        timesArr.push(convertToAmPm(hhmm));
                                        current.setMinutes(current.getMinutes() + intervalMinutes);
                                    }
                    
                                    // 4) Store
                                    fields.Time = timesArr.join(" | ");
                                }
                            }
                    
                    
                        // #CUT => Exclude if (Cut_off_Time) <= (Zman_Start_Time + Zman_Start_Adjustment)
                        async function handleCUTLogic(records, entryTime) {
                            const cutRecords = records.filter(rec => hasCode(rec, '#CUT'));
                            if (cutRecords.length === 0) return;
                    
                            // Single-day Zmanim
                            const singleDayUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&date=${entryTime.dateStr}`;
                            const resp = await fetch(singleDayUrl);
                            if (!resp.ok) {
                                console.error('Failed to fetch single-day Zmanim for #CUT');
                                return;
                            }
                            const singleDayData = await resp.json();
                            const zmanObj = singleDayData.times || {};
                    
                            for (let i = cutRecords.length - 1; i >= 0; i--) {
                                const rec = cutRecords[i];
                                const fields = rec.fields;
                    
                                // We interpret #CUT as: "exclude if Cut_off_Time <= (Zman Start Time + Zman_Start_Adjustment)"
                                const cutOffTimeStr = fields.Cut_off_Time;
                                const zmanType = fields.strZman_Start_Time;
                                if (!cutOffTimeStr || !zmanType) {
                                    continue;
                                }
                    
                                // 1) Parse the record's Cut_off_Time => local Date
                                const cutOffTimeDate = parseTimeOnSameDate(entryTime.date, cutOffTimeStr);
                                if (isNaN(cutOffTimeDate.getTime())) {
                                    // Invalid cutoff => skip
                                    continue;
                                }
                    
                                // 2) Build "ZmanStart + Zman_Start_Adjustment"
                                const baseIso = zmanObj[zmanType.trim()];
                                if (!baseIso) {
                                    // If we can't find the zman in the data
                                    continue;
                                }
                                let zmanStartDate = new Date(baseIso);
                                if (fields.Zman_Start_Adjustment) {
                                    zmanStartDate = applyTimeFormula(zmanStartDate, fields.Zman_Start_Adjustment);
                                }
                    
                                // 3) If (Cut_off_Time <= zmanStartDate) => exclude
                                if (cutOffTimeDate.getTime() <= zmanStartDate.getTime()) {
                                    const idx = records.indexOf(rec);
                                    if (idx !== -1) {
                                        records.splice(idx, 1);
                                    }
                                }
                            }
                        }
                    
                        // Utility: check if a record has a given code
                        function hasCode(record, code) {
                            const { strCode } = record.fields;
                            if (!strCode) return false;
                    
                            let arr = [];
                            if (typeof strCode === 'string') {
                                try {
                                    arr = JSON.parse(strCode.replace(/'/g, '"'));
                                } catch {
                                    arr = [strCode];
                                }
                            } else {
                                arr = strCode;
                            }
                            return arr.includes(code);
                        }
                    
                        // Utility: build Zmanim range URL
                        function buildZmanimRangeUrl(dateA, dateB) {
                            const dA = toYyyyMmDd(dateA);
                            const dB = toYyyyMmDd(dateB);
                            return `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&start=${dA}&end=${dB}`;
                        }
                    
                        // Convert local Date => "YYYY-MM-DD"
                        function toYyyyMmDd(date) {
                            const yy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            return `${yy}-${mm}-${dd}`;
                        }
                    
                        // applyTimeFormula: e.g. "+00:10" => add 10 minutes
                        function applyTimeFormula(baseDate, formula) {
                            const sign = formula.startsWith('-') ? -1 : 1;
                            const cleanFormula = formula.replace('-', '');
                            const [hh, mm] = cleanFormula.split(':').map(Number);
                    
                            const adjustedDate = new Date(baseDate.getTime());
                            adjustedDate.setMinutes(adjustedDate.getMinutes() + sign * (hh * 60 + mm));
                            return adjustedDate;
                        }
                    
                        // parseTimeOnSameDate: e.g. "10:00 AM" => local Date on same Y/M/D as baseDate
                        function parseTimeOnSameDate(baseDate, timeStr) {
                            if (!timeStr) return new Date('invalid');
                    
                            const y = baseDate.getFullYear();
                            const m = baseDate.getMonth();
                            const d = baseDate.getDate();
                    
                            const [timePart, ampmPart] = timeStr.split(' ');
                            if (!timePart) return new Date('invalid');
                    
                            const [hhStr, mmStr] = timePart.split(':');
                            let hour = parseInt(hhStr, 10) || 0;
                            const minute = parseInt(mmStr, 10) || 0;
                    
                            if (ampmPart && ampmPart.toUpperCase() === 'PM' && hour < 12) {
                                hour += 12;
                            } 
                            if (ampmPart && ampmPart.toUpperCase() === 'AM' && hour === 12) {
                                hour = 0;
                            }
                    
                            return new Date(y, m, d, hour, minute, 0);
                        }
                    
                        // Round date to nearest 5 minutes
                        function roundToNearestFiveMinutes(date) {
                            const ms = 1000 * 60 * 5;
                            return new Date(Math.round(date.getTime() / ms) * ms);
                        }
                    
                        // convert "HH:mm" (24h) => "h:mm AM/PM"
                        function convertToAmPm(time24) {
                            if (typeof time24 !== 'string') {
                                console.warn("convertToAmPm() expected a string, got:", time24);
                                return '';
                            }
                            const [hoursStr, minutesStr] = time24.split(':');
                            let hours = parseInt(hoursStr, 10);
                            const minutes = parseInt(minutesStr, 10);
                    
                            const suffix = hours >= 12 ? 'PM' : 'AM';
                            hours = hours % 12 || 12;
                            return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
                        }
                    // Finally, displayRecords in JSON
                    function displayRecords(records) {
                        const container = document.getElementById('prayerTimesOutput');
                        if (!container) return;
                    
                        if (records.length === 0) {
                            container.innerHTML = `<p>No matching prayer times found.</p>`;
                            return;
                        }
                    
                        // Convert records to JSON structure
                        const jsonOutput = records.map(record => {
                            const fields = record.fields;
                            return {
                                Shul: fields.StrShulName2 || fields.StrShulName || '',
                                Tefilah: fields.Tefilah_Tefilahs || '',
                                Time: fields.Time || '',
                                Data: `${fields.Address || ''}, ${fields.City || ''}, ${fields.State || ''}`.trim(),
                                strCode: fields.strCode || ''
                            };
                        });
                    
                        // Pretty print JSON and display
                        container.innerHTML = `<pre>${JSON.stringify(jsonOutput, null, 2)}</pre>`;
                    }
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
                            lat: location.lat || '',
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
                    /****************************************************
                     * 8) Button listener for "Check Prayer Times"
                     ****************************************************/
                    if (checkPrayerTimesButton) {
                        checkPrayerTimesButton.addEventListener('click', async () => {
                          try {
                            console.log("Check Prayer Times button clicked.");
                      
                            // 1) Load and display the entire filtered JSON (based on date, #ERS, #RSE, etc.)
                            //    This populates `filteredRecords` and calls `displayRecords(filteredRecords)`
                            await loadAndDisplayPrayerTimes();
                           // Reapply the current tefilah filter
                           if (currentTefilahFilter) {
                            applyTefilahFilter(currentTefilahFilter);
                        }
                            // At this stage, #prayerTimesOutput has JSON for *all* matching records,
                            // but we do NOT geocode them yet. We'll geocode only for Tefilah subsets.
                          } catch (err) {
                            console.error("Error in Check Prayer Times flow:", err);
                          }
                        });
                      }
                      
                      /****************************************************
                       * TEFILAH BUTTONS: handle filter + geocode subset
                       ****************************************************/
                       document.addEventListener('click', async function (e) {
                            if (e.target.classList.contains('tefilah-button')) {
                                currentTefilahFilter = e.target.getAttribute('data-tefilah'); // Save the selected filter
                                applyTefilahFilter(currentTefilahFilter);
                            }
                        });
                    
                        function applyTefilahFilter(filter) {
                            let filteredByTefilah;
                    
                            if (filter === 'Shachris') {
                                filteredByTefilah = filteredRecords.filter(record => {
                                    const arr = parseTefilahArray(record.fields.Tefilah_Tefilahs);
                                    return arr.some(t => t.toLowerCase() === 'shachris');
                                });
                            } else if (filter === 'Mincha') {
                                filteredByTefilah = filteredRecords.filter(record => {
                                    const arr = parseTefilahArray(record.fields.Tefilah_Tefilahs);
                                    return arr.some(t => t.toLowerCase() === 'mincha');
                                });
                            } else if (filter === 'Maariv') {
                                filteredByTefilah = filteredRecords.filter(record => {
                                    const arr = parseTefilahArray(record.fields.Tefilah_Tefilahs);
                                    return arr.some(t => t.toLowerCase() === 'maariv');
                                });
                            } else if (filter === 'Special') {
                                filteredByTefilah = filteredRecords.filter(record => {
                                    const arr = parseTefilahArray(record.fields.Tefilah_Tefilahs);
                                    return !arr.some(t => ['shachris', 'mincha', 'maariv'].includes(t.toLowerCase()));
                                });
                            } else {
                                filteredByTefilah = filteredRecords.slice();
                            }
                    
                            displayRecords(filteredByTefilah);
                            geocodeJsonInPrayerTimesOutput();
                        }
                    
                        function parseTefilahArray(raw) {
                            if (!raw) return [];
                            if (Array.isArray(raw)) return raw;
                            if (typeof raw === 'string') {
                                try {
                                    return JSON.parse(raw.replace(/'/g, '"'));
                                } catch {
                                    return [raw.trim()];
                                }
                            }
                            return [raw];
                        }
                    });