async function getRandomTime(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}
async function generateRandomUserName() {
    const lastNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Võ", "Đặng"];
    const middleNames = ["ViệtT", "ThịT", "VănT", "HồngT", "MinhT", "QuangT", "ThanhT", "AnhT"];
    const firstNames = ["Tùng", "Hùng", "Lan", "Anh", "Bình", "Dũng", "Sơn", "Phương"];

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    return `${getRandomElement(lastNames)} ${getRandomElement(middleNames)} ${getRandomElement(firstNames)}`;
}

async function generateRandomPhone() {
    const prefixes = ["096", "097", "098", "086", "032", "034", "035", "036"];

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateRandomDigits(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }

    return `${getRandomElement(prefixes)}${generateRandomDigits(7)}`;
}

module.exports = {
    generateRandomPhone,
    getRandomTime,
    generateRandomUserName

};
