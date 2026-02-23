import { useState, useRef, useEffect, useCallback } from "react";
import {
  useClientPhotosQuery,
  useUploadPhoto,
  useDeletePhoto,
  getSignedUrl,
  ClientPhoto,
  PhotoType,
  PHOTO_TYPES,
} from "@/hooks/useClientPhotos";
import { useAuth } from "@/store/crm-store";
import {
  Camera,
  Upload,
  X,
  Trash2,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TYPE_LABELS: Record<PhotoType, string> = {
  Soumission: "Soumission",
  Grenier: "Grenier",
  Other: "Autre",
};

const TYPE_COLORS: Record<PhotoType, string> = {
  Soumission: "bg-blue-500/20 text-blue-400",
  Grenier: "bg-warning/20 text-warning",
  Other: "bg-secondary text-secondary-foreground",
};

interface ClientPhotosSectionProps {
  clientPhone: string;
  clientName: string;
}

const ClientPhotosSection = ({ clientPhone, clientName }: ClientPhotosSectionProps) => {
  const { role } = useAuth();
  const { data: photos = [], isLoading } = useClientPhotosQuery(clientPhone);
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();

  const [showUpload, setShowUpload] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<ClientPhoto | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ClientPhoto | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const canUpload = role === "proprietaire" || role === "gestionnaire" || role === "representant";
  const canDelete = role === "proprietaire" || role === "gestionnaire";

  // Load thumbnails
  useEffect(() => {
    let cancelled = false;
    const loadThumbs = async () => {
      const newThumbs: Record<string, string> = {};
      for (const p of photos) {
        if (thumbnails[p.id]) continue;
        try {
          const url = await getSignedUrl(p.file_path);
          if (!cancelled) newThumbs[p.id] = url;
        } catch {
          // skip failed
        }
      }
      if (!cancelled && Object.keys(newThumbs).length > 0) {
        setThumbnails((prev) => ({ ...prev, ...newThumbs }));
      }
    };
    if (photos.length > 0) loadThumbs();
    return () => { cancelled = true; };
  }, [photos]);

  const handlePreview = async (photo: ClientPhoto) => {
    setPreviewPhoto(photo);
    setLoadingPreview(true);
    try {
      const url = thumbnails[photo.id] || (await getSignedUrl(photo.file_path));
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }
    setLoadingPreview(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deletePhoto.mutateAsync({
      id: deleteConfirm.id,
      filePath: deleteConfirm.file_path,
      clientPhone,
    });
    setDeleteConfirm(null);
    if (previewPhoto?.id === deleteConfirm.id) {
      setPreviewPhoto(null);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Camera className="h-4 w-4" /> Photos
          {photos.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({photos.length})</span>
          )}
        </h3>
        {canUpload && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUpload(true)}
            className="gap-1 h-7 text-xs"
          >
            <Upload className="h-3 w-3" /> Ajouter
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && photos.length === 0 && (
        <div className="text-center py-6">
          <ImageIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Aucune photo</p>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden bg-secondary aspect-square"
              onClick={() => handlePreview(photo)}
            >
              {thumbnails[photo.id] ? (
                <img
                  src={thumbnails[photo.id]}
                  alt={photo.file_type}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="h-5 w-5 text-white" />
              </div>
              {/* Type badge */}
              <div className="absolute bottom-1 left-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${TYPE_COLORS[photo.file_type as PhotoType] || TYPE_COLORS.Other}`}>
                  {TYPE_LABELS[photo.file_type as PhotoType] || photo.file_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        clientPhone={clientPhone}
        clientName={clientName}
        uploadPhoto={uploadPhoto}
      />

      {/* Preview Modal */}
      <Dialog open={!!previewPhoto} onOpenChange={(o) => { if (!o) { setPreviewPhoto(null); setPreviewUrl(null); } }}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border p-2 sm:p-4">
          <DialogHeader className="px-2">
            <DialogTitle className="text-sm flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-xs ${TYPE_COLORS[(previewPhoto?.file_type as PhotoType) || "Other"]}`}>
                {TYPE_LABELS[(previewPhoto?.file_type as PhotoType) || "Other"]}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {previewPhoto?.created_at && format(new Date(previewPhoto.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                {previewPhoto?.uploaded_by && ` · ${previewPhoto.uploaded_by}`}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[300px]">
            {loadingPreview ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Photo" className="max-w-full max-h-[70vh] object-contain rounded" />
            ) : (
              <p className="text-muted-foreground text-sm">Impossible de charger l'image</p>
            )}
          </div>
          {canDelete && previewPhoto && (
            <div className="flex justify-end px-2">
              <button
                onClick={() => setDeleteConfirm(previewPhoto)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Supprimer
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// --- Upload Modal ---

interface UploadModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  clientPhone: string;
  clientName: string;
  uploadPhoto: ReturnType<typeof useUploadPhoto>;
}

const UploadModal = ({ open, onOpenChange, clientPhone, clientName, uploadPhoto }: UploadModalProps) => {
  const { role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<PhotoType>("Other");
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier dépasse 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Seules les images sont acceptées");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);
    try {
      await uploadPhoto.mutateAsync({
        file: selectedFile,
        clientPhone,
        clientName,
        fileType,
        uploadedBy: role || "",
      });
      handleClose();
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'upload");
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileType("Other");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Ajouter une photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Source buttons */}
          {!selectedFile && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-6 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Camera className="h-8 w-8 text-primary" />
                <span className="text-sm text-foreground">Prendre photo</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-6 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Upload className="h-8 w-8 text-primary" />
                <span className="text-sm text-foreground">Choisir fichier</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

          {/* Preview */}
          {preview && (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-[250px] object-contain rounded-lg bg-secondary" />
              <button
                onClick={() => { setSelectedFile(null); setPreview(null); }}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Type selector */}
          {selectedFile && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Type de photo *</label>
              <div className="flex gap-2">
                {PHOTO_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFileType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      fileType === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Actions */}
          {selectedFile && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button onClick={handleUpload} disabled={uploadPhoto.isPending}>
                {uploadPhoto.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Upload...</>
                ) : (
                  "Confirmer"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientPhotosSection;
