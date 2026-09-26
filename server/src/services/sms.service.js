const axios = require('axios');

const getApiKey = () => {
  const key = process.env.TWO_FACTOR_API_KEY;
  if (!key) {
    console.warn("TWO_FACTOR_API_KEY is not defined in environment variables.");
  }
  return key;
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.length === 10 ? `91${cleaned}` : cleaned;
};

const sendOTP = async (phone, customTemplate) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("SMS service is not configured.");

  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) throw new Error("Invalid phone number provided.");

  const template = customTemplate || process.env.TWO_FACTOR_OTP_TEMPLATE;

  try {
    const url = template
      ? `https://2factor.in/API/V1/${apiKey}/SMS/${formattedPhone}/AUTOGEN/${encodeURIComponent(template)}`
      : `https://2factor.in/API/V1/${apiKey}/SMS/${formattedPhone}/AUTOGEN`;

    const response = await axios.get(url);
    
    if (response.data && response.data.Status === 'Success') {
      return response.data.Details;
    }
    
    throw new Error(response.data?.Details || "Failed to send OTP");
  } catch (error) {
    console.error('Error sending OTP:', error.response?.data || error.message);
    throw new Error('Failed to send OTP');
  }
};

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
  formatPhoneNumber,
};
