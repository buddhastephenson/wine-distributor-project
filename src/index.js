import React from 'react';
import ReactDOM from 'react-dom/client';
import WineDistributorApp from './wine-distributor-app';

// window.storage polyfill for localStorage
window.storage = {
    get: async (key) => {
        const value = localStorage.getItem(key);
        return value ? { value } : null;
    },
    set: async (key, value) => {
        localStorage.setItem(key, value);
    },
    delete: async (key) => {
        localStorage.removeItem(key);
    }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <WineDistributorApp />
    </React.StrictMode>
);
