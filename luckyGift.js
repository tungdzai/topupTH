const axios = require('axios');
const {randomProxy, checkProxy} = require('./proxy');
const {getRandomTime, generateRandomPhone, generateRandomUserName} = require('./handlers');
const {sendTelegramMessage} = require('./telegram');
const keep_alive = require('./keep_alive.js');
const {promises: fs} = require("fs");
const XLSX = require('xlsx');
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

async function writeResultsToExcel(data) {
    const filePath = 'results.xlsx';
    let workbook;
    let worksheet;

    try {
        workbook = XLSX.readFile(filePath);
        worksheet = workbook.Sheets[workbook.SheetNames[0]];
    } catch {
        workbook = XLSX.utils.book_new();
        worksheet = XLSX.utils.aoa_to_sheet([['Phone', 'Code', 'Type', 'Prize', 'Html']]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    }

    const newRow = [data.randomPhone, data.gift, data.type, data.prize, data.html];
    XLSX.utils.sheet_add_aoa(worksheet, [newRow], {origin: -1});

    XLSX.writeFile(workbook, filePath);
}

async function randomPhoneNumber(phoneList, requestData, reties = 10) {
    if (reties < 0) {
        return 10
    }
    try {
        const randomPhone = `0${phoneList[Math.floor(Math.random() * phoneList.length)]}`;
        const response = await axios.get(`${requestData.origin}/Home/ListGiai?SearchString=${randomPhone}`, {
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
            httpAgent: await randomProxy(),
            httpsAgent: await randomProxy(),
        });
        const html = response.data;
        const $ = cheerio.load(html);
        const winners = [];
        $('table tbody tr').each((index, element) => {
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
        if (winners.length < 10) {
            return {
                win: winners.length,
                phone: randomPhone
            }
        }
        console.log(`${randomPhone} quá số lần ${requestData.referer}`)
        return await randomPhoneNumber(phoneList, requestData, reties - 1)
    } catch (error) {
        console.error("Lỗi get phone", error)
    }
}

async function checkGift(requestData, phone, retries = 2) {
    if (retries < 0) {
        return null;
    }
    if (retries < 2) {
        await getRandomTime(2000, 6000);
    }

    try {
        const postData = `Code=${requestData.gift}&Phone=${phone}`;
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
            httpAgent: await randomProxy(),
            httpsAgent: await randomProxy(),
        });
        return response.data;
    } catch (error) {
        if (error.response && (error.status === 429)) {
            const message = `Lỗi ${error.status} thực hiện chạy lại ${requestData}`;
            console.log(message);
            return await checkGift(requestData, retries - 1);
        }
        console.error('Error:', error.status || error.message);
    }
}

async function spinLucky(requestData, randomPhone) {
    const randomName = await generateRandomUserName();
    const nameParts = randomName.split(' ');
    const lastName = nameParts[0];
    const middleName = nameParts.slice(1, -1).join(' ');
    const firstName = nameParts[nameParts.length - 1];

    const postLucky = `Name=${lastName}+${middleName}+${firstName}&Phone=${randomPhone}&ProvinceCode=01&Code=${requestData.gift}`;
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
        httpAgent: await randomProxy(),
        httpsAgent: await randomProxy(),
    });
    const type = responseLucky.data.Type;
    const html = responseLucky.data.HtmlGiai;
    const messageLog = `${randomPhone} ${requestData.gift} ${html}`;
    console.log(messageLog)

    if (type !== 'notWin' && html ) {
        const regex = /<div class="win-product">([\s\S]*?)<\/div>/g;
        const winProduct = [...(html.matchAll(regex) || [])].map(match => match[1].trim().replace(/<br\s*\/?>/gi, ' '));
        const messageText = `${randomPhone} ${requestData.gift} ${winProduct}`
        await sendTelegramMessage(messageText);
    }
    await writeResultsToExcel({
        randomPhone,
        gift: requestData.gift,
        type,
        prize: responseLucky.data.Prize,
        html: html || 'N/A'
    });
}

