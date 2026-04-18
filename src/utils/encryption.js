import CryptoJS from 'crypto-js';

const SECRET_KEY = 'a6T8tOCYiSzDTrcqPvCbJfy0wSQOVcfaevH0gtwCtoU=';

/**
 * Encrypt a payload using AES-CBC with a random IV.
 * The IV is prepended to the ciphertext before base64 encoding.
 *
 * @param {object|string} payload - The data to encrypt
 * @returns {string} Base64-encoded (IV + ciphertext)
 */
export function encryptPayload(payload) {
  const plainText = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Decode the base64 secret key into a WordArray
  const key = CryptoJS.enc.Base64.parse(SECRET_KEY);

  // Generate a random 16-byte IV
  const iv = CryptoJS.lib.WordArray.random(16);

  // Encrypt using AES-CBC with PKCS7 padding
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Prepend IV to ciphertext and base64 encode
  const ivAndCiphertext = iv.concat(encrypted.ciphertext);
  return CryptoJS.enc.Base64.stringify(ivAndCiphertext);
}

/**
 * Decrypt a response that was encrypted with AES-CBC.
 * Expects the first 16 bytes to be the IV.
 *
 * @param {string} encryptedBase64 - Base64-encoded (IV + ciphertext)
 * @returns {object} Parsed JSON response
 */
export function decryptResponse(encryptedBase64) {
  const key = CryptoJS.enc.Base64.parse(SECRET_KEY);

  // Decode the base64 string
  const combined = CryptoJS.enc.Base64.parse(encryptedBase64);

  // Extract IV (first 4 words = 16 bytes) and ciphertext (rest)
  const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16);
  const ciphertext = CryptoJS.lib.WordArray.create(
    combined.words.slice(4),
    combined.sigBytes - 16
  );

  // Decrypt
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: ciphertext },
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  const plainText = decrypted.toString(CryptoJS.enc.Utf8);

  try {
    return JSON.parse(plainText);
  } catch {
    return plainText;
  }
}
