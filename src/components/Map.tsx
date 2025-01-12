import { useState, useCallback, useRef } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow, StandaloneSearchBox } from "@react-google-maps/api";
import { VideoUploadForm } from "./VideoUploadForm";
import { Button } from "./ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "./ui/use-toast";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Input } from "./ui/input";

interface MapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  initialCenter?: { lat: number; lng: number };
  zoom?: number;
}

const defaultCenter = {
  lat: 52.2297,
  lng: 21.0122,
};

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const libraries: ["places"] = ["places"];

type Video = Database['public']['Tables']['videos']['Row'];

export const Map = ({ onLocationSelect, initialCenter = defaultCenter, zoom = 8 }: MapProps) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyDWE6xVw-cDOC7Ee0SLFXG-5DueJshQlAA",
    libraries,
  });

  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLng | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isUploadMode, setIsUploadMode] = useState(!!onLocationSelect);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(initialCenter);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: votes } = useQuery({
    queryKey: ['votes', selectedVideo?.id],
    enabled: !!selectedVideo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('video_id', selectedVideo?.id);
      
      if (error) throw error;
      return data;
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ videoId, voteType }: { videoId: string, voteType: boolean }) => {
      const { data: existingVote, error: fetchError } = await supabase
        .from('votes')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingVote) {
        const { error } = await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('votes')
          .insert({
            video_id: videoId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            vote_type: voteType,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes'] });
      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
      console.error('Vote error:', error);
    },
  });

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setSelectedLocation(e.latLng);
      if (onLocationSelect) {
        onLocationSelect(e.latLng.lat(), e.latLng.lng());
      }
    }
  }, [onLocationSelect]);

  const handlePlacesChanged = () => {
    if (searchBoxRef.current && mapRef) {
      const places = searchBoxRef.current.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry?.location) {
          const newLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          
          setCenter(newLocation);
          mapRef.panTo(newLocation);
          mapRef.setZoom(15);
          
          setSelectedLocation(place.geometry.location);
          if (onLocationSelect) {
            onLocationSelect(newLocation.lat, newLocation.lng);
          }
        }
      }
    }
  };

  const onMapLoad = (map: google.maps.Map) => {
    setMapRef(map);
  };

  const onSearchBoxLoad = (ref: google.maps.places.SearchBox) => {
    searchBoxRef.current = ref;
  };

  const getVoteCounts = (videoId: string) => {
    const videoVotes = votes?.filter(v => v.video_id === videoId) || [];
    const upvotes = videoVotes.filter(v => v.vote_type).length;
    const downvotes = videoVotes.filter(v => !v.vote_type).length;
    return { upvotes, downvotes };
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <div className="space-y-4">
      {!onLocationSelect && (
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => setIsUploadMode(!isUploadMode)}
            variant={isUploadMode ? "destructive" : "default"}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
          >
            {isUploadMode ? "Cancel Upload" : "Upload New Video"}
          </Button>
        </div>
      )}

      <StandaloneSearchBox
        onLoad={onSearchBoxLoad}
        onPlacesChanged={handlePlacesChanged}
      >
        <Input
          type="text"
          placeholder="Search for a location..."
          className="w-full bg-white shadow-lg mb-6 border-[#E5DEFF] focus:border-[#9b87f5] focus:ring-[#9b87f5]"
        />
      </StandaloneSearchBox>

      <div className="relative rounded-lg overflow-hidden shadow-lg">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={zoom}
          center={center}
          onClick={handleMapClick}
          onLoad={onMapLoad}
          options={{
            styles: [
              {
                featureType: "all",
                elementType: "all",
                stylers: [
                  { saturation: -100 },
                  { lightness: 0 }
                ]
              }
            ]
          }}
        >
          {videos?.map((video) => (
            <Marker
              key={video.id}
              position={{ lat: Number(video.latitude), lng: Number(video.longitude) }}
              onClick={() => setSelectedVideo(video)}
            />
          ))}

          {selectedLocation && onLocationSelect && (
            <Marker
              position={selectedLocation}
            />
          )}

          {selectedVideo && (
            <InfoWindow
              position={{ lat: Number(selectedVideo.latitude), lng: Number(selectedVideo.longitude) }}
              onCloseClick={() => setSelectedVideo(null)}
            >
              <div className="p-2 max-w-sm">
                <h3 className="font-bold">{selectedVideo.title}</h3>
                <p className="text-sm mb-2">{selectedVideo.description}</p>
                <iframe
                  src={selectedVideo.video_url}
                  className="w-full aspect-video rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => voteMutation.mutate({ videoId: selectedVideo.id, voteType: true })}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{getVoteCounts(selectedVideo.id).upvotes}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => voteMutation.mutate({ videoId: selectedVideo.id, voteType: false })}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{getVoteCounts(selectedVideo.id).downvotes}</span>
                    </Button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedVideo.created_at || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {selectedLocation && isUploadMode && !onLocationSelect && (
        <div className="mt-8 max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-[#1A1F2C]">Upload Video</h2>
          <VideoUploadForm
            latitude={selectedLocation.lat()}
            longitude={selectedLocation.lng()}
          />
        </div>
      )}
    </div>
  );
};
