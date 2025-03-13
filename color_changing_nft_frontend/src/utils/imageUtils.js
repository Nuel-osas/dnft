import axios from 'axios';

// ImgBB API key from environment variables
const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY;

/**
 * Uploads an image to ImgBB and returns the URL
 * @param {File|string} imageData - The image file or base64 string to upload
 * @param {string} imageName - Optional name for the image
 * @returns {Promise<string>} - Promise resolving to the image URL
 */
export const uploadImageToImgBB = async (imageData, imageName = 'dnft_image') => {
  try {
    // Check if we have an API key
    if (!IMGBB_API_KEY) {
      console.error('ImgBB API key not found. Please add it to your .env file.');
      throw new Error('ImgBB API key not configured');
    }

    // Prepare the form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    
    // If imageData is a base64 string that starts with data:image
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      // Extract the base64 part (remove the data:image/xxx;base64, prefix)
      const base64Data = imageData.split(',')[1];
      formData.append('image', base64Data);
    } else if (imageData instanceof File) {
      // If it's a File object, append it directly
      formData.append('image', imageData);
    } else {
      throw new Error('Invalid image data format');
    }
    
    // Add the image name
    formData.append('name', imageName);

    // Make the API request
    const response = await axios.post('https://api.imgbb.com/1/upload', formData);

    // Check if the upload was successful
    if (response.data && response.data.success) {
      // Return the direct image URL
      return response.data.data.url;
    } else {
      throw new Error('Image upload failed');
    }
  } catch (error) {
    console.error('Error uploading image to ImgBB:', error);
    throw error;
  }
};

/**
 * Fallback to localStorage if ImgBB upload fails
 * @param {string} base64Image - Base64 encoded image data
 * @param {string} imageName - Name for the image
 * @returns {string} - Local storage URL or original base64 string
 */
export const storeImageLocally = (base64Image, imageName) => {
  try {
    // Generate a unique key for the image
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const key = `dnft_image_${timestamp}_${randomStr}`;
    
    // Store the image in localStorage
    localStorage.setItem(key, base64Image);
    
    // Return a pseudo-URL that can be used to retrieve the image
    return `local://${key}`;
  } catch (error) {
    console.error('Error storing image locally:', error);
    // Return the original base64 string if storage fails
    return base64Image;
  }
};

/**
 * Retrieves an image from localStorage if it's a local URL
 * @param {string} url - Image URL or local storage reference
 * @returns {string} - The image data or original URL
 */
export const getStoredImage = (url) => {
  if (url && url.startsWith('local://')) {
    const key = url.replace('local://', '');
    const storedImage = localStorage.getItem(key);
    return storedImage || url;
  }
  return url;
};

export default {
  uploadImageToImgBB,
  storeImageLocally,
  getStoredImage
};
