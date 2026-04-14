/**
 * F.R.I.D.A.Y. Automation — Browser-based System Actions
 * Replaces the Python automation module for the online version.
 * Opens websites in new tabs, gets browser-available system info, etc.
 */

const Automation = {

    /** Map of app names to URLs for "open app" commands */
    APP_URLS: {
        'chrome': 'https://www.google.com',
        'google chrome': 'https://www.google.com',
        'browser': 'https://www.google.com',
        'google': 'https://www.google.com',
        'youtube': 'https://www.youtube.com',
        'gmail': 'https://mail.google.com',
        'github': 'https://github.com',
        'twitter': 'https://twitter.com',
        'x': 'https://x.com',
        'reddit': 'https://www.reddit.com',
        'spotify': 'https://open.spotify.com',
        'discord': 'https://discord.com/app',
        'chatgpt': 'https://chat.openai.com',
        'linkedin': 'https://www.linkedin.com',
        'instagram': 'https://www.instagram.com',
        'facebook': 'https://www.facebook.com',
        'whatsapp': 'https://web.whatsapp.com',
        'maps': 'https://maps.google.com',
        'drive': 'https://drive.google.com',
        'docs': 'https://docs.google.com',
        'sheets': 'https://sheets.google.com',
        'slides': 'https://slides.google.com',
        'calendar': 'https://calendar.google.com',
        'translate': 'https://translate.google.com',
        'news': 'https://news.google.com',
        'weather': 'https://weather.com',
        'amazon': 'https://www.amazon.com',
        'netflix': 'https://www.netflix.com',
        'twitch': 'https://www.twitch.tv',
        'stackoverflow': 'https://stackoverflow.com',
    },

    /**
     * Search the web via Google.
     */
    searchWeb(query) {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(url, '_blank');
        return `Searching Google for: ${query}`;
    },

    /**
     * Open a website in a new tab.
     */
    openWebsite(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        window.open(url, '_blank');
        return `Opening ${url}`;
    },

    /**
     * Get the current time.
     */
    getTime() {
        const now = new Date();
        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
        const time = now.toLocaleTimeString('en-US', options);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = now.toLocaleDateString('en-US', dateOptions);
        return `It's ${time} on ${date}.`;
    },

    /**
     * Get available system info from browser APIs.
     */
    async getSystemStatus() {
        const status = {
            platform: navigator.platform || 'Unknown',
            userAgent: navigator.userAgent,
            language: navigator.language,
            online: navigator.onLine,
            cores: navigator.hardwareConcurrency || 'Unknown',
        };

        // Device memory (Chrome only)
        if (navigator.deviceMemory) {
            status.memory_gb = navigator.deviceMemory;
        }

        // Battery API
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                status.battery_percent = Math.round(battery.level * 100);
                status.battery_charging = battery.charging;
            }
        } catch (e) {
            // Battery API not available
        }

        // Storage estimate
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                status.storage_quota_gb = (estimate.quota / (1024 ** 3)).toFixed(1);
                status.storage_used_gb = (estimate.usage / (1024 ** 3)).toFixed(2);
                status.storage_percent = ((estimate.usage / estimate.quota) * 100).toFixed(1);
            }
        } catch (e) {
            // Storage API not available
        }

        // Connection info
        if (navigator.connection) {
            status.connection_type = navigator.connection.effectiveType;
            status.downlink_mbps = navigator.connection.downlink;
        }

        return status;
    },

    /**
     * Execute an action by name.
     */
    async executeAction(actionName, params) {
        switch (actionName) {
            case 'search_web':
                return this.searchWeb(params.query || '');
            case 'open_website':
                return this.openWebsite(params.url || 'https://www.google.com');
            case 'open_app': {
                const appName = (params.app_name || '').toLowerCase().trim();
                const url = this.APP_URLS[appName];
                if (url) {
                    window.open(url, '_blank');
                    return `Opening ${appName} in a new tab.`;
                } else {
                    // Try to search for it
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(appName)}`, '_blank');
                    return `Couldn't find a direct link for "${appName}", searching instead.`;
                }
            }
            case 'get_time':
                return this.getTime();
            case 'system_status':
                return JSON.stringify(await this.getSystemStatus(), null, 2);
            case 'screenshot':
                return 'Screenshots are only available in the local version of F.R.I.D.A.Y.';
            default:
                return `Unknown action: ${actionName}`;
        }
    }
};
