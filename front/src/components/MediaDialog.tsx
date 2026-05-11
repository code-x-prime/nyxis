import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Image as ImageIcon, 
  Video, 
  Search, 
  Upload, 
  Check, 
  Trash, 
  Loader2,
  FileText,
  AlertCircle,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/api/api";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export interface MediaItem {
  id: string;
  url: string;
  key: string;
  name: string;
  type: 'image' | 'video' | 'document';
  mimeType: string;
  size: number;
  createdAt: string;
}

interface MediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaItem[]) => void;
  allowMultiple?: boolean;
  type?: 'all' | 'image' | 'video' | 'document';
  title?: string;
}

export default function MediaDialog({ 
  open, 
  onOpenChange, 
  onSelect, 
  allowMultiple = false,
  type = 'all',
  title = "Media Library"
}: MediaDialogProps) {
  const [activeTab, setActiveTab] = useState("library");
  const [search, setSearch] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    if (open) {
      checkStorageConfig();
    }
  }, [open]);

  const checkStorageConfig = async () => {
    try {
      const res = await api.get("/api/admin/site-settings/storage");
      setIsConfigured(!!res.data?.data?.config?.activeProvider);
    } catch (error) {
      console.error("Error checking storage config:", error);
      setIsConfigured(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === "library" && isConfigured) {
      fetchMedia();
    }
  }, [open, activeTab, search, page, type, isConfigured]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/media`, {
        params: { 
          type: type === 'all' ? undefined : type, 
          search, 
          page, 
          limit: 18
        }
      });
      setMedia(res.data.data.media);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (error) {
      toast.error("Failed to fetch media");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    setUploadProgress(0);
    
    let successCount = 0;
    
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        await api.post(`/api/admin/media/upload`, formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            setUploadProgress(percentCompleted);
          }
        });
        successCount++;
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} files uploaded successfully`);
      setActiveTab("library");
      setPage(1);
      fetchMedia();
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: type === 'image' ? { 'image/*': [] } : 
            type === 'video' ? { 'video/*': [] } : 
            undefined,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const toggleSelect = (item: MediaItem) => {
    if (allowMultiple) {
      if (selectedIds.includes(item.id)) {
        setSelectedIds(selectedIds.filter(id => id !== item.id));
      } else {
        setSelectedIds([...selectedIds, item.id]);
      }
    } else {
      setSelectedIds([item.id]);
    }
  };

  const handleConfirm = () => {
    const selectedMedia = media.filter(m => selectedIds.includes(m.id));
    onSelect(selectedMedia);
    onOpenChange(false);
    setSelectedIds([]);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    
    try {
      await api.delete(`/api/admin/media/${id}`);
      toast.success("Media deleted");
      fetchMedia();
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } catch (error) {
      toast.error("Failed to delete media");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 bg-[var(--bg-primary)] border-[var(--border-color)]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>
        </DialogHeader>
        
        {!isConfigured && isConfigured !== null ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-secondary)]/50">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Configuration Required</h3>
            <p className="text-[var(--text-secondary)] max-w-sm mb-8">
              A media storage provider must be configured before you can access the library or upload new files.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button asChild onClick={() => onOpenChange(false)}>
                <Link to="/site-settings?tab=media">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Now
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <TabsList className="bg-transparent border-b-0 h-12">
              <TabsTrigger 
                value="library" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full text-[var(--text-secondary)] data-[state=active]:text-primary"
              >
                Library
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full text-[var(--text-secondary)] data-[state=active]:text-primary"
              >
                Upload New
              </TabsTrigger>
            </TabsList>
            
            {activeTab === "library" && (
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
                <Input 
                  placeholder="Search files..." 
                  className="pl-8 h-9 bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]" 
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </div>

          <TabsContent value="library" className="flex-1 overflow-y-auto p-6 mt-0">
            {loading && page === 1 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
                <p>No media files found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {media.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer group transition-all ${
                      selectedIds.includes(item.id) ? 'border-primary ring-2 ring-primary/20' : 'border-[var(--border-color)] hover:border-primary/50'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.type === 'video' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white">
                        <Video className="h-8 w-8 mb-2" />
                        <span className="text-[10px] px-1 text-center truncate w-full">{item.name}</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-secondary)]">
                        <FileText className="h-8 w-8 mb-2 text-[var(--text-secondary)]" />
                        <span className="text-[10px] px-1 text-center truncate w-full text-[var(--text-primary)]">{item.name}</span>
                      </div>
                    )}
                    
                    {selectedIds.includes(item.id) && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5 z-10">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => handleDelete(item.id, e)}
                      className="absolute bottom-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="border-[var(--border-color)]"
                   disabled={page === 1} 
                   onClick={() => setPage(p => p - 1)}
                 >
                   Previous
                 </Button>
                 <span className="flex items-center text-sm px-4 text-[var(--text-primary)]">
                   Page {page} of {totalPages}
                 </span>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="border-[var(--border-color)]"
                   disabled={page === totalPages} 
                   onClick={() => setPage(p => p + 1)}
                 >
                   Next
                 </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="flex-1 p-6 mt-0">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl h-full flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-[var(--border-color)] hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="w-full max-w-md space-y-4 text-center px-10">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Uploading Files...</p>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-[var(--text-secondary)]">{uploadProgress}% complete</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-[var(--text-primary)]">Drag & Drop files here</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Support for images, videos and documents up to 100MB
                    </p>
                  </div>
                  <Button type="button">Select Files</Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        )}
        
        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-between items-center rounded-b-lg">
          <div className="text-sm text-[var(--text-secondary)]">
            {selectedIds.length} file{selectedIds.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-[var(--border-color)] text-[var(--text-primary)]" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
