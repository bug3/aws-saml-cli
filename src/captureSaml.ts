import { chromium } from 'playwright';
import * as path from 'path';
import * as os from 'os';
import { assumeRole } from './assumeRole';

const { parse } = require("uniquenv");

export async function captureSaml(region: string = 'eu-west-1') {
    const sessionFile = path.join(os.homedir(), '.aws-saml-cli', 'session.uniquenv');
    const sessionData = parse(sessionFile);

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        storageState: sessionData.storage,
    });

    const page = await context.newPage();

    const loginUrl = sessionData.url;
    if (!loginUrl) {
        console.error('No login URL found in session.');
        process.exit(1);
    }

    page.on('request', async (request) => {
        if (request.method() === 'POST' && request.url().includes('signin.aws.amazon.com/saml')) {
            const postData = request.postData();
            const params = new URLSearchParams(postData ?? '');
            const saml = params.get("SAMLResponse");

            await assumeRole(saml ?? '', region);
        }
    });

    await page.goto(loginUrl);
    await browser.close();
}
