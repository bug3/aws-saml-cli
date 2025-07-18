import { chromium } from 'playwright';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function openBrowserAndSaveSession(loginUrl: string) {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(loginUrl);

    console.log('Complete login, then click the green ▶ Resume button (or press F8) to continue.');

    await page.pause();

    const storage = await context.storageState();

    const sessionDir = path.join(os.homedir(), '.aws-saml-cli');
    const sessionFile = path.join(sessionDir, 'session.json');

    await fs.mkdir(sessionDir, { recursive: true });
    await fs.writeFile(sessionFile, JSON.stringify({
        url: loginUrl,
        storage,
        timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`Session saved to ${sessionFile}`);

    await browser.close();
}
