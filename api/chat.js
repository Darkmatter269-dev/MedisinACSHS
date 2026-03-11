module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
    }

    const { contents, system_instruction } = req.body;

    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'contents array missing' });
    }

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, system_instruction })
            }
        );

        const data = await geminiRes.json();

        // Gemini returned an API-level error (e.g. invalid key, quota exceeded)
        if (data.error) {
            return res.status(geminiRes.status).json({
                error: data.error.message || JSON.stringify(data.error)
            });
        }

        // Safety block or empty response
        if (!data.candidates) {
    return res.status(500).json({
        error: "Gemini returned no candidates",
        geminiResponse: data
    });
}

        return res.status(200).json({
            reply: data.candidates[0].content.parts[0].text
        });

    } catch (err) {
        return res.status(502).json({
            error: 'Failed to reach Gemini API',
            detail: err.message
        });
    }
};