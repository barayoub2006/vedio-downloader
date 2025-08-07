// Import required libraries
const express = require('express');
const cors = require('cors');
// The new, powerful and actively maintained downloader library
const ytDlp = require('yt-dlp-exec');

// Create the server app
const app = express();
const PORT = 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.post('/download', async (req, res) => {
    const userUrl = req.body.url;
    if (!userUrl) {
        return res.status(400).json({ message: "يرجى لصق رابط الفيديو." });
    }

    console.log(`[LOG] Received URL: ${userUrl}`);
    console.log('[LOG] Processing with the powerful yt-dlp library...');

    try {
        // Use yt-dlp to get all video information as a JSON object.
        // The library will automatically download the latest yt-dlp binary if it's not found.
        const videoInfo = await ytDlp(userUrl, {
            dumpJson: true,
            noWarnings: true,
        });

        const title = videoInfo.title;
        
        // Filter and map the formats to match what our frontend expects
        const formats = videoInfo.formats
            // We filter for formats that have both a video and audio codec and a direct URL
            .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
            .map(f => ({
                // Create a user-friendly quality label
                qualityLabel: f.format_note || `${f.height}p`,
                url: f.url,
                container: f.ext || 'mp4'
            }));

        // If no suitable formats are found, throw an error
        if (formats.length === 0) {
            throw new Error('لم يتم العثور على صيغ فيديو مناسبة للتحميل.');
        }

        // Send the title and the list of formats back to the frontend
        res.status(200).json({
            title: title,
            formats: formats
        });
        
    } catch (error) {
        console.error(error); // Log the full technical error on the server console
        
        // Provide a more user-friendly error message to the frontend
        let errorMessage = "فشل في معالجة الرابط. تأكد من أن الرابط صحيح وأن الفيديو ليس خاصًا.";
        
        // If yt-dlp provides a specific error message in stderr, use it
        if (error.stderr) {
            errorMessage = error.stderr;
        }
        
        res.status(500).json({ message: errorMessage });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('yt-dlp server is ready. This is a much more robust solution!');
});