// One to one
// async function checkProxyAndRunCode() {
//     const codes = await readCodesFromFile('data.txt');
//     const phoneList = await readCodesFromFile('dataPhone.txt');
//     const listCodes = codes
//         .filter(item => item.includes('Mã quay '))
//         .map(item => {
//             const match = item.match(/Mã quay (\w+)/);
//             return match ? match[1] : null;
//         })
//         .filter(code => code !== null);
//     console.log(listCodes.length);
//     if (listCodes.length === 0) {
//         console.error("Không có mã hợp lệ trong file.");
//         return;
//     }
//     for (const code of listCodes) {
//         const isProxyWorking = await checkProxy();
//         if (isProxyWorking) {
//             let requestData;
//             if (code.startsWith('TY')) {
//                 requestData = {
//                     url: 'https://quatangtopkid.thmilk.vn/Home/CheckCode',
//                     lucky: 'https://quatangtopkid.thmilk.vn/Home/IndexAjax',
//                     gift: code,
//                     host: 'quatangtopkid.thmilk.vn',
//                     origin: 'https://quatangtopkid.thmilk.vn',
//                     referer: 'https://quatangtopkid.thmilk.vn/'
//                 };
//             } else if (code.startsWith('YE')) {
//                 requestData = {
//                     url: 'https://quatangyogurt.thmilk.vn/Home/CheckCode',
//                     lucky: 'https://quatangyogurt.thmilk.vn/Home/IndexAjax',
//                     gift: code,
//                     host: 'quatangyogurt.thmilk.vn',
//                     origin: 'https://quatangyogurt.thmilk.vn',
//                     referer: 'https://quatangyogurt.thmilk.vn/'
//                 };
//             } else {
//                 console.log(`Skipping code ${code} as it doesn't match TY or YE.`);
//                 continue;
//             }
//             const phoneTest = await generateRandomPhone();
//             const responseGift = await checkGift(requestData, phoneTest);
//             if (responseGift.Type !== 'error') {
//                 const {win, phone} = await randomPhoneNumber(phoneList, requestData);
//                 console.log(`${requestData.gift} ${responseGift.Message}`, {win, phone});
//                 if (win < 10) {
//                     const statusGiftDone = await checkGift(requestData, phone);
//                     if (statusGiftDone.Type === 'success') {
//                         await spinLucky(requestData, phone);
//                         await getRandomTime(1000, 3000);
//                     }
//                 }
//             } else {
//                 console.log(`${requestData.gift} ${responseGift.Message} `)
//             }
//         } else {
//             console.error("Proxy không hoạt động. Dừng lại.");
//         }
//     }
//
//
// }

async function checkProxyAndRunCode() {
    const codes = await readCodesFromFile('data.txt');
    const phoneList = await readCodesFromFile('dataPhone.txt');
    const listCodes = codes
        .filter(item => item.includes('Mã quay '))
        .map(item => {
            const match = item.match(/Mã quay (\w+)/);
            return match ? match[1] : null;
        })
        .filter(code => code !== null);

    console.log(`Số lượng mã hợp lệ: ${listCodes.length}`);
    if (listCodes.length === 0) {
        console.error("Không có mã hợp lệ trong file.");
        return;
    }

    const batchSize = 5;
    for (let i = 0; i < listCodes.length; i += batchSize) {
        const batchCodes = listCodes.slice(i, i + batchSize);
        const batchPromises = batchCodes.map(async (code) => {
            const isProxyWorking = await checkProxy();
            if (isProxyWorking) {
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
                } else
                    if (code.startsWith('YE')) {
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

                const phoneTest = await generateRandomPhone();
                const responseGift = await checkGift(requestData, phoneTest);
                if (responseGift.Type !== 'error') {
                    const {win, phone} = await randomPhoneNumber(phoneList, requestData);
                    console.log(`${requestData.gift} ${responseGift.Message}`, {win, phone});
                    if (win < 10) {
                        const statusGiftDone = await checkGift(requestData, phone);
                        if (statusGiftDone.Type === 'success') {
                            await spinLucky(requestData, phone);
                            await getRandomTime(1000, 3000);
                        }
                    }
                } else {
                    console.log(`${requestData.gift} ${responseGift.Message}`);
                }
            } else {
                console.error("Proxy không hoạt động. Dừng lại.");
            }
        });

        await Promise.all(batchPromises);
    }
}


checkProxyAndRunCode()