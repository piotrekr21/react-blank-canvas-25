import { useState } from "react";
import { Map } from "@/components/Map";
import { VideoUploadForm } from "@/components/VideoUploadForm";
import { Header } from "@/components/Header";

const AddVideo = () => {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [videoDetails, setVideoDetails] = useState<{
    title: string;
    description: string;
    youtubeUrl: string;
  } | null>(null);

  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Add New Video</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
              {!selectedLocation ? (
                <VideoUploadForm
                  onVideoDetailsSubmit={(details) => setVideoDetails(details)}
                  showLocationPicker={!videoDetails}
                />
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium">Video Details:</h3>
                  <p><span className="font-semibold">Title:</span> {videoDetails?.title}</p>
                  <p><span className="font-semibold">Description:</span> {videoDetails?.description}</p>
                  <p><span className="font-semibold">Location:</span> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                </div>
              )}
            </div>
          </div>
          {videoDetails && (
            <div className="h-[500px] rounded-lg overflow-hidden border">
              <Map
                onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
                initialCenter={{ lat: 52.2297, lng: 21.0122 }}
                zoom={6}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AddVideo;