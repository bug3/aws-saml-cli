import { XMLParser } from "fast-xml-parser";

export function parseSaml(base64Saml: string): {
    roleArn: string;
    principalArn: string;
    durationSeconds: number;
} {
    const decoded = Buffer.from(base64Saml, "base64").toString("utf-8");

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
    });

    const parsed = parser.parse(decoded);
    const assertion = getFirst(parsed, "Assertion");
    const attributes = getAttributes(assertion);
    const roleAttr = findAttribute(attributes, "https://aws.amazon.com/SAML/Attributes/Role");

    if (!roleAttr) throw new Error("SAML Role attribute not found.");

    const rawValue = extractTextValue(roleAttr);
    if (!rawValue || !rawValue.includes(",")) {
        throw new Error("Invalid Role attribute format.");
    }

    const [roleArn, principalArn] = rawValue.split(",").map((s) => s.trim());

    const expireTime = extractExpiration(assertion);
    const durationSeconds = calculateDuration(expireTime);

    return { roleArn, principalArn, durationSeconds };
}

function getFirst(obj: any, key: string): any {
    return findKey(obj, key) ?? throwErr(`Missing required key: ${key}`);
}

function getAttributes(assertion: any): any[] {
    const attrStatement = findKey(assertion, "AttributeStatement");
    const raw = findKey(attrStatement, "Attribute");
    return toArray(raw);
}

function findAttribute(attributes: any[], name: string): any | null {
    return attributes.find((a) => a.Name === name) || null;
}

function extractTextValue(attr: any): string | null {
    const valKey = Object.keys(attr).find((k) => k.endsWith("AttributeValue"));
    const val = valKey ? attr[valKey] : null;
    const first = toArray(val)[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first["#text"] || null;
    return null;
}

function extractExpiration(assertion: any): number {
    const conditions = findKey(assertion, "Conditions");
    const raw = conditions?.NotOnOrAfter;
    if (!raw) throw new Error("NotOnOrAfter attribute missing.");
    return new Date(raw).getTime();
}

function calculateDuration(expireTime: number): number {
    const now = Date.now();
    const seconds = Math.floor((expireTime - now) / 1000);
    return Math.min(Math.max(seconds, 900), 43200);
}

function findKey(obj: any, key: string): any {
    if (typeof obj !== "object" || obj === null) return null;
    for (const k in obj) {
        const base = k.split(":").pop();
        if (base === key) return obj[k];
        const found = findKey(obj[k], key);
        if (found) return found;
    }
    return null;
}

function toArray<T>(val: T | T[]): T[] {
    return Array.isArray(val) ? val : [val];
}

function throwErr(msg: string): never {
    throw new Error(msg);
}
