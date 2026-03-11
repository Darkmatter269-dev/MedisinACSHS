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
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set in environment variables' });
    }

    // Parse body manually if Vercel hasn't done it already
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
    }
    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Request body is empty or not JSON' });
    }

    const { contents, system_instruction } = body;
    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'contents array is missing or empty' });
    }

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system_instruction, contents })
            }
        );

        const data = await geminiRes.json();
        return res.status(geminiRes.status).json(data);
    } catch (err) {
        return res.status(502).json({ error: 'Failed to reach Gemini API', detail: err.message });
    }
};
