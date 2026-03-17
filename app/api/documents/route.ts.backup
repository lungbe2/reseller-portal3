import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth-options';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createNotification } from '@/lib/notifications/notification-service';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// GET /api/documents - List documents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');

    let whereClause: any = {};

    if (userRole === 'RESELLER') {
      // Resellers see documents they uploaded or that are shared with them
      whereClause = {
        OR: [
          { uploadedById: userId },
          { sharedWith: { has: userId } },
          {
            customer: {
              resellerId: userId,
            },
          },
        ],
      };
    }
    // Admins can see all documents (no additional where clause)

    // Apply filters
    if (category) {
      whereClause.category = category;
    }

    if (customerId) {
      whereClause.customerId = customerId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST /api/documents - Upload document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const category = formData.get('category') as string;
    const customerId = formData.get('customerId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate customer access for resellers
    if (customerId && userRole === 'RESELLER') {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          resellerId: userId,
        },
      });

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found or access denied' }, { status: 404 });
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);

    // Ensure uploads directory exists
    await mkdir(UPLOADS_DIR, { recursive: true });

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        name,
        description,
        category: category as any,
        fileName: file.name,
        fileUrl: uniqueFileName,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: userId,
        customerId: customerId || undefined,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
    });

    // Send notification if document is linked to a customer
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { reseller: true },
      });

      if (customer && customer.resellerId !== userId) {
        // Notify the reseller who owns the customer
        await createNotification({
          userId: customer.resellerId,
          type: 'DOCUMENT_UPLOADED',
          data: {
            documentName: name,
            documentId: document.id,
            customerName: customer.companyName,
            uploaderName: (session.user as any).name,
          },
        });
      }
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
