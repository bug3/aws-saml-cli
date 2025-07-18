import { chromium, Browser, BrowserContext } from 'playwright';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function openBrowserAndSaveSession(loginUrl: string) {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`Opening browser to: ${loginUrl}`);

    await page.goto(loginUrl);

    console.log('Please complete login, then close the browser manually.');
    console.log('Or press CTRL+C to save session and exit.');

    let hasSaved = false;

    const saveSession = async () => {
        if (hasSaved) return;

        hasSaved = true;

        const cookies = await context.cookies();
        const storage = await context.storageState();

        const sessionDir = path.join(os.homedir(), '.aws-saml-cli');
        const sessionFile = path.join(sessionDir, 'session.json');

        await fs.mkdir(sessionDir, { recursive: true });
        await fs.writeFile(sessionFile, JSON.stringify({
            url: loginUrl,
            cookies,
            storage,
            timestamp: new Date().toISOString()
        }, null, 2));

        console.log(`Session saved to ${sessionFile}`);
    };

    process.on('SIGINT', async () => {
        console.log('Interrupt received. Saving session...');

        await saveSession();
        await browser.close();

        process.exit(0);
    });

    browser.on('disconnected', async () => {
        console.log('Browser closed manually. Saving session...');

        await saveSession();
    });
}
