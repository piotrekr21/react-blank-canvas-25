import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

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

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Please upload a valid video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Video file size must be less than 100MB",
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
        description: "Video uploaded successfully and pending review",
      });

      queryClient.invalidateQueries({ queryKey: ['videos'] });

      setTitle("");
      setDescription("");
      videoInput.value = "";
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={100}
          className="mb-2"
        />
        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      <div className="space-y-2">
        <Input
          type="file"
          accept="video/*"
          required
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        <p className="text-sm text-gray-500">
          Maximum file size: 100MB. Supported formats: MP4, WebM, MOV
        </p>
      </div>
      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? "Uploading..." : "Upload Video"}
      </Button>
    </form>
  );
};