const fs = require('fs');
const path = require('path');
const { RichPresence } = require('discord.js-selfbot-v13');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RPC_FILE = path.join(DATA_DIR, 'rpc.json');

const defaultData = {
    enabled: false,
    type: 'PLAYING',
    name: 'Roxy+',
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
        const presence = new RichPresence(client);

        presence.setName(data.name || 'Roxy+');
        presence.setType(data.type.toUpperCase());

        if (data.details) presence.setDetails(data.details);
        if (data.state) presence.setState(data.state);

        if (data.type.toUpperCase() === 'STREAMING') {
            // Discord requires a valid Twitch/YouTube URL for streaming status
            // For selfbot, it might be more lenient, but good practice to provide one.
            // The original code used 'https://twitch.tv/discord', let's keep that as a default if none is provided.
            presence.setURL(data.url || 'https://twitch.tv/discord');
        }

        if (data.largeImage) {
            presence.setAssetsLargeImage(data.largeImage);
            if (data.largeText) presence.setAssetsLargeText(data.largeText);
        }
        if (data.smallImage) {
            presence.setAssetsSmallImage(data.smallImage);
            if (data.smallText) presence.setAssetsSmallText(data.smallText);
        }

        const buttons = [];
        const isValidUrl = (url) => url && (url.startsWith('http://') || url.startsWith('https://'));

        if (data.button1Text && isValidUrl(data.button1Url)) {
            buttons.push({ name: data.button1Text, url: data.button1Url });
        }
        if (data.button2Text && isValidUrl(data.button2Url)) {
            buttons.push({ name: data.button2Text, url: data.button2Url });
        }

        if (buttons.length > 0) {
            presence.setButtons(buttons);
        }

        await client.user.setActivity(presence);
        // Removed success log as per instruction

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
