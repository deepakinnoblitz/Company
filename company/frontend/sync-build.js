import fs from 'fs';
import { execSync } from 'child_process';

/**
 * This script synchronizes the Vite build output with the Frappe backend.
 * 1. Extracts the latest JS and CSS filenames from dist/index.html.
 * 2. Updates the Frappe template (crm_entry.html) with the new hashes.
 * 3. Copies the built assets to the Frappe public directory.
 */

try {
    const distIndex = fs.readFileSync('dist/index.html', 'utf-8');
    const scriptMatch = distIndex.match(/src=".*?\/assets\/(index-.*?\.js)"/);
    const cssMatch = distIndex.match(/href=".*?\/assets\/(index-.*?\.css)"/);

    if (!scriptMatch || !cssMatch) {
        console.error('❌ Could not find build assets in dist/index.html');
        process.exit(1);
    }

    const jsFile = scriptMatch[1];
    const cssFile = cssMatch[1];

    const crmEntryPath = '../www/crm_entry.html';
    if (fs.existsSync(crmEntryPath)) {
        let crmEntry = fs.readFileSync(crmEntryPath, 'utf-8');

        crmEntry = crmEntry.replace(
            /src="\/assets\/company\/crm\/assets\/index-.*?\.js"/,
            `src="/assets/company/crm/assets/${jsFile}"`
        );
        crmEntry = crmEntry.replace(
            /href="\/assets\/company\/crm\/assets\/index-.*?\.css"/,
            `href="/assets/company/crm/assets/${cssFile}"`
        );

        fs.writeFileSync(crmEntryPath, crmEntry);
        console.log(`✅ Updated ${crmEntryPath} with:\n   JS: ${jsFile}\n   CSS: ${cssFile}`);
    } else {
        console.warn(`⚠️  Warning: ${crmEntryPath} not found. Skipping template update.`);
    }

    const publicCrmDir = '../public/crm';
    console.log(`🧹 Cleaning ${publicCrmDir}...`);
    if (!fs.existsSync(publicCrmDir)) {
        fs.mkdirSync(publicCrmDir, { recursive: true });
    } else {
        execSync(`rm -rf ${publicCrmDir}/*`);
    }

    console.log(`📦 Copying dist/* to ${publicCrmDir}...`);
    execSync(`cp -r dist/* ${publicCrmDir}/`);
    console.log('🚀 Build synchronization complete.');
} catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
}
