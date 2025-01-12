import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useQueryClient } from "@tanstack/react-query";

interface VideoUploadFormProps {
  latitude?: number;
  longitude?: number;
  onVideoDetailsSubmit?: (details: { title: string; description: string; youtubeUrl: string }) => void;
  showLocationPicker?: boolean;
}

type VideoInsert = Database['public']['Tables']['videos']['Insert'];

export const VideoUploadForm = ({ 
  latitude, 
  longitude, 
  onVideoDetailsSubmit,
  showLocationPicker = true
}: VideoUploadFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const videoId = getYoutubeVideoId(youtubeUrl);
    
    if (!videoId) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    if (!latitude || !longitude) {
      toast({
        title: "Error",
        description: "Please select a location on the map",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User must be logged in to submit videos');
      }

      const videoUrl = `https://www.youtube.com/embed/${videoId}`;
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      const { error: insertError } = await supabase
        .from('videos')
        .insert({
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          latitude,
          longitude,
          status: 'pending',
          source: 'youtube',
          user_id: user.id,
        } as VideoInsert);

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Video submitted successfully and pending review",
      });

      queryClient.invalidateQueries({ queryKey: ['videos'] });

      setTitle("");
      setDescription("");
      setYoutubeUrl("");
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit video. Please ensure you are logged in and try again.",
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
          className="min-h-[100px] mb-2"
        />
        <Input
          type="url"
          placeholder="YouTube Video URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          required
          className="mb-2"
        />
        <p className="text-sm text-gray-500">
          Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=xxxxx)
        </p>
      </div>
      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? "Submitting..." : "Submit Video"}
      </Button>
    </form>
  );
};