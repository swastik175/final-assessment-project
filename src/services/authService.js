import axios from 'axios';
import { encryptPayload, decryptResponse } from '../utils/encryption.js';

const BASE_URL = 'https://services-encr.iserveu.online/dev/nsdlab-internal';
const LOGIN_URL = `${BASE_URL}/user-authorization/user/login`;

// Basic auth token: nsdlab-internal-client:nsdlab-internal-password
const BASIC_AUTH_TOKEN = 'bnNkbGFiLWludGVybmFsLWNsaWVudDpuc2RsYWItaW50ZXJuYWwtcGFzc3dvcmQ=';
const FIXED_KEY = 'a6T8tOCYiSzDTrcqPvCbJfy0wSQOVcfaevH0gtwCtoU=';

// Removed Global 401 Interceptor as per USER request. Refresh token flow will handle session continuity.
const api = axios.create();

/**
 * Get base64-encoded geolocation string for the Geo-Location header.
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
 * Refresh the session token.
 * @param {string} refreshTokenVal
 * @returns {Promise<Object>} Decrypted response data
 */
export async function refreshToken(refreshTokenVal) {
  const payload = {
    grant_type: 'refresh_token',
    refresh_token: refreshTokenVal
  };

  const encryptedRequest = encryptPayload(payload);
  const locationHeader = await getGeoLocation();

  // Using raw axios to avoid global interceptors that might trigger redirect before we handle the error
  const response = await axios.post(LOGIN_URL, {
    RequestData: encryptedRequest
  }, {
    headers: {
      'Authorization': `Basic ${BASIC_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      'Geo-Location': locationHeader
    }
  });

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
 * Fetch User List by Date Range and Status
 * Selective Base URL based on User Role:
 * ROLE_OPS_CHECKER -> https://apidev-sdk.iserveu.online/NSDL/user_onboarding_report/fetch-user-list
 * ROLE_OPS_MAKER   -> https://apidev.iserveu.online/NSDL/user_onboarding/fetch-user-list
 */
export async function getUserListByDateRange(token, params = {}) {
  const { startDate, endDate, status, role, username, userType } = params;
  
  // Choice of URL depends on exact userType
  const isChecker = (userType || '').toUpperCase().includes('CHECKER');
  const URL = isChecker 
    ? "https://apidev-sdk.iserveu.online/NSDL/user_onboarding_report/fetch-user-list"
    : "https://apidev.iserveu.online/NSDL/user_onboarding/fetch-user-list";

  // Payload for search
  const payload = {
    status: (status || 'ALL').trim(),
    username: username, // Logged in userName from Top Right
    startDate: startDate,
    endDate: endDate,
    role: (role || 'ALL').trim()
  };

  const encryptedPayload = encryptPayload(payload);

  const response = await api.post(
    URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        'key': FIXED_KEY,
        'pass_key': 'QC62FQKXT2DQTO43LMWH5A44UKVPQ7LK5Y6HVHRQ3XTIKLDTB6HA',
        'Authorization': token
      }
    }
  );

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

/**
 * Call the logout API
 * @param {string} token - The access token
 */
export async function logoutUser(token) {
  // Using the domain provided in the curl
  const LOGOUT_URL = 'https://services.iserveu.online/dev/nsdlab-internal/user-authorization/logout';
  try {
    // Request is a POST with empty body as per curl
    await api.post(LOGOUT_URL, {}, {
      headers: {
        'Authorization': token
      }
    });
  } catch (error) {
    console.error('Logout API failed:', error);
  }
}

/**
 * Send OTP for forgot password flow
 * @param {string} username 
 */
export async function sendForgotPasswordOtp(username) {
  const URL = `https://services-encr.iserveu.online/dev/nsdlab-internal/user-mgmt/utility/send-forgot-password-otp?userName=${username}`;
  
  const payload = {
    userName: username
  };

  const encryptedPayload = encryptPayload(payload);

  const response = await api.post(
    URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}

/**
 * Verify OTP and send temporary password
 * @param {string} username 
 * @param {string} otp 
 */
export async function verifyForgotPasswordOtp(username, otp) {
  const URL = `https://services-encr.iserveu.online/dev/nsdlab-internal/user-mgmt/utility/verify-otp-send-temporary-password`;
  
  const payload = {
    userName: username,
    otp: otp
  };

  const encryptedPayload = encryptPayload(payload);

  const response = await api.post(
    URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}

/**
 * Update User Status (Approve/Reject)
 * Base URLs change depending on the role of the user being reviewed.
 */
export async function updateCbcStatus(token, data) {
  let URL = "https://apidev-sdk.iserveu.online/NSDL/user_onboarding_report/cbc-status-update";
  
  const targetRole = (data.targetRole || '').toUpperCase();
  
  if (targetRole.includes('MAKER')) {
    URL = "https://apidev-sdk.iserveu.online/NSDL/user_onboarding_report/cbc-maker-status-update";
  } else if (targetRole.includes('AGENT') || targetRole.includes('RETAILER')) {
    URL = "https://apidev-sdk.iserveu.online/NSDL/user_onboarding_report/agent-status-update";
  } else if (targetRole.includes('ADMIN') || targetRole.includes('CBC')) {
    URL = "https://apidev-sdk.iserveu.online/NSDL/user_onboarding_report/cbc-status-update";
  }

  const payload = {
    status: data.status,
    remarks: {
      comments: data.remarks.comments,
      description: data.remarks.description
    },
    token: token,
    username: data.username
  };

  const encryptedPayload = encryptPayload(payload);

  const response = await api.post(
    URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        'Authorization': token,
        'key': 'a6T8tOCYiSzDTrcqPvCbJfy0wSQOVcfaevH0gtwCtoU=',
        'pass_key': 'QC62FQKXT2DQTO43LMWH5A44UKVPQ7LK5Y6HVHRQ3XTIKLDTB6HA',
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}

/**
 * Send OTP for change password
 * @param {string} token 
 * @param {object} passwords - { oldPassword, newPassword }
 */
export async function sendChangePasswordOtp(token, passwords) {
  const URL = 'https://services-encr.iserveu.online/dev/nsdlab-internal/user-mgmt/user/send-change-password-otp';
  
  const encryptedPayload = encryptPayload(passwords);

  const response = await api.post(
    URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        'Authorization': token,
        'key': FIXED_KEY,
        'pass_key': 'QC62FQKXT2DQTO43LMWH5A44UKVPQ7LK5Y6HVHRQ3XTIKLDTB6HA',
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}

/**
 * Update password using old password and OTP
 * @param {string} token 
 * @param {object} data - { oldPassword, newPassword, otp }
 */
export async function updatePasswordUsingOldPassword(token, data) {
  const URL = 'https://services-encr.iserveu.online/dev/nsdlab-internal/user-mgmt/user/update-password-using-old-password';
  
  const encryptedPayload = encryptPayload(data);

  const response = await api.post(
    URL,
    { RequestData: encryptedPayload },
    {
      headers: {
        'Authorization': token,
        'key': FIXED_KEY,
        'pass_key': 'QC62FQKXT2DQTO43LMWH5A44UKVPQ7LK5Y6HVHRQ3XTIKLDTB6HA',
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data && response.data.ResponseData) {
    return decryptResponse(response.data.ResponseData);
  }

  return response.data;
}