import { useState, useCallback } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { VideoUploadForm } from "./VideoUploadForm";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const mapContainerStyle = {
  width: "100%",
  height: "70vh",
};

const center = {
  lat: 40.7128,
  lng: -74.0060,
};

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  latitude: number;
  longitude: number;
}

export const Map = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "GOOGLE_MAPS_API_KEY",
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
            position={{ lat: video.latitude, lng: video.longitude }}
            onClick={() => setSelectedVideo(video)}
          />
        ))}

        {selectedVideo && (
          <InfoWindow
            position={{ lat: selectedVideo.latitude, lng: selectedVideo.longitude }}
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