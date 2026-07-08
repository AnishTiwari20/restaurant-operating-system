import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique name
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;

    // Write file to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      imageUrl: `/uploads/${filename}`,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ message: 'Upload failed.', error: error.message }, { status: 500 });
  }
}
