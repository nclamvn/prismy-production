/**
 * Lambda@Edge Function: Security Headers
 * Adds comprehensive security headers to responses
 */

'use strict';

exports.handler = async (event) => {
    const response = event.Records[0].cf.response;
    const request = event.Records[0].cf.request;
    const headers = response.headers;
    
    console.log(`Adding security headers for URI: ${request.uri}`);
    
    try {
        // Get the request URI and viewer country for context
        const uri = request.uri;
        const viewerCountry = request.headers['cloudfront-viewer-country']?.[0]?.value || 'US';
        const isAPI = uri.startsWith('/api/');
        const isStatic = uri.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|pdf)$/);
        
        // Core security headers
        headers['strict-transport-security'] = [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
        }];
        
        headers['x-content-type-options'] = [{
            key: 'X-Content-Type-Options',
            value: 'nosniff'
        }];
        
        headers['x-frame-options'] = [{
            key: 'X-Frame-Options',
            value: 'DENY'
        }];
        
        headers['x-xss-protection'] = [{
            key: 'X-XSS-Protection',
            value: '1; mode=block'
        }];
        
        headers['referrer-policy'] = [{
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
        }];
        
        // Content Security Policy - different for API vs web pages
        if (isAPI) {
            headers['content-security-policy'] = [{
                key: 'Content-Security-Policy',
                value: "default-src 'none'; frame-ancestors 'none';"
            }];
        } else if (isStatic) {
            // No CSP for static assets
        } else {
            headers['content-security-policy'] = [{
                key: 'Content-Security-Policy',
                value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "font-src 'self' https://fonts.gstatic.com",
                    "img-src 'self' data: https: blob:",
                    "connect-src 'self' https: wss: ws:",
                    "media-src 'self' blob:",
                    "object-src 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                    "frame-ancestors 'none'",
                    "upgrade-insecure-requests"
                ].join('; ')
            }];
        }
        
        // Permissions Policy
        headers['permissions-policy'] = [{
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
        }];
        
        // Cross-Origin policies
        headers['cross-origin-opener-policy'] = [{
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
        }];
        
        headers['cross-origin-resource-policy'] = [{
            key: 'Cross-Origin-Resource-Policy',
            value: isStatic ? 'cross-origin' : 'same-origin'
        }];
        
        headers['cross-origin-embedder-policy'] = [{
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
        }];
        
        // Cache control based on content type
        if (isStatic) {
            headers['cache-control'] = [{
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable'
            }];
        } else if (isAPI) {
            headers['cache-control'] = [{
                key: 'Cache-Control',
                value: 'no-cache, no-store, must-revalidate'
            }];
            
            headers['pragma'] = [{
                key: 'Pragma',
                value: 'no-cache'
            }];
            
            headers['expires'] = [{
                key: 'Expires',
                value: '0'
            }];
        }
        
        // Server information removal
        delete headers['server'];
        delete headers['x-powered-by'];
        delete headers['x-aspnet-version'];
        delete headers['x-aspnetmvc-version'];
        
        // Add custom headers for tracking and debugging
        headers['x-edge-location'] = [{
            key: 'X-Edge-Location',
            value: process.env.AWS_REGION || 'unknown'
        }];
        
        headers['x-request-id'] = [{
            key: 'X-Request-ID',
            value: generateRequestId()
        }];
        
        // Geographic context
        headers['x-viewer-country'] = [{
            key: 'X-Viewer-Country',
            value: viewerCountry
        }];
        
        // Performance hints
        if (!isAPI && !isStatic) {
            headers['link'] = [{
                key: 'Link',
                value: [
                    '</static/css/main.css>; rel=preload; as=style',
                    '</static/js/main.js>; rel=preload; as=script',
                    'https://fonts.googleapis.com; rel=preconnect',
                    'https://fonts.gstatic.com; rel=preconnect; crossorigin'
                ].join(', ')
            }];
        }
        
        // Security monitoring headers
        headers['x-content-security-policy-report-only'] = [{
            key: 'Content-Security-Policy-Report-Only',
            value: "default-src 'self'; report-uri /api/security/csp-report"
        }];
        
        // Add timing information for performance monitoring
        headers['x-edge-processing-time'] = [{
            key: 'X-Edge-Processing-Time',
            value: Date.now().toString()
        }];
        
        console.log(`Security headers added successfully for ${uri}`);
        
        return response;
        
    } catch (error) {
        console.error('Error adding security headers:', error);
        // Return response even if header addition fails
        return response;
    }
};

function generateRequestId() {
    return 'edge-' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Helper function to detect mobile devices
function isMobileDevice(userAgent) {
    if (!userAgent) return false;
    
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent);
}

// Helper function to get appropriate CSP for different content types
function getCSPForContentType(contentType, uri) {
    if (!contentType) {
        contentType = 'text/html';
    }
    
    const baseCSP = {
        'default-src': "'self'",
        'object-src': "'none'",
        'base-uri': "'self'",
        'frame-ancestors': "'none'"
    };
    
    if (contentType.includes('text/html')) {
        return {
            ...baseCSP,
            'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
            'font-src': "'self' https://fonts.gstatic.com",
            'img-src': "'self' data: https: blob:",
            'connect-src': "'self' https: wss: ws:",
            'media-src': "'self' blob:",
            'form-action': "'self'",
            'upgrade-insecure-requests': ''
        };
    }
    
    if (contentType.includes('application/json')) {
        return {
            'default-src': "'none'",
            'frame-ancestors': "'none'"
        };
    }
    
    return baseCSP;
}