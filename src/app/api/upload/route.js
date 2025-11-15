import { NextResponse } from 'next/server';

// Server-side file validation
const validateImageFile = (file) => {
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

// Server-side ImgBB upload
const uploadToImgBB = async (file) => {
  try {
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'your-imgbb-api-key';
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to base64
    const base64 = buffer.toString('base64');
    
    // Create URL-encoded form data (as per ImgBB API docs)
    const formData = new URLSearchParams();
    formData.append('image', base64);
    formData.append('key', IMGBB_API_KEY);

    // Upload to ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ImgBB API error: ${response.status} - ${errorText}`);
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
    return {
      success: false,
      error: error.message
    };
  }
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Upload to ImgBB
    const result = await uploadToImgBB(file);

    if (result.success) {
      return NextResponse.json({
        message: 'File uploaded successfully',
        url: result.url,
        deleteUrl: result.deleteUrl,
        id: result.id
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to upload file' },
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
