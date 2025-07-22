#!/usr/bin/env node

import { Command } from 'commander';
import { openBrowserAndSaveSession } from './browser';
import { captureSaml } from './captureSaml';
import inquirer from 'inquirer';

const program = new Command();

program
    .name('aws-saml-cli')
    .description('Fetch and manage AWS SAML sessions')
    .version('1.0.2');

program
    .command('save-session')
    .description('Start a login session and save it to a default path')
    .argument('[url]', 'The SAML login URL')
    .action(async (url) => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'loginUrl',
                message: 'Enter the SAML login URL:',
                when: () => !url,
            }
        ]);

        const loginUrl = url || answers.loginUrl;

        await openBrowserAndSaveSession(loginUrl);

        console.log(`Login URL: ${loginUrl}`);
    });

program
    .command('capture')
    .description('Capture SAML response from saved session')
    .option('--region <region>', 'AWS region to use for STS call')
    .action(async (options) => {
        await captureSaml(options.region);
    });

program.parseAsync(process.argv);
