/**
 * Lambda@Edge Function: Authentication and Authorization
 * Handles JWT validation and route protection at the edge
 */

'use strict';

const crypto = require('crypto');

// Configuration
const CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
    PROTECTED_PATHS: ['/dashboard', '/admin', '/api/protected'],
    BYPASS_PATHS: ['/auth', '/api/health', '/api/public'],
    COOKIE_NAME: 'session',
    MAX_AGE: 3600 * 24 * 7, // 7 days
};

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    const uri = request.uri;
    
    console.log(`Processing request for URI: ${uri}`);
    
    try {
        // Skip authentication for bypass paths
        if (shouldBypassAuth(uri)) {
            console.log(`Bypassing auth for URI: ${uri}`);
            return request;
        }
        
        // Check if path requires authentication
        if (!requiresAuth(uri)) {
            return request;
        }
        
        // Extract token from cookie or Authorization header
        const token = extractToken(headers);
        
        if (!token) {
            return createUnauthorizedResponse();
        }
        
        // Validate JWT token
        const payload = validateJWT(token);
        
        if (!payload) {
            return createUnauthorizedResponse();
        }
        
        // Add user context to request headers
        request.headers['x-user-id'] = [{ key: 'X-User-ID', value: payload.sub }];
        request.headers['x-user-role'] = [{ key: 'X-User-Role', value: payload.role || 'user' }];
        request.headers['x-user-email'] = [{ key: 'X-User-Email', value: payload.email || '' }];
        
        // Check admin access for admin routes
        if (uri.startsWith('/admin') && payload.role !== 'admin') {
            return createForbiddenResponse();
        }
        
        console.log(`Authentication successful for user: ${payload.sub}`);
        return request;
        
    } catch (error) {
        console.error('Authentication error:', error);
        return createUnauthorizedResponse();
    }
};

function shouldBypassAuth(uri) {
    return CONFIG.BYPASS_PATHS.some(path => uri.startsWith(path)) ||
           uri.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

function requiresAuth(uri) {
    return CONFIG.PROTECTED_PATHS.some(path => uri.startsWith(path));
}

function extractToken(headers) {
    // Try Authorization header first
    const authHeader = headers.authorization?.[0]?.value;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    // Try session cookie
    const cookieHeader = headers.cookie?.[0]?.value;
    if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        return cookies[CONFIG.COOKIE_NAME];
    }
    
    return null;
}

function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = decodeURIComponent(value);
        }
    });
    return cookies;
}

function validateJWT(token) {
    try {
        // Simple JWT validation for edge function
        // In production, you might want to use a more robust solution
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        
        const [header, payload, signature] = parts;
        
        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', CONFIG.JWT_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');
        
        if (signature !== expectedSignature) {
            return null;
        }
        
        // Decode payload
        const decodedPayload = JSON.parse(
            Buffer.from(payload, 'base64url').toString()
        );
        
        // Check expiration
        if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
            return null;
        }
        
        return decodedPayload;
        
    } catch (error) {
        console.error('JWT validation error:', error);
        return null;
    }
}

function createUnauthorizedResponse() {
    return {
        status: '401',
        statusDescription: 'Unauthorized',
        headers: {
            'content-type': [{ key: 'Content-Type', value: 'application/json' }],
            'cache-control': [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
        },
        body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required'
        })
    };
}

function createForbiddenResponse() {
    return {
        status: '403',
        statusDescription: 'Forbidden',
        headers: {
            'content-type': [{ key: 'Content-Type', value: 'application/json' }],
            'cache-control': [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
        },
        body: JSON.stringify({
            error: 'Forbidden',
            message: 'Insufficient permissions'
        })
    };
}