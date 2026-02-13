'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Building,
  FileIcon,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  customer: {
    id: string;
    companyName: string;
    contactName: string;
  } | null;
  createdAt: string;
}

interface Customer {
  id: string;
  companyName: string;
  contactName: string;
}

export default function DocumentsPage() {
  const { data: session } = useSession() || {};
  const t = useTranslations();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'OTHER',
    customerId: 'NONE',
    file: null as File | null,
  });

  useEffect(() => {
    fetchDocuments();
    fetchCustomers();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: t('error'),
        description: t('failed_to_load'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: `${t('max_file_size')}: 10MB`,
          variant: 'destructive',
        });
        return;
      }
      setUploadForm({ ...uploadForm, file, name: uploadForm.name || file.name });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('name', uploadForm.name);
      if (uploadForm.description) formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      if (uploadForm.customerId && uploadForm.customerId !== 'NONE') formData.append('customerId', uploadForm.customerId);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: t('success'),
          description: t('document_uploaded'),
        });
        setUploadDialogOpen(false);
        setUploadForm({
          name: '',
          description: '',
          category: 'OTHER',
          customerId: 'NONE',
          file: null,
        });
        fetchDocuments();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: t('error'),
        description: t('failed_to_save'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      const response = await fetch(`/api/documents/${documentToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: t('success'),
          description: t('document_deleted'),
        });
        fetchDocuments();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: t('error'),
        description: t('failed_to_delete'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/files/${doc.fileUrl}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: t('error'),
        description: t('failed_to_download'),
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      CONTRACT: 'bg-blue-100 text-blue-800',
      INVOICE: 'bg-green-100 text-green-800',
      AGREEMENT: 'bg-purple-100 text-purple-800',
      PROPOSAL: 'bg-yellow-100 text-yellow-800',
      REPORT: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.OTHER;
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.customer?.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('document_management')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('total')}: {documents.length} {t('documents')}
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              {t('upload_document')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('upload_new_document')}</DialogTitle>
              <DialogDescription>
                {t('max_file_size')}: 10MB
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">{t('file_upload')}*</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    required
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                  />
                  {uploadForm.file && (
                    <p className="text-sm text-muted-foreground">
                      {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('document_name')}*</Label>
                  <Input
                    id="name"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder={t('document_name')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('document_description')}</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder={t('document_description')}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('document_category')}</Label>
                    <Select
                      value={uploadForm.category}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONTRACT">{t('contract')}</SelectItem>
                        <SelectItem value="INVOICE">{t('invoice')}</SelectItem>
                        <SelectItem value="AGREEMENT">{t('agreement')}</SelectItem>
                        <SelectItem value="PROPOSAL">{t('proposal')}</SelectItem>
                        <SelectItem value="REPORT">{t('report')}</SelectItem>
                        <SelectItem value="OTHER">{t('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer">{t('linked_customer')}</Label>
                    <Select
                      value={uploadForm.customerId}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, customerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">{t('no_customer')}</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploading}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? t('uploading') : t('upload_document')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search_documents')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_categories')}</SelectItem>
                <SelectItem value="CONTRACT">{t('contract')}</SelectItem>
                <SelectItem value="INVOICE">{t('invoice')}</SelectItem>
                <SelectItem value="AGREEMENT">{t('agreement')}</SelectItem>
                <SelectItem value="PROPOSAL">{t('proposal')}</SelectItem>
                <SelectItem value="REPORT">{t('report')}</SelectItem>
                <SelectItem value="OTHER">{t('other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('no_documents')}</h3>
            <p className="text-muted-foreground mb-4">{t('no_documents_message')}</p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('upload_document')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <FileIcon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{doc.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {doc.description || t('no_description')}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge className={getCategoryBadgeColor(doc.category)}>
                    {t(doc.category.toLowerCase())}
                  </Badge>
                  <Badge variant="outline">{formatFileSize(doc.fileSize)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {doc.customer && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      {doc.customer.companyName}
                    </div>
                  )}
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {doc.uploadedBy.name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {t('download')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setDocumentToDelete(doc.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm_delete_document')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirm_delete_document_message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
