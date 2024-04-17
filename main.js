const arp = require("node-arp");
const http = require('http');
const https = require('https');
const config = require("./config.json");

const { phones, homeModeWebHooks } = config;

function getMAC(ip) {
    return new Promise((resolve, reject) => {
        arp.getMAC(ip, function(err, mac) {
            if (err) {
                reject(err);
            } else {
                resolve(mac);
            }
        });
    });
}

function getHttpOptions(url) {
    const parsedUrl = new URL(url);
    return {
        host: parsedUrl.host,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        search: parsedUrl.search,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    };
}

function httpGet(url) {
    const parsedUrl = new URL(url);
    const options = {
        headers: {
            'Content-Type': 'application/json'
        }
    }
    return new Promise((resolve, reject) => {
        const port = parsedUrl.port == 443 ? https : http;
        let output = '';
        const req = port.get(url, options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                output += chunk;
            });
            res.on('end', () => {
                let obj = JSON.parse(output);
                if (res.statusCode === 200) {
                    resolve(obj);
                } else {
                    reject(obj);
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.end();
    });
}

function shouldEnterHomeMode(data) {
    return data.some(({match}) => match);
}

function logMessages(data) {
    data.forEach(({name, match}) => {
        if (match) {
            console.info(`${name} is on the network.`)
        } else {
            console.info(`${name} is not on the network.`)
        }
    })
    if (shouldEnterHomeMode(data)) {
        console.info("Entering Home Mode...")
    } else {
        console.info("Leaving Home Mode...")
    }
}

async function enterHomeMode() {
    const { success } = await httpGet(homeModeWebHooks.enter);
    if (success) {
        console.info("Successfully entered Home Mode!");
    } else {
        throw new Error("Failed to enter home mode");
    }
}

async function leaveHomeMode() {
    const { success } = await httpGet(homeModeWebHooks.leave);
    if (success) {
        console.info("Successfully left Home Mode!");
    } else {
        throw new Error("Failed to leave home mode");
    }
}

async function switchHomeMode(data) {
    if (shouldEnterHomeMode(data)) {
        return enterHomeMode();
    } else {
        return leaveHomeMode();
    }
}

async function main() {
    const promises = phones.map(({ip}) => getMAC(ip));
    const actualMacs = await Promise.all(promises);
    const data = phones.reduce((agg, phone, index) => {
        const { mac: expectedMac, ...rest } = phones[index];
        const actualMac = actualMacs[index];
        const match = actualMac === expectedMac;
        return [...agg, {...rest, actualMac, match }];
    }, []);
    logMessages(data);
    switchHomeMode(data);
}

function kill(error) {
    console.error("Something went wrong!");
    console.error(error);
    process.exit(1);
}

main().catch(kill);