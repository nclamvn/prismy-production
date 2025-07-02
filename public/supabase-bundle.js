// Supabase Client Bundle - Downloaded and served locally to bypass CSP
// This file contains the Supabase client library v2.x UMD build
// Source: https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js

// NOTE: This is a placeholder. The actual Supabase bundle needs to be downloaded
// and placed here. For now, we'll create a simple wrapper that loads Supabase
// from a local copy.

console.log('Loading local Supabase bundle...');

// Create a script element to load Supabase from local file
// This bypasses CSP restrictions by serving from same origin
window.SUPABASE_LOADED = false;

// Export a promise that resolves when Supabase is ready
window.supabaseReady = new Promise((resolve) => {
    // Check if already loaded
    if (window.supabase && window.supabase.createClient) {
        window.SUPABASE_LOADED = true;
        resolve(window.supabase);
        return;
    }
    
    // Wait for it to load
    const checkInterval = setInterval(() => {
        if (window.supabase && window.supabase.createClient) {
            window.SUPABASE_LOADED = true;
            clearInterval(checkInterval);
            resolve(window.supabase);
        }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkInterval);
        console.error('Supabase failed to load after 5 seconds');
    }, 5000);
});