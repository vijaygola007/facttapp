import CryptoJS from "react-native-crypto-js";

const decrypt = (text: string, secret: string = '5kjTb83SCgs9QSOa') => {
    // let bytes  = CryptoJS.AES.decrypt(text, secret);
    // let originalDomain = bytes.toString(CryptoJS.enc.Utf8);
    var key = CryptoJS.enc.Utf8.parse(secret);
    var iv = CryptoJS.enc.Utf8.parse(secret);
    var algo = {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    };
    var bytes = CryptoJS.AES.decrypt(text, key, algo).toString(CryptoJS.enc.Utf8);
    return bytes;
}

const encrypt = (text: string, secret: string = '5kjTb83SCgs9QSOa') => {
    // let bytes  = CryptoJS.AES.encrypt(text, secret).toString();
    var key = CryptoJS.enc.Utf8.parse(secret);
    var iv = CryptoJS.enc.Utf8.parse(secret);
    var algo = {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    };
    var bytes = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), key, algo).toString();
    return bytes;
}

const checksum = (text: string, isEncrypted: boolean = false) => {
    return CryptoJS.MD5(isEncrypted ? text : encrypt(text)).toString().replace('-', '').toUpperCase()
}

export {
    decrypt,
    encrypt,
    checksum
}