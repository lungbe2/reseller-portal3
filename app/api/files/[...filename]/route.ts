import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/db';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Serve uploaded files with access control
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filename = params.filename.join('/');
    const filePath = path.join(UPLOADS_DIR, filename);

    // Security: Ensure the file path is within uploads directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(UPLOADS_DIR)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get document metadata from database
    // fileUrl is stored as /api/files/filename, so we search with both patterns
    const document = await prisma.document.findFirst({
      where: {
        OR: [
          { fileUrl: filename },
          { fileUrl: `/api/files/${filename}` },
          { fileName: filename },
        ],
      },
      include: {
        uploadedBy: true,
        customer: true,
      },
    });

    if (!document) {
      // Allow direct file access for payout documents (shared with reseller)
      // If document not found in DB but file exists, serve it
      console.log('Document not found in database for:', filename);
      return NextResponse.json({ error: 'Document not found in database' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Access control
    const hasAccess =
      userRole === 'ADMIN' || // Admins can access all documents
      document.uploadedById === userId || // Uploader can access their documents
      document.sharedWith.includes(userId) || // Shared users can access
      (document.customer && document.customer.resellerId === userId); // Reseller can access their customer's documents

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read file and return
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': stats.size.toString(),
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
