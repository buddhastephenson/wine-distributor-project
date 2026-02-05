import React from 'react';
import ReactDOM from 'react-dom/client';
import WineDistributorApp from './wine-distributor-app';

// window.storage polyfill for localStorage and Backend persistence
const API_URL = '/api/storage';

window.storage = {
    get: async (key) => {
        try {
            const response = await fetch(`${API_URL}/${key}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn(`Backend fetch failed for ${key}, falling back to localStorage`);
        }

        // Fallback to localStorage
        const value = localStorage.getItem(key);
        return value ? { value } : null;
    },
    set: async (key, value) => {
        // Try to save to backend
        try {
            const response = await fetch(`${API_URL}/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });

            if (response.ok) {
                // If backend save succeeded, we don't need to save to localStorage
                // This prevents "QuotaExceededError" when the payload is large
                return;
            } else {
                console.warn(`Backend save returned ${response.status} for ${key}`);
            }
        } catch (error) {
            console.warn(`Backend save failed for ${key}, using localStorage only`);
        }

        // Fallback: If backend failed, save to localStorage as a backup
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('LocalStorage failed (Quota Exceeded?):', e);
            alert('Warning: Local storage is full and backend is unreachable. Changes may simply not be saved.');
        }
    },
    delete: async (key) => {
        try {
            await fetch(`${API_URL}/${key}`, { method: 'DELETE' });
        } catch (error) {
            console.warn(`Backend delete failed for ${key}`);
        }
        localStorage.removeItem(key);
    }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <WineDistributorApp />
    </React.StrictMode>
);
