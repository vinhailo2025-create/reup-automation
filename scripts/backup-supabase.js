#!/usr/bin/env node
// Snapshot current Supabase site_data row → ./backups/site-data-<timestamp>.json
//
// Usage:
//   SUPA_PAT=<sbp_...>  node scripts/backup-supabase.js
//   — or —
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/backup-supabase.js
//
// The resulting file is git-ignored and stays purely local.

const fs = require('fs');
const path = require('path');
const https = require('https');

const PAT = process.env.SUPA_PAT || process.env.SUPABASE_ACCESS_TOKEN;
const ENV_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const ENV_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const PROJECT_REF = (process.env.SUPABASE_PROJECT_REF || '').trim();

function apiRequest(method, host, reqPath, headers = {}, body) {
    return new Promise((resolve, reject) => {
        const req = https.request({ hostname: host, path: reqPath, method, headers }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                let parsed = buf.toString('utf8');
                try { parsed = JSON.parse(parsed); } catch (_) { /* keep raw */ }
                resolve({ status: res.statusCode, data: parsed, raw: buf });
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function resolveConnection() {
    if (ENV_URL && ENV_KEY) {
        const host = new URL(ENV_URL).hostname;
        return { host, key: ENV_KEY };
    }
    if (!PAT) {
        throw new Error('No Supabase credentials found. Set either (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) or SUPA_PAT.');
    }

    const projects = await apiRequest('GET', 'api.supabase.com', '/v1/projects', {
        Authorization: 'Bearer ' + PAT,
    });
    if (projects.status !== 200 || !Array.isArray(projects.data)) {
        throw new Error('Failed to list Supabase projects: ' + JSON.stringify(projects.data).slice(0, 300));
    }
    const picked = PROJECT_REF
        ? projects.data.find((p) => p.ref === PROJECT_REF || p.id === PROJECT_REF)
        : projects.data.find((p) => String(p.name || '').toLowerCase().includes('reup')) || projects.data[0];
    if (!picked) throw new Error('No Supabase project matched. Set SUPABASE_PROJECT_REF.');

    const keys = await apiRequest('GET', 'api.supabase.com', `/v1/projects/${picked.ref}/api-keys`, {
        Authorization: 'Bearer ' + PAT,
    });
    const service = (keys.data || []).find((k) => String(k.name || k.type || '').toLowerCase().includes('service'));
    if (!service || !service.api_key) {
        throw new Error('Could not locate service_role key for project ' + picked.ref);
    }
    return { host: `${picked.ref}.supabase.co`, key: service.api_key, ref: picked.ref };
}

(async () => {
    try {
        const conn = await resolveConnection();
        const rows = await apiRequest(
            'GET',
            conn.host,
            '/rest/v1/site_data?id=eq.main&select=data,updated_at',
            { apikey: conn.key, Authorization: 'Bearer ' + conn.key }
        );
        if (rows.status !== 200 || !Array.isArray(rows.data) || !rows.data[0]) {
            throw new Error('site_data read failed: status ' + rows.status + ' body ' + JSON.stringify(rows.data).slice(0, 300));
        }
        const row = rows.data[0];
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outDir = path.resolve(__dirname, '..', 'backups');
        fs.mkdirSync(outDir, { recursive: true });
        const outPath = path.join(outDir, `site-data-${stamp}.json`);
        const payload = {
            savedAt: new Date().toISOString(),
            supabaseUpdatedAt: row.updated_at,
            projectRef: conn.ref || null,
            data: row.data,
        };
        fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
        console.log('Saved Supabase backup →', outPath);
        console.log('Supabase updated_at:', row.updated_at);
    } catch (err) {
        console.error('Backup failed:', err.message);
        process.exit(1);
    }
})();
