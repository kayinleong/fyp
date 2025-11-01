/**
 * Converts Firestore timestamps to serializable format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertTimestamps(data: any): any {
    if (!data) return data;

    const result = { ...data };

    // Convert timestamp fields to serializable format
    Object.keys(result).forEach(key => {
        // Check if the property is a Firestore Timestamp
        if (result[key] && typeof result[key].toDate === 'function') {
            // Convert to ISO string for serialization
            result[key] = result[key].toDate().toISOString();
        } else if (result[key] && typeof result[key] === 'object') {
            // Handle nested objects (including arrays)
            result[key] = convertTimestamps(result[key]);
        }
    });

    return result;
}