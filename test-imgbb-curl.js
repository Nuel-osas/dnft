// Test ImgBB API key using a simpler approach with curl-like request
const axios = require('axios');
const FormData = require('form-data');

// ImgBB API key from .env file
const IMGBB_API_KEY = 'a49ab57eac38522ff67a5f2887db0fea';

async function testImgBBApiKey() {
  try {
    console.log('Testing ImgBB API key with direct URL access...');
    
    // First, try a simple GET request to check if the API is accessible
    const response = await axios.get(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`);
    
    console.log('Response:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Error testing ImgBB API key:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

// Run the test
testImgBBApiKey();
