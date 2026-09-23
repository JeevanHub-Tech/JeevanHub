const adapters = {};

function registerAdapter(platform, adapter) {
    adapters[platform] = adapter;
}

function getAdapter(platform) {
    const adapter = adapters[platform];
    if (!adapter) throw new Error(`Unsupported shipping platform: ${platform}`);
    return adapter;
}

function getSupportedPlatforms() {
    return Object.keys(adapters);
}

module.exports = { registerAdapter, getAdapter, getSupportedPlatforms };
