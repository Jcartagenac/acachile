/**
 * Utilidades para manejo de JWT (JSON Web Tokens)
 * Centraliza la lógica de firma y verificación usando Web Crypto API
 */

// --- Utilidades de Codificación ---

export function base64UrlEncode(str: string): string {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function base64UrlDecode(str: string): string {
    str += '='.repeat((4 - str.length % 4) % 4);
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.slice().buffer;
}

// --- Criptografía ---

async function hmacSha256(key: string, data: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const dataArray = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    return await crypto.subtle.sign('HMAC', cryptoKey, dataArray);
}

// --- Funciones Principales JWT ---

export async function createJWT(payload: any, secret: string): Promise<string> {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const signature = await hmacSha256(secret, data);
    const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

    return `${data}.${encodedSignature}`;
}

export async function verifyToken(token: string, jwtSecret: string): Promise<any> {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(jwtSecret);
        const keyBuffer = toArrayBuffer(keyData);
        const key = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signatureBytes = base64UrlToUint8Array(encodedSignature);
        const signatureBuffer = toArrayBuffer(signatureBytes);
        const dataBytes = encoder.encode(`${encodedHeader}.${encodedPayload}`);
        const dataBuffer = toArrayBuffer(dataBytes);

        const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
        if (!isValid) {
            throw new Error('Invalid token signature');
        }

        const payloadBytes = base64UrlToUint8Array(encodedPayload);
        const payloadJson = new TextDecoder().decode(payloadBytes);
        const payload = JSON.parse(payloadJson);

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('Token expired');
        }

        return payload;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Invalid token');
    }
}
