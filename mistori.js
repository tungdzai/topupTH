const axios = require('axios');
const {randomProxy, checkProxy} = require('./proxy');
const {generateCardCode, generateRandomPhone, getRandomTime, generateRandomUserName} = require('./handlers');
const {promises: fs} = require("fs");
const https = require('https');
const cheerio = require("cheerio");
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function readCodesFromFile(path) {
    try {
        const data = await fs.readFile(path, 'utf-8');
        return data.split('\n').map(code => code.trim()).filter(code => code);
    } catch (error) {
        console.error('Lỗi khi đọc file:', error);
        return [];
    }
}

async function login(phone, retries = 2) {
    if (retries < 0) {
        return null
    }
    if (retries < 2) {
        await getRandomTime(1000, 5000)
    }
    try {
        const randomName = await generateRandomUserName();
        const nameParts = randomName.split(' ');
        const lastName = nameParts[0];
        const middleName = nameParts.slice(1, -1).join(' ');
        const firstName = nameParts[nameParts.length - 1];
        const data = `name=${lastName}+${middleName}+${firstName}&phone=${phone}`;
        const response = await axios.post('https://thmistoriapi.zalozns.net/backend-user/login/th', data, {
            headers: {
                'sec-ch-ua-platform': "Windows",
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Pgp-Api-Media': '1',
                'sec-ch-ua-mobile': '?0',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'host': 'thmistoriapi.zalozns.net'
            }
        });
        return response.data

    } catch (error) {
        console.error('login lỗi:', error.response ? error.response.status : error.message);
    }
}

async function checkCodeLucky(token, gift, retries = 2) {
    if (retries < 0) {
        return null;
    }
    if (retries < 2) {
        await getRandomTime(1000, 5000)
    }
    try {
        const response = await axios.get(`https://thmistoriapi.zalozns.net/campaigns/check-code-lucky/${gift}`, {
            headers: {
                'Host': 'thmistoriapi.zalozns.net',
                'sec-ch-ua-platform': 'Android',
                'authorization': token,
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'x-pgp-api-media': '1',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'x-pgp-api-campaign': 'ha_noi',
                'origin': 'https://quatangmistori.thmilk.vn',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': 'https://quatangmistori.thmilk.vn/',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            }
        });
        return response.data

    } catch (error) {
        console.error('checkCodeLucky lỗi:', error.response ? error.response.status : error.message);
    }
}
async function spin(token) {
    try {
        const data = new URLSearchParams();
        data.append('lucky_wheel_delay', 15);
        const response = await axios.post('https://thmistoriapi.zalozns.net/coupon/receive', data, {
            headers: {
                'Host': 'thmistoriapi.zalozns.net',
                'sec-ch-ua-platform': 'Android',
                'authorization': token,
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'x-pgp-api-media': '1',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-pgp-api-campaign': 'ha_noi',
                'X-Pgp-Ip-Address': '',
                'origin': 'https://quatangmistori.thmilk.vn',
                'sec-fetch-site': 'cross-site',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': 'https://quatangmistori.thmilk.vn/',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            }
        });
        return response.data
    } catch (error) {
        console.log(error);
    }
}
async function historiesReward(phone, retries = 20) {
    if (retries < 0) {
        return null;
    }
    const phoneNumber = `0${phone}`;
    try {
        const campaignType = 0;
        const page = 1;

        const response = await axios.get(`https://quatangmistori.thmilk.vn/customer`, {
            params: {
                campaign_type: campaignType,
                phone: phoneNumber,
                page: page
            },
            httpsAgent: agent
        });
        const html = response.data;
        const $ = cheerio.load(html);
        const winners = [];
        $('table tbody tr').each((index, element) => {
            const row = $(element);
            const winner = {
                stt: row.find('td').eq(0).text().trim(),
                prize: row.find('td').eq(1).text().trim(),
                name: row.find('td').eq(3).text().trim(),
                phone: row.find('td').eq(4).text().trim()
            };
            winners.push(winner);
        });
        if (winners.length < 5) {
            return phoneNumber
        }
        console.log(`${phoneNumber} đã quá số lần`);
        return null;
    } catch (error) {
        console.error('Lỗi khi gọi API:', error.message);
        return await historiesReward(phone, retries - 1)
    }
}

async function handle(phoneNumber, batchCodes) {
    const result = await login(phoneNumber);
    if (result && result.result_code === 100) {
        const token = result.token;
        for (const gift of batchCodes) {
            const response = await checkCodeLucky(token, gift);
            if (response.result_code === 100) {
                const tokenSpin = response.authorization;
                const status = await spin(tokenSpin);
                console.log(status)
            } else {
                console.log(`${gift} ${response.result_code} ${response.title}`)
            }
        }
    }
}

async function sendDataToAPI() {
    const listCodes = await readCodesFromFile('./data/quatangmistori.txt');
    const phoneList = await readCodesFromFile('./data/mistoriPhone.txt');


    const batchSize = 5;
    for (const phone of phoneList) {
        const phoneNumber = await historiesReward(phone);
        console.log(phoneNumber)
        if (phoneNumber !== null) {
            const batchCodes = listCodes.slice(0, batchSize);
            const result = await handle(phoneNumber, batchCodes);

        }
    }


    /* for (let i = 0; i < listCodes.length; i += batchSize) {
         const batchCodes = listCodes.slice(i, i + batchSize);

         const batchPromises = batchCodes.map(async (gift) => {
             // const proxy= await randomProxy();
             // const phone = await generateRandomPhone();
             const phoneNumber = await historiesReward(phoneList);
             console.log(phoneNumber)
             if (phoneNumber){
                 const result = await handle(phoneNumber, gift);
             }

             // if (result) {
             //     if (result.result_code === 100) {
             //         const phoneNumber = await histories(phoneList);
             //         if (phoneNumber !== null) {
             //             const resultLive = await handle(phoneNumber, gift);
             //             const token = resultLive.authorization;
             //             console.log(token)
             //             const status = await spin(token);
             //             console.log(status)
             //             if (status.result_code === 100) {
             //                 const message = `${phoneNumber} ${gift} ${status.title}`;
             //                 await fs.appendFile('./data/mistoris.txt', message + '\n', 'utf8')
             //                     .catch(error => console.error('Error writing to file:', error));
             //                 console.log(message);
             //             }
             //         }
             //
             //     } else {
             //         console.log(`${gift} ${result.title}`);
             //     }
             // }
         });
         await Promise.all(batchPromises);
     }*/


}

sendDataToAPI()
