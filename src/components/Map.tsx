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
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This map is for development purposes only. The API key is restricted and should not be used in production.
            </p>
          </div>
        </div>
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