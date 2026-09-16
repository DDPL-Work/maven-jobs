const axios = require('axios');

const getApiKey = () => {
  const key = process.env.TWO_FACTOR_API_KEY;
  if (!key) {
    console.warn("TWO_FACTOR_API_KEY is not defined in environment variables.");
  }
  return key;
};

/**
 * Send OTP via 2Factor API
 * @param {string} phone - phone number (e.g., 919876543210 or 9876543210)
 * @returns {Promise<string>} session_id string to be used for verification
 */
const sendOTP = async (phone) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("SMS service is not configured.");

  try {
    // 2Factor API URL for Autogen OTP
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN`;
    const response = await axios.get(url);
    
    if (response.data && response.data.Status === 'Success') {
      return response.data.Details; // This is the session_id
    }
    
    throw new Error(response.data?.Details || "Failed to send OTP");
  } catch (error) {
    console.error('Error sending OTP:', error.response?.data || error.message);
    throw new Error('Failed to send OTP');
  }
};

/**
 * Verify OTP via 2Factor API
 * @param {string} sessionId - the session_id returned by sendOTP
 * @param {string} otp - the OTP entered by user
 * @returns {Promise<boolean>} true if OTP is valid, false otherwise
 */
const verifyOTP = async (sessionId, otp) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("SMS service is not configured.");

  try {
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
    const response = await axios.get(url);
    
    return response.data && response.data.Status === 'Success';
  } catch (error) {
    console.error('Error verifying OTP:', error.response?.data || error.message);
    return false;
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};
