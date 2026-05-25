export async function createMeeting(provider, startTime, durationMinutes = 30) {
    // In a real implementation, this would call the respective APIs
    // For now, we return mock links
    const meetingId = Math.random().toString(36).substring(7);
    if (provider === "zoom") {
        return {
            provider: "zoom",
            link: `https://zoom.us/j/${meetingId}`,
            meetingId,
            password: "123456",
        };
    }
    else {
        return {
            provider: "google_meet",
            link: `https://meet.google.com/${meetingId.substring(0, 3)}-${meetingId.substring(3, 7)}-${meetingId.substring(7, 10)}`,
            meetingId,
        };
    }
}
