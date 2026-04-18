const axios = require('axios');
const CryptoJS = require('crypto-js');

const SECRET_KEY = 'a6T8tOCYiSzDTrcqPvCbJfy0wSQOVcfaevH0gtwCtoU=';
const PASS_KEY = 'QC62FQKXT2DQTO43LMWH5A44UKVPQ7LK5Y6HVHRQ3XTIKLDTB6HA';
const BASE_URL = 'https://services-encr.iserveu.online/dev/nsdlab-internal';

function encryptPayload(payload) {
  const plainText = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const key = CryptoJS.enc.Base64.parse(SECRET_KEY);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const ivAndCiphertext = iv.concat(encrypted.ciphertext);
  return CryptoJS.enc.Base64.stringify(ivAndCiphertext);
}

function getGeoLocation() {
  return Buffer.from(JSON.stringify({ latitude: 20.2961, longitude: 85.8245, accuracy: 100 })).toString('base64');
}

async function testApi() {
  try {
    // 1. LOGIN
    console.log('Logging in...');
    const loginPayload = encryptPayload({ grant_type: 'password', username: 'ops_maker', password: 'TestIserveu@2026' });
    const loginRes = await axios.post(`${BASE_URL}/user-authorization/user/login`, { RequestData: loginPayload }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic bnNkbGFiLWludGVybmFsLWNsaWVudDpuc2RsYWItaW50ZXJuYWwtcGFzc3dvcmQ=`,
        'Geo-Location': getGeoLocation(),
      }
    });

    let token = '';
    // Decrypt login response manually or just regex extract for test
    console.log("Login HTTP Status:", loginRes.status);
    console.log("Login Res:", Object.keys(loginRes.data));
    
    // We need the token. Let's decrypt the login response.
    const decrKey = CryptoJS.enc.Base64.parse(SECRET_KEY);
    const combined = CryptoJS.enc.Base64.parse(loginRes.data.ResponseData);
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16);
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4), combined.sigBytes - 16);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, decrKey, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    const loginData = JSON.parse(plainText);
    token = loginData.access_token || loginData.userInfo?.token || loginData.data?.access_token || loginData.token;
    
    console.log('Token snippet:', token ? token.substring(0, 15) + '...' : 'NONE');

    // 2. AUDIT TRAIL
    const auditUrl = `${BASE_URL}/user-authorization/user/audit-trail`;
    console.log('Hitting Audit Trail:', auditUrl);
    
    const params = { fromDate: "2024-01-01", toDate: "2026-06-01", username: "" };
    const encParams = encryptPayload(params);
    
    try {
      const auditRes = await axios.post(auditUrl, { RequestData: encParams }, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'key': SECRET_KEY,
          'pass_key': PASS_KEY
        }
      });
      console.log('Audit Trail Success:', auditRes.status);
    } catch (auditErr) {
      console.log('Audit Trail Error:', auditErr.response ? auditErr.response.status : auditErr.message);
      console.log('Audit Data:', auditErr.response ? auditErr.response.data : '');
    }

  } catch (e) {
    console.error('Fatal Error:', e.response ? e.response.status : e.message);
    if(e.response && e.response.data) console.log(e.response.data);
  }
}

testApi();
