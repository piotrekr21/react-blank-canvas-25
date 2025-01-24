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

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

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
        title: "Błąd",
        description: "Proszę wprowadzić prawidłowy adres URL filmu YouTube",
        variant: "destructive",
      });
      return;
    }

    if (!latitude || !longitude) {
      toast({
        title: "Błąd",
        description: "Proszę wybrać lokalizację na mapie",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Musisz być zalogowany, aby przesłać filmy');
      }

      const videoUrl = `https://www.youtube.com/embed/${videoId}`;
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const slug = generateSlug(title);

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
          slug,
        } as VideoInsert);

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      toast({
        title: "Sukces",
        description: "Film został przesłany pomyślnie i oczekuje na zatwierdzenie",
      });

      queryClient.invalidateQueries({ queryKey: ['videos'] });

      setTitle("");
      setDescription("");
      setYoutubeUrl("");
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać filmu. Upewnij się, że jesteś zalogowany i spróbuj ponownie.",
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
          placeholder="Tytuł"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={100}
          className="mb-2"
        />
        <Textarea
          placeholder="Opis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] mb-2"
        />
        <Input
          type="url"
          placeholder="URL filmu YouTube"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          required
          className="mb-2"
        />
        <p className="text-sm text-gray-500">
          Wprowadź prawidłowy adres URL filmu YouTube (np. https://www.youtube.com/watch?v=xxxxx)
        </p>
      </div>
      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? "Przesyłanie..." : "Prześlij Film"}
      </Button>
    </form>
  );
};