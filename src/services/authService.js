import axios from 'axios';
import { encryptPayload, decryptResponse } from '../utils/encryption.js';

const BASE_URL = 'https://services-encr.iserveu.online/dev/nsdlab-internal';
const LOGIN_URL = `${BASE_URL}/user-authorization/user/login`;

// Basic auth token: nsdlab-internal-client:nsdlab-internal-password
const BASIC_AUTH_TOKEN = 'bnNkbGFiLWludGVybmFsLWNsaWVudDpuc2RsYWItaW50ZXJuYWwtcGFzc3dvcmQ=';

const api = axios.create();

// Configure Axios interceptor to aggressively defend against expired/invalid tokens globally
api.interceptors.response.use(
  (response) => {
    // Trap deeply nested soft-rejection payloads (e.g., 200 OK but body says 401)
    const respData = response.data;
    if (respData && (respData.status_code === '401' || respData.status_code === 401 || (typeof respData.message === 'string' && respData.message.includes('Unauthorized')))) {
      handleUnauthorized();
      return Promise.reject(new Error("Unauthorized soft-rejection"));
    }
    if (respData && respData.error && typeof respData.error.message === 'string' && respData.error.message.includes('Token is expired')) {
      handleUnauthorized();
      return Promise.reject(new Error("Token is expired"));
    }
    return response;
  },
  (error) => {
    // Trigger security protocol if '401 Unauthorized' or '403 Forbidden' HTTP status code
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

function handleUnauthorized() {
  console.error("🔒 SECURITY BREACH / EXPIRED TOKEN: Clearing session and forcing exit.");
  sessionStorage.clear();
  localStorage.clear();
  // Clear any persistent state and force redirect to login
  window.location.replace(window.location.origin);
}

/**
 * Get base64-encoded geolocation string for the Geo-Location header.
 * @returns {Promise<string>} Base64-encoded location JSON
 */
export function getGeoLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(btoa(JSON.stringify({ error: 'Geolocation not supported' })));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        resolve(btoa(JSON.stringify(locationData)));
      },
      (error) => {
        resolve(btoa(JSON.stringify({ error: error.message })));
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

/**
 * Login to the NSDL bank portal.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} Decrypted login response
 */
export async function loginUser(username, password) {
  const payload = {
    grant_type: 'password',
    username: username,
    password: password,
  };

  const encryptedPayload = encryptPayload(payload);
  const geoLocation = await getGeoLocation();

  const response = await api.post(
    LOGIN_URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${BASIC_AUTH_TOKEN}`,
        'Geo-Location': geoLocation,
      },
    }
  );

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}

/**
 * Fetch user dashboard data.
 * @param {string} token - The access token
 * @returns {Promise<object>} Decrypted dashboard data
 */
export async function getUserDashboard(token) {
  const DASHBOARD_URL = `${BASE_URL}/user-mgmt/user/dashboard`;

  const response = await api.get(DASHBOARD_URL, {
    headers: {
      'Authorization': token,
      'key': 'a6T8tOCYiSzDTrcqPvCbJfy0wSQOVcfaevH0gtwCtoU=',
      'pass_key': 'QC62FQKXT2DQTO43LMWH5A44UKVPQ7LK5Y6HVHRQ3XTIKLDTB6HA'
    }
  });

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}

/**
 * Fetch audit trail logs.
 * @param {string} token - The access token
 * @param {object} params - Search parameters (fromDate, toDate, username)
 * @returns {Promise<object>} Decrypted audit trail data
 */
export async function getAuditTrail(token, params = {}) {
  const AUDIT_URL = `${BASE_URL}/user-authorization/user/audit-trail`;

  const encryptedPayload = encryptPayload(params);

  const response = await api.post(
    AUDIT_URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'key': 'a6T8tOCYiSzDTrcqPvCbJfy0wSQOVcfaevH0gtwCtoU=',
        'pass_key': 'QC62FQKXT2DQTO43LMWH5A44UKVPQ7LK5Y6HVHRQ3XTIKLDTB6HA'
      }
    }
  );

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}

export async function getUserListReport(token, params = {}) {
  const URL = "https://apidev-sdk.iserveu.online/NSDL/user_onboarding_report/fetch-user-details";

  const encryptedPayload = encryptPayload(params);

  const response = await api.post(
    URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
        "key": "a6T8tOCYiSzDTrcqPvCbJfy0wSQOVcfaevH0gtwCtoU=",
        "pass_key": "QC62FQKXT2DQTO43LMWH5A44UKVPQ7LK5Y6HVHRQ3XTIKLDTB6HA"
      }
    }
  );

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}