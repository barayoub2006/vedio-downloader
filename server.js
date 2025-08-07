// Import required libraries
const express = require('express');
const cors = require('cors');
const ytDlp = require('yt-dlp-exec');
const path = require('path'); // Add the 'path' module to handle file paths

// Create the server app
const app = express();
// Use the port provided by Render, or 3000 if running locally
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
// This important line tells Express to serve static files (like index.html) from the current directory
app.use(express.static(path.join(__dirname)));

// --- Main Page Route ---
// This new route sends the index.html file when someone visits the main URL ("/")
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- API Route ---
app.post('/download', async (req, res) => {
    const userUrl = req.body.url;
    if (!userUrl) {
        return res.status(400).json({ message: "يرجى لصق رابط الفيديو." });
    }

    console.log(`[LOG] Received URL: ${userUrl}`);
    console.log('[LOG] Processing with yt-dlp...');

    try {
        const videoInfo = await ytDlp(userUrl, { dumpJson: true, noWarnings: true });
        const title = videoInfo.title;
        const formats = videoInfo.formats
            .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
            .map(f => ({
                qualityLabel: f.format_note || `${f.height}p`,
                url: f.url,
                container: f.ext || 'mp4'
            }));

        if (formats.length === 0) {
            throw new Error('لم يتم العثور على صيغ فيديو مناسبة للتحميل.');
        }

        res.status(200).json({ title, formats });
        
    } catch (error) {
        console.error(error);
        let errorMessage = "فشل في معالجة الرابط. تأكد من أن الرابط صحيح وأن الفيديو ليس خاصًا.";
        if (error.stderr) {
            errorMessage = error.stderr;
        }
        res.status(500).json({ message: errorMessage });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

