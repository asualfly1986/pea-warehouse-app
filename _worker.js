/**
 * Cloudflare Workers / Pages Handler
 * Handles Cloudflare KV Data Storage Sync API (/api/sync)
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // CORS Headers for API requests
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Cloudflare KV Sync Endpoint
        if (url.pathname === '/api/sync' || url.pathname === '/api/data') {
            if (request.method === 'GET') {
                let data = null;
                try {
                    if (env && env.WAREHOUSE_KV) {
                        data = await env.WAREHOUSE_KV.get('pea_warehouse_db', { type: 'json' });
                    }
                } catch (e) {
                    console.error('KV Get Error:', e);
                }

                return new Response(JSON.stringify(data || null), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            if (request.method === 'POST') {
                try {
                    const body = await request.json();
                    if (env && env.WAREHOUSE_KV) {
                        await env.WAREHOUSE_KV.put('pea_warehouse_db', JSON.stringify(body));
                    }
                    return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString() }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ success: false, error: err.message }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }
            }
        }

        // Static Asset Pass-through
        if (env && env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return fetch(request);
    }
};
