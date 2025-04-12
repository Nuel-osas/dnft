// Final test for ImgBB API key with proper image upload
const axios = require('axios');
const FormData = require('form-data');

// ImgBB API key from .env file
const IMGBB_API_KEY = 'a49ab57eac38522ff67a5f2887db0fea';

async function testImgBBApiKey() {
  try {
    // Create a simple test image (1x1 pixel transparent PNG)
    // This is a minimal valid PNG file in base64
    const minimalPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    
    console.log('Testing ImgBB API key with proper image upload...');
    
    // Create form data with URLSearchParams for simpler request
    const params = new URLSearchParams();
    params.append('key', IMGBB_API_KEY);
    params.append('image', minimalPngBase64);
    
    // Make request to ImgBB API
    const response = await axios.post('https://api.imgbb.com/1/upload', params);

    if (response.data && response.data.success === true) {
      console.log('✅ Success! The ImgBB API key is valid.');
      console.log('Image URL:', response.data.data.url);
      return true;
    } else {
      console.log('❌ API returned success: false. The key may be invalid or expired.');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing ImgBB API key:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    return false;
  }
}

// Run the test
testImgBBApiKey();
