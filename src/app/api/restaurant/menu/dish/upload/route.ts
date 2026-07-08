import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    // Basic file validation
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'File must be an image.' }, { status: 400 });
    }

    // Limit file size to 5MB
    const limit = 5 * 1024 * 1024;
    if (file.size > limit) {
      return NextResponse.json({ message: 'File size must be under 5MB.' }, { status: 400 });
    }

    // Upload file directly to Vercel Blob with public read permissions
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;

    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({
      imageUrl: blob.url,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ message: 'Upload failed.', error: error.message }, { status: 500 });
  }
}
