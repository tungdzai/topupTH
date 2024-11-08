const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

function parseProxy(proxy) {
    const [host, port, user, password] = proxy.split(':');
    return { host, port, user, password };
}

function getRandomProxy() {
    const proxies = fs.readFileSync('proxy.txt', 'utf-8').trim().split('\n');
    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    return parseProxy(randomProxy);
}
function randomProxy(){
    const { host: proxyHost, port: proxyPort, user: proxyUser, password: proxyPassword } = getRandomProxy();
    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`;
    return new HttpsProxyAgent(proxyUrl);
}


async function checkProxy() {
    try {
        await axios.get('https://api.ipify.org?format=json', {
            httpAgent: await randomProxy(),
            httpsAgent: await randomProxy()
        });
        return true;
    } catch (error) {
        console.error('Lỗi khi kiểm tra proxy:', error.message);
        return false;
    }
}
module.exports = { randomProxy, checkProxy };
