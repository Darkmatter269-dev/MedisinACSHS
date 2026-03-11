export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { contents, system_instruction } = req.body;
    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

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
}
