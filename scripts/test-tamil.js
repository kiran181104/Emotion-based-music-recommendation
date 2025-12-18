/**
 * Test script to verify Tamil song filtering
 * Run this in the browser console to test the search functionality
 */

// Test the Tamil song filtering
async function testTamilFiltering() {
    console.log('Testing Tamil song filtering...');

    // Test each emotion
    const emotions = ['happy', 'sad', 'chill', 'energetic', 'romantic'];

    for (const emotion of emotions) {
        console.log(`\n--- Testing ${emotion} emotion ---`);

        try {
            // Get tracks for this emotion
            const tracks = await window.spotifyAPI.searchByEmotion(emotion, 5);
            console.log(`Found ${tracks.length} tracks for ${emotion}`);

            // Check if all tracks are Tamil
            let tamilCount = 0;
            tracks.forEach((track, index) => {
                const isTamil = window.spotifyAPI.isTamilSong(track);
                if (isTamil) tamilCount++;
                console.log(`${index + 1}. "${track.name}" by ${track.artists[0].name} - Tamil: ${isTamil}`);
            });

            console.log(`Tamil tracks: ${tamilCount}/${tracks.length}`);

        } catch (error) {
            console.error(`Error testing ${emotion}:`, error);
        }
    }
}

// Make functions available globally for testing
window.testTamilFiltering = testTamilFiltering;

console.log('Test functions loaded. Run testTamilFiltering() in the console after authenticating with Spotify.');