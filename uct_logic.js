export async function fetchZmanimAndCheckCutoff(zmanimUrl, zmanCutoffTime, zmanCutoffAdjustment) {
    try {
        const zmanimResponse = await fetch(zmanimUrl);
        if (!zmanimResponse.ok) {
            throw new Error('Failed to fetch Zmanim data');
        }
        const zmanimData = await zmanimResponse.json();

        const zmanCutoff = zmanimData[zmanCutoffTime];
        if (!zmanCutoff) {
            throw new Error(`Zman cutoff time "${zmanCutoffTime}" not found in data.`);
        }

        const adjustmentParts = zmanCutoffAdjustment.split(':').map(Number);
        const adjustmentInMs = (adjustmentParts[0] * 60 + adjustmentParts[1]) * 60 * 1000;
        return new Date(new Date(zmanCutoff).getTime() + adjustmentInMs);
    } catch (error) {
        console.error('Error in fetchZmanimAndCheckCutoff:', error);
        throw error;
    }
}

export function isPrayerExcluded(prayerTime, cutoffTime) {
    const prayerDate = new Date(`1970-01-01T${prayerTime}Z`);
    return prayerDate <= cutoffTime; // Exclude if prayer time is on or before the cutoff time
}
