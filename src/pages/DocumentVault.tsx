import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  FolderLock, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Loader2, 
  Search,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Document {
  id: number;
  original_name: string;
  file_size: number;
  upload_date: string;
}

const DocumentVault = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error(error);
      toast.error('Could not load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Please upload PDF files only');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      toast.success('Document uploaded successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Delete failed');

      toast.success('Document deleted');
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      toast.error('Could not delete document');
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Could not download document');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.original_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderLock className="text-primary h-8 w-8" />
            Document Vault
          </h1>
          <p className="text-muted-foreground">Your private, secure space for storing PDF documents.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents..." 
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <input
              type="file"
              id="doc-upload"
              className="hidden"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button 
              asChild 
              className="cursor-pointer gradient-primary shadow-glow hover:scale-105 transition-transform"
              disabled={uploading}
            >
              <label htmlFor="doc-upload">
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </label>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Accessing your secure vault...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">{searchTerm ? 'No documents matched your search' : 'Your vault is empty'}</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Try a different search term or' : 'Upload your first PDF document to get started'}
              </p>
            </div>
            {!searchTerm && (
              <Button variant="outline" onClick={() => document.getElementById('doc-upload')?.click()}>
                Select PDF File
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-xl transition-all duration-300 border-border/50 bg-card overflow-hidden">
              <div className="h-2 w-full gradient-primary" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleDownload(doc.id, doc.original_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-sm font-bold truncate mt-4" title={doc.original_name}>
                  {doc.original_name}
                </CardTitle>
                <CardDescription className="text-xs flex flex-col gap-1">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{format(new Date(doc.upload_date), 'PPP p')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full text-xs font-semibold py-1 h-8"
                  onClick={() => handleDownload(doc.id, doc.original_name)}
                >
                  View Document
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Security Banner */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <FolderLock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold">Encrypted & Private Storage</h4>
          <p className="text-xs text-muted-foreground">
            Only you can access these files. They are NOT shared with teachers or administrators.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentVault;
