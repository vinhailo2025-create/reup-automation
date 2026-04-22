#!/usr/bin/env node
// Restore a previously saved backup file back into Supabase site_data.
//
// Usage:
//   SUPA_PAT=<sbp_...>  node scripts/restore-supabase.js backups/site-data-2026-04-22T10-57.json
//
// Refuses to run if the file doesn't exist. Always takes a safety snapshot
// of the current Supabase row BEFORE overwriting, storing it next to the
// other backups as `pre-restore-<timestamp>.json`.

const fs = require('fs');
const path = require('path');
const https = require('https');

const argFile = process.argv[2];
if (!argFile) {
    console.error('Usage: node scripts/restore-supabase.js <backup-file.json>');
    process.exit(1);
}
const filePath = path.resolve(argFile);
if (!fs.existsSync(filePath)) {
    console.error('Backup file not found:', filePath);
    process.exit(1);
}

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
                try { parsed = JSON.parse(parsed); } catch (_) {}
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
        return { host: new URL(ENV_URL).hostname, key: ENV_KEY };
    }
    if (!PAT) throw new Error('No Supabase credentials. Set SUPA_PAT or (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).');

    const projects = await apiRequest('GET', 'api.supabase.com', '/v1/projects', { Authorization: 'Bearer ' + PAT });
    if (projects.status !== 200 || !Array.isArray(projects.data)) {
        throw new Error('Failed to list projects: ' + JSON.stringify(projects.data).slice(0, 300));
    }
    const picked = PROJECT_REF
        ? projects.data.find((p) => p.ref === PROJECT_REF || p.id === PROJECT_REF)
        : projects.data.find((p) => String(p.name || '').toLowerCase().includes('reup')) || projects.data[0];
    if (!picked) throw new Error('No Supabase project matched.');

    const keys = await apiRequest('GET', 'api.supabase.com', `/v1/projects/${picked.ref}/api-keys`, {
        Authorization: 'Bearer ' + PAT,
    });
    const service = (keys.data || []).find((k) => String(k.name || k.type || '').toLowerCase().includes('service'));
    if (!service || !service.api_key) throw new Error('Could not locate service_role key.');
    return { host: `${picked.ref}.supabase.co`, key: service.api_key, ref: picked.ref };
}

(async () => {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        const payload = parsed && parsed.data && parsed.data.missions ? parsed.data : parsed;
        if (!payload || !payload.missions) {
            throw new Error('File does not look like a valid site_data backup (no .missions found).');
        }
        const conn = await resolveConnection();

        // 1) Safety snapshot of whatever is currently live
        const current = await apiRequest(
            'GET', conn.host,
            '/rest/v1/site_data?id=eq.main&select=data,updated_at',
            { apikey: conn.key, Authorization: 'Bearer ' + conn.key }
        );
        if (current.status === 200 && Array.isArray(current.data) && current.data[0]) {
            const outDir = path.resolve(__dirname, '..', 'backups');
            fs.mkdirSync(outDir, { recursive: true });
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const out = path.join(outDir, `pre-restore-${stamp}.json`);
            fs.writeFileSync(out, JSON.stringify({
                savedAt: new Date().toISOString(),
                supabaseUpdatedAt: current.data[0].updated_at,
                data: current.data[0].data,
            }, null, 2), 'utf8');
            console.log('Safety snapshot saved →', out);
        } else {
            console.log('No existing site_data row — skipping safety snapshot.');
        }

        // 2) Upsert
        const body = Buffer.from(JSON.stringify({
            id: 'main',
            data: payload,
            updated_at: new Date().toISOString(),
        }), 'utf8');
        const upsert = await apiRequest('POST', conn.host, '/rest/v1/site_data', {
            apikey: conn.key,
            Authorization: 'Bearer ' + conn.key,
            'Content-Type': 'application/json',
            'Content-Length': body.length,
            Prefer: 'resolution=merge-duplicates,return=minimal',
        }, body);
        if (upsert.status >= 400) {
            throw new Error('Upsert failed: ' + upsert.status + ' ' + JSON.stringify(upsert.data).slice(0, 300));
        }
        console.log('Restore applied from', filePath);
    } catch (err) {
        console.error('Restore failed:', err.message);
        process.exit(1);
    }
})();
