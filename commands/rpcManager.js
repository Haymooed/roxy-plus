const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RPC_FILE = path.join(DATA_DIR, 'rpc.json');

const defaultData = {
    enabled: false,
    type: 'PLAYING',
    name: 'Roxy+',
    applicationId: '',
    details: '',
    state: '',
    largeImage: '',
    largeText: '',
    smallImage: '',
    smallText: '',
    button1Text: '',
    button1Url: '',
    button2Text: '',
    button2Url: ''
};

function loadData() {
    if (!fs.existsSync(RPC_FILE)) return defaultData;
    try {
        const loaded = JSON.parse(fs.readFileSync(RPC_FILE, 'utf8'));
        return { ...defaultData, ...loaded };
    } catch (e) { return defaultData; }
}

function saveData(data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(RPC_FILE, JSON.stringify(data, null, 2));
}

async function setPresence(client, data) {
    if (!client.user) return;

    if (!data.enabled) {
        client.user.setActivity(null);
        return;
    }

    try {
        // Constructing the activity object manually to match the user's working example
        // allowing buttons without an explicit external Application ID.
        const activity = {
            type: data.type.toUpperCase(),
            application_id: data.applicationId || client.user.id, // Defaults to user ID
            name: data.name || 'Roxy+',
            details: data.details || undefined,
            state: data.state || undefined,
            assets: {},
            buttons: [],
            metadata: {
                button_urls: []
            }
        };

        if (data.type.toUpperCase() === 'STREAMING') {
            activity.url = 'https://twitch.tv/discord';
        }

        if (data.largeImage) {
            activity.assets.large_image = data.largeImage;
            if (data.largeText) activity.assets.large_text = data.largeText;
        }
        if (data.smallImage) {
            activity.assets.small_image = data.smallImage;
            if (data.smallText) activity.assets.small_text = data.smallText;
        }

        if (Object.keys(activity.assets).length === 0) delete activity.assets;

        const isValidUrl = (url) => url && (url.startsWith('http://') || url.startsWith('https://'));

        if (data.button1Text && isValidUrl(data.button1Url)) {
            activity.buttons.push(data.button1Text);
            activity.metadata.button_urls.push(data.button1Url);
        }
        if (data.button2Text && isValidUrl(data.button2Url)) {
            activity.buttons.push(data.button2Text);
            activity.metadata.button_urls.push(data.button2Url);
        }

        if (activity.buttons.length === 0) {
            delete activity.buttons;
            delete activity.metadata;
        }

        // Setting presence using the raw object method
        await client.user.setPresence({
            activities: [activity]
        });

    } catch (e) {
        console.error("[RPC] Error setting presence:", e);
    }
}

module.exports = {
    loadData,
    saveData,
    setPresence,
    initialize: async (client) => {
        const data = loadData();
        await setPresence(client, data);
    }
};
