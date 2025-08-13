import { STSClient, AssumeRoleWithSAMLCommand } from "@aws-sdk/client-sts";
import { parseSaml } from "./parseSaml";
import fs from "fs";
import os from "os";
import path from "path";

export async function assumeRole(
    saml: string,
    region: string,
    profile: string = "default"
): Promise<void> {
    const { roleArn, principalArn, durationSeconds } = parseSaml(saml);

    const client = new STSClient(region ? { region } : {});
    const command = new AssumeRoleWithSAMLCommand({
        RoleArn: roleArn,
        PrincipalArn: principalArn,
        SAMLAssertion: saml,
        DurationSeconds: durationSeconds,
    });

    const response = await client.send(command);
    const credentials = response.Credentials;
    if (!credentials) throw new Error("AWS did not return credentials.");

    const awsDir = path.join(os.homedir(), ".aws");
    const credsFile = path.join(awsDir, "credentials");

    if (!fs.existsSync(awsDir)) {
        fs.mkdirSync(awsDir, { recursive: true });
    }

    const lines = [
        `[${profile}]`,
        `aws_access_key_id = ${credentials.AccessKeyId}`,
        `aws_secret_access_key = ${credentials.SecretAccessKey}`,
        `aws_session_token = ${credentials.SessionToken}`,
        "",
    ];

    fs.writeFileSync(credsFile, lines.join("\n"), { encoding: "utf-8" });

    console.log("AWS credentials successfully written to:", credsFile);
}
