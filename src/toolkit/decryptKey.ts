import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';

export default function decryptKey(hex: string, code: string) {
  try {
    const secretKey = AES.decrypt(hex, code).toString(CryptoJS.enc.Utf8);
    return secretKey ? Buffer.from(secretKey, 'hex') : undefined;
  } catch (e) {
    return undefined;
  }
}
