import axios from 'axios';

// ImgBB API key from environment variables
const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY;

/**
 * Compresses an image to reduce file size
 * @param {string} base64Image - Base64 encoded image
 * @param {number} maxSizeKB - Maximum size in KB (default: 800KB)
 * @returns {Promise<string>} - Promise resolving to compressed base64 image
 */
export const compressImage = (base64Image, maxSizeKB = 800) => {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();
      img.src = base64Image;
      
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate the new dimensions while maintaining aspect ratio
        const maxDimension = 1200; // Maximum dimension for either width or height
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality
        let quality = 0.9;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until the image is under the max size
        // or until quality is too low
        while (compressed.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) {
          quality -= 0.1;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressed);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

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

    // Compress the image if it's a base64 string
    let processedImageData = imageData;
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      try {
        processedImageData = await compressImage(imageData);
      } catch (error) {
        console.warn('Image compression failed, using original image:', error);
      }
    }

    // Prepare the form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    
    // If imageData is a base64 string that starts with data:image
    if (typeof processedImageData === 'string' && processedImageData.startsWith('data:image')) {
      // Extract the base64 part (remove the data:image/xxx;base64, prefix)
      const base64Data = processedImageData.split(',')[1];
      formData.append('image', base64Data);
    } else if (processedImageData instanceof File) {
      // If it's a File object, append it directly
      formData.append('image', processedImageData);
    } else {
      throw new Error('Invalid image data format');
    }
    
    // Add the image name
    formData.append('name', imageName);

    // Set a timeout for the request (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Make the API request with timeout
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    clearTimeout(timeoutId);

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
  getStoredImage,
  compressImage
};
