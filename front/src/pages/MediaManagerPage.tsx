import { useState, useEffect } from "react";
import MediaDialog from "@/components/MediaDialog";
import { Button } from "@/components/ui/button";
import { Plus, Images, AlertCircle, Settings } from "lucide-react";
import api from "@/api/api";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function MediaManagerPage() {
  const [open, setOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStorageConfig();
  }, []);

  const checkStorageConfig = async () => {
    try {
      const res = await api.get("/api/admin/site-settings/storage");
      setIsConfigured(!!res.data?.data?.config?.activeProvider);
    } catch (error) {
      console.error("Error checking storage config:", error);
      setIsConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Media Library</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Central repository for all your product images, videos, and marketing assets.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setOpen(true)}
            className="bg-primary hover:bg-primary/90"
            disabled={isConfigured === false}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>
      </div>

      {!loading && isConfigured === false && (
        <Card className="mb-8 border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Storage Not Configured</h3>
                <p className="text-[var(--text-secondary)] mt-1">
                  You need to configure a storage provider (AWS S3, Digital Ocean, or Cloudflare R2) before you can upload or manage media files.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button asChild variant="outline" className="border-[var(--border-color)]">
                  <Link to="/site-settings?tab=media">
                    <Settings className="w-4 h-4 mr-2" />
                    Go to Settings
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Images className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Manage Your Assets</h3>
          <p className="text-[var(--text-secondary)] max-w-md mb-8">
            The media library allows you to upload once and reuse images across multiple products, brands, and banners.
          </p>
          <Button variant="outline" onClick={() => setOpen(true)} className="border-[var(--border-color)]">
            Open Library Browser
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Organized</h4>
            <p className="text-sm text-[var(--text-secondary)]">Automatically categorizes files into images, videos, and documents.</p>
          </div>
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Searchable</h4>
            <p className="text-sm text-[var(--text-secondary)]">Find your assets instantly using the filename search.</p>
          </div>
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Reusable</h4>
            <p className="text-sm text-[var(--text-secondary)]">Select existing media directly when creating products or brands.</p>
          </div>
        </div>
      </div>

      <MediaDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={(selected) => {
          console.log("Selected in page:", selected);
          setOpen(false);
        }}
        allowMultiple
      />
    </>
  );
}
