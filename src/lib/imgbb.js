// ImgBB API integration for image uploads
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'your-imgbb-api-key';

export const uploadToImgBB = async (file) => {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Create form data
    const formData = new FormData();
    formData.append('image', base64);
    formData.append('key', IMGBB_API_KEY);

    // Upload to ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`ImgBB API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        url: data.data.url,
        deleteUrl: data.data.delete_url,
        id: data.data.id
      };
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('ImgBB upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || !window.FileReader) {
      reject(new Error('FileReader not available in this environment'));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:image/...;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Validate image file
export const validateImageFile = (file) => {
  const maxSize = 32 * 1024 * 1024; // 32MB (ImgBB limit)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 32MB.' };
  }

  return { valid: true };
};
