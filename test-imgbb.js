// Simple script to test if the ImgBB API key is still valid
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// ImgBB API key from .env file
const IMGBB_API_KEY = 'a49ab57eac38522ff67a5f2887db0fea';

async function testImgBBApiKey() {
  try {
    // Create a simple test image (1x1 pixel transparent PNG)
    // This is a minimal valid PNG file in base64
    const minimalPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const imageBuffer = Buffer.from(minimalPngBase64, 'base64');
    
    // Create form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', imageBuffer, {
      filename: 'test.png',
      contentType: 'image/png',
    });

    console.log('Testing ImgBB API key...');
    
    // Make request to ImgBB API
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

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
