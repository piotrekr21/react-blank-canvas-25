import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface VideoUploadFormProps {
  latitude: number;
  longitude: number;
}

type VideoInsert = Database['public']['Tables']['videos']['Insert'];

export const VideoUploadForm = ({ latitude, longitude }: VideoUploadFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const videoInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    const file = videoInput.files?.[0];

    if (!file) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dashcam_videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('dashcam_videos')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('videos')
        .insert({
          title,
          description,
          video_url: urlData.publicUrl,
          latitude,
          longitude,
          status: 'pending',
          user_id: (await supabase.auth.getUser()).data.user?.id,
        } as VideoInsert);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      setTitle("");
      setDescription("");
      videoInput.value = "";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        type="file"
        accept="video/*"
        required
      />
      <Button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Video"}
      </Button>
    </form>
  );
};