import { useState, useCallback } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { VideoUploadForm } from "./VideoUploadForm";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const mapContainerStyle = {
  width: "100%",
  height: "70vh",
};

const center = {
  lat: 40.7128,
  lng: -74.0060,
};

type Video = Database['public']['Tables']['videos']['Row'];

export const Map = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyDHxHvxXwzGxLYYAIxFYhV8RBBRZc-9Rnk",
  });

  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLng | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isUploadMode, setIsUploadMode] = useState(false);

  const { data: videos } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'approved');
      
      if (error) throw error;
      return data as Video[];
    },
  });

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (isUploadMode && e.latLng) {
      setSelectedLocation(e.latLng);
    }
  }, [isUploadMode]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <p className="text-yellow-700">
          ⚠️ This map is for development purposes only. The API key is restricted.
        </p>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={() => setIsUploadMode(!isUploadMode)}
          variant={isUploadMode ? "destructive" : "default"}
        >
          {isUploadMode ? "Cancel Upload" : "Upload New Video"}
        </Button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        onClick={handleMapClick}
      >
        {videos?.map((video) => (
          <Marker
            key={video.id}
            position={{ lat: Number(video.latitude), lng: Number(video.longitude) }}
            onClick={() => setSelectedVideo(video)}
          />
        ))}

        {selectedVideo && (
          <InfoWindow
            position={{ lat: Number(selectedVideo.latitude), lng: Number(selectedVideo.longitude) }}
            onCloseClick={() => setSelectedVideo(null)}
          >
            <div className="p-2 max-w-sm">
              <h3 className="font-bold">{selectedVideo.title}</h3>
              <p className="text-sm">{selectedVideo.description}</p>
              <video
                controls
                className="mt-2 w-full"
                src={selectedVideo.video_url}
              />
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {selectedLocation && isUploadMode && (
        <div className="mt-4 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">Upload Video</h2>
          <VideoUploadForm
            latitude={selectedLocation.lat()}
            longitude={selectedLocation.lng()}
          />
        </div>
      )}
    </div>
  );
};