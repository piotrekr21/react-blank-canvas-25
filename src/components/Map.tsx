import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow, StandaloneSearchBox } from "@react-google-maps/api";
import { VideoUploadForm } from "./VideoUploadForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "./ui/use-toast";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type Video = Database['public']['Tables']['videos']['Row'];

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
  height: "70vh",
};

const libraries: ["places"] = ["places"];

export const Map = ({ onLocationSelect, initialCenter = defaultCenter, zoom = 8 }: MapProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  const { toast } = useToast();
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('get-maps-key');
        if (functionError) throw functionError;
        setApiKey(functionData.apiKey);
      } catch (error) {
        console.error('Error fetching API key:', error);
        toast({
          title: "Error",
          description: "Could not load Google Maps. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchApiKey();
  }, [toast]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLng | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(initialCenter);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Musisz być zalogowany, aby głosować');
      }

      const { data: existingVote, error: fetchError } = await supabase
        .from('votes')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

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
            user_id: user.id,
            vote_type: voteType,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes'] });
      toast({
        title: "Sukces",
        description: "Twój głos został zapisany.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się zapisać głosu. Spróbuj ponownie.",
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

  const handleVote = async (videoId: string, voteType: boolean) => {
    try {
      await voteMutation.mutateAsync({ videoId, voteType });
    } catch (error) {
      console.error('Vote handling error:', error);
    }
  };

  useEffect(() => {
    if (isLoaded && mapRef && videos) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();

      videos.forEach(video => {
        const position = { lat: Number(video.latitude), lng: Number(video.longitude) };
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef,
          position,
          title: video.title,
        });

        marker.addListener('click', () => {
          setSelectedVideo(video);
        });

        markersRef.current.set(video.id, marker);
      });
    }
  }, [isLoaded, mapRef, videos]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded || !apiKey) return <div>Loading maps...</div>;

  return (
    <div className="space-y-4">
      <StandaloneSearchBox
        onLoad={onSearchBoxLoad}
        onPlacesChanged={handlePlacesChanged}
      >
        <Input
          type="text"
          placeholder="Search for a location..."
          className="w-full bg-white shadow-lg mb-4"
        />
      </StandaloneSearchBox>

      <div className="relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={zoom}
          center={center}
          onClick={handleMapClick}
          onLoad={onMapLoad}
        >
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
                      onClick={() => handleVote(selectedVideo.id, true)}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{getVoteCounts(selectedVideo.id).upvotes}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleVote(selectedVideo.id, false)}
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

      {selectedLocation && onLocationSelect && (
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
