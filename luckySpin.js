const axios = require('axios');
const {randomProxy, checkProxy} = require('./proxy');
const {getRandomTime, generateRandomPhone, generateRandomUserName} = require('./handlers');
const {sendTelegramMessage} = require('./telegram');
const {promises: fs} = require("fs");
const cheerio = require('cheerio');

async function readCodesFromFile(path) {
    try {
        const data = await fs.readFile(path, 'utf-8');
        return data.split('\n').map(code => code.trim()).filter(code => code);
    } catch (error) {
        console.error('Lỗi khi đọc file:', error);
        return [];
    }
}

async function checkPhoneReward(phoneList, requestData, reties = 20) {
    if (reties < 0) {
        return null
    }
    if (reties < 20) {
        await getRandomTime(1000, 2000)
    }
    try {
        const phoneNumber = `0${phoneList[Math.floor(Math.random() * phoneList.length)]}`;
        const proxy = await randomProxy();
        const response = await axios.get(`${requestData.origin}/Home/ListGiai?SearchString=${phoneNumber}`, {
            headers: {
                'Host': requestData.host,
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua-platform': '"Android"',
                'origin': requestData.origin,
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': requestData.referer,
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            },
            httpAgent: proxy,
            httpsAgent: proxy,
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const winners = [];
        $('.table-responsive.d-none.d-lg-block table tbody tr').each((index, element) => {
            const row = $(element);
            const winner = {
                stt: row.find('td').eq(0).text().trim(),
                prize: row.find('td').eq(1).text().trim(),
                name: row.find('td').eq(2).text().trim(),
                phone: row.find('td').eq(3).text().trim(),
                address: row.find('td').eq(4).text().trim(),
            };
            winners.push(winner);
        });
        if (winners.length < 5) {
            return {
                win: winners.length,
                phone: phoneNumber
            }
        }
        console.log(`${phoneNumber} quá số lần ${requestData.referer}`)
        return await checkPhoneReward(phoneList, requestData, reties - 1)
    } catch (error) {
        if (error.response) {
            const message = `Lỗi get phone thực hiện chạy lại`;
            console.log(message);
            return await checkPhoneReward(phoneList, requestData, reties - 1);
        }
        console.error("Lỗi get phone", error.response)
        return await checkPhoneReward(phoneList, requestData, reties - 1);
    }
}

async function checkGift(requestData, phone, retries = 5) {
    if (retries < 0) {
        return null;
    }
    if (retries < 5) {
        await getRandomTime(1000, 3000);
    }

    try {
        const postData = `Code=${requestData.gift}&Phone=${phone}`;
        const proxy = await randomProxy();
        const response = await axios.post(requestData.url, postData, {
            headers: {
                'Host': requestData.host,
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua-platform': '"Android"',
                'origin': requestData.origin,
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': requestData.referer,
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            },
            httpAgent: proxy,
            httpsAgent: proxy,
        });
        return response.data;
    } catch (error) {
        if (error.response && (error.status === 429) || (error.status === 520)) {
            const message = `Lỗi ${error.status} thực hiện chạy lại ${requestData}`;
            console.log(message);
            return await checkGift(requestData, retries - 1);
        }
        console.error('Error:', error.status || error.message);
    }
}

async function spinLucky(requestData, randomPhone, retries = 2) {
    if (retries < 0) {
        return null;
    }
    if (retries < 2) {
        await getRandomTime(1000, 3000)
    }
    try {
        const randomName = await generateRandomUserName();
        const nameParts = randomName.split(' ');
        const lastName = nameParts[0];
        const middleName = nameParts.slice(1, -1).join(' ');
        const firstName = nameParts[nameParts.length - 1];

        const postLucky = `Name=${lastName}+${middleName}+${firstName}&Phone=${randomPhone}&ProvinceCode=01&Code=${requestData.gift}`;
        const proxy = await randomProxy();
        const responseLucky = await axios.post(requestData.lucky, postLucky, {
            headers: {
                'Host': requestData.host,
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua-platform': '"Android"',
                'origin': requestData.origin,
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': requestData.referer,
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            },
            httpAgent: proxy,
            httpsAgent: proxy,
        });
        return responseLucky.data;
    } catch (error) {
        if (error.response) {
            const message = `Lỗi ${error.status} thực hiện vòng quay lại....`;
            console.log(message);
            return await spinLucky(requestData, randomPhone, retries - 1);
        }
        console.error('Error:', error.status || error.message);
    }

}
async function checkProxyAndRunCode() {
    const listCodes = await readCodesFromFile('./data/quatangtopkid.txt');
    const phoneList = await readCodesFromFile('./data/dataPhone.txt');
    const isProxyWorking = await checkProxy();
    if (isProxyWorking) {
        const batchSize = 10;
        for (let i = 0; i < listCodes.length; i += batchSize) {
            const batchCodes = listCodes.slice(i, i + batchSize);
            const batchPromises = batchCodes.map(async (code) => {

                let requestData;
                if (code.startsWith('TY')) {
                    requestData = {
                        url: 'https://quatangtopkid.thmilk.vn/Home/CheckCode',
                        lucky: 'https://quatangtopkid.thmilk.vn/Home/IndexAjax',
                        gift: code,
                        host: 'quatangtopkid.thmilk.vn',
                        origin: 'https://quatangtopkid.thmilk.vn',
                        referer: 'https://quatangtopkid.thmilk.vn/'
                    };
                } else if (code.startsWith('YE')) {
                    requestData = {
                        url: 'https://quatangyogurt.thmilk.vn/Home/CheckCode',
                        lucky: 'https://quatangyogurt.thmilk.vn/Home/IndexAjax',
                        gift: code,
                        host: 'quatangyogurt.thmilk.vn',
                        origin: 'https://quatangyogurt.thmilk.vn',
                        referer: 'https://quatangyogurt.thmilk.vn/'
                    };
                } else {
                    console.log(`Bỏ qua mã ${code} vì không khớp với TY hoặc YE.`);
                    return;
                }

                const responseGift = await checkGift(requestData, await generateRandomPhone());
                if (responseGift.Type !== 'error') {
                    const resultReward = await checkPhoneReward(phoneList, requestData);
                    if (resultReward !== null) {
                        const resultSpin = await spinLucky(requestData, resultReward.phone);
                        if (resultSpin) {
                            const type = resultSpin.Type;
                            console.log(`${resultReward.phone} ${resultReward.win} ${requestData.gift} ${type}`);
                            const html = resultSpin.HtmlGiai;
                            if (type !== 'notWin' && html) {
                                const regex = /<div class="win-product">([\s\S]*?)<\/div>/g;
                                const winProduct = [...(html.matchAll(regex) || [])].map(match => match[1].trim().replace(/<br\s*\/?>/gi, ' '));
                                const messageText = `${resultReward.phone} ${requestData.gift} ${winProduct}`
                                await sendTelegramMessage(messageText);
                            }
                        }
                        await getRandomTime(2000,7000);
                    }
                } else {
                    console.log(`${requestData.gift} ${responseGift.Message}`);
                }

            });

            await Promise.all(batchPromises);
        }
    } else {
        console.log(`Lỗi khi lấy check proxy`);
    }
}


checkProxyAndRunCode()