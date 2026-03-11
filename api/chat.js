module.exports = async function handler(req, res) {
    // Allow cross-origin requests from the same Vercel deployment
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
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    const body = req.body || {};
    const { contents, system_instruction } = body;

    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'Invalid request body: contents missing' });
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
