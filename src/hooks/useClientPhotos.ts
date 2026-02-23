import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PhotoType = "Soumission" | "Grenier" | "Other";

export const PHOTO_TYPES: PhotoType[] = ["Soumission", "Grenier", "Other"];

export interface ClientPhoto {
  id: string;
  client_phone: string;
  client_name: string;
  file_path: string;
  file_type: PhotoType;
  uploaded_by: string;
  created_at: string;
  signedUrl?: string;
}

const PHOTOS_KEY = (phone: string) => ["client_photos", phone];

export function useClientPhotosQuery(clientPhone: string | null) {
  return useQuery({
    queryKey: PHOTOS_KEY(clientPhone ?? ""),
    enabled: !!clientPhone,
    queryFn: async (): Promise<ClientPhoto[]> => {
      const { data, error } = await supabase
        .from("client_photos")
        .select("*")
        .eq("client_phone", clientPhone!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as ClientPhoto[];
    },
  });
}

export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("get-photo-url", {
    body: { file_path: filePath },
  });
  if (error) throw error;
  return data.signedUrl;
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      clientPhone,
      clientName,
      fileType,
      uploadedBy,
    }: {
      file: File;
      clientPhone: string;
      clientName: string;
      fileType: PhotoType;
      uploadedBy: string;
    }) => {
      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Le fichier dépasse la limite de 5MB");
      }

      // Generate unique path
      const ext = file.name.split(".").pop() || "jpg";
      const phoneClean = clientPhone.replace(/\D/g, "");
      const filePath = `${phoneClean}/${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("client-photos")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
        });
      if (uploadError) throw uploadError;

      // Save metadata
      const { error: dbError } = await supabase
        .from("client_photos")
        .insert({
          client_phone: clientPhone,
          client_name: clientName,
          file_path: filePath,
          file_type: fileType,
          uploaded_by: uploadedBy,
        } as any);
      if (dbError) throw dbError;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: PHOTOS_KEY(vars.clientPhone) });
    },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, clientPhone }: { id: string; filePath: string; clientPhone: string }) => {
      // Delete from storage
      await supabase.storage.from("client-photos").remove([filePath]);
      // Delete metadata
      const { error } = await supabase.from("client_photos").delete().eq("id", id);
      if (error) throw error;
      return clientPhone;
    },
    onSuccess: (clientPhone) => {
      qc.invalidateQueries({ queryKey: PHOTOS_KEY(clientPhone) });
    },
  });
}
