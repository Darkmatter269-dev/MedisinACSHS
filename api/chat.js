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

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
    }

    const body = req.body || {};
    const { contents, system_instruction } = body;

    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'contents array missing' });
    }

    try {
        const messages = [];
        const systemText = system_instruction?.parts?.[0]?.text;

        if (typeof systemText === 'string' && systemText.trim()) {
            messages.push({ role: 'system', content: systemText.trim() });
        }

        for (const item of contents) {
            const role = item?.role === 'model' ? 'assistant' : 'user';
            const contentText = (item?.parts || [])
                .map((part) => part?.text || '')
                .join('\n')
                .trim();

            if (contentText) {
                messages.push({ role, content: contentText });
            }
        }

        if (messages.length === 0) {
            return res.status(400).json({ error: 'No valid messages to send' });
        }

        const deepseekRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://medisinashs2.vercel.app',
                'X-Title': 'MedisinACSHS Assistant'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat:free',
                messages,
                temperature: 0.5
            })
        });

        const data = await deepseekRes.json();

        if (!deepseekRes.ok) {
            return res.status(deepseekRes.status).json({
                error: data?.error?.message || data?.message || 'OpenRouter API error'
            });
        }

        const reply = data?.choices?.[0]?.message?.content;
        if (!reply) {
            return res.status(500).json({ error: 'OpenRouter returned no reply', raw: data });
        }

        return res.status(200).json({ reply });

    } catch (err) {
        return res.status(502).json({
            error: 'Failed to reach OpenRouter API',
            detail: err.message
        });
    }
};