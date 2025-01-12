import { useState } from "react";
import { Map } from "@/components/Map";
import { VideoUploadForm } from "@/components/VideoUploadForm";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const AddVideo = () => {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [step, setStep] = useState<'details' | 'location'>('details');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleNextStep = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title before proceeding",
        variant: "destructive",
      });
      return;
    }
    setStep('location');
  };

  const handleBack = () => {
    setStep('details');
    setSelectedLocation(null);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Add New Video</h1>
          {step === 'location' && (
            <Button variant="outline" onClick={handleBack}>
              Back to Details
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {step === 'details' ? (
            <div className="space-y-4 bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-4">Video Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter video description"
                    className="min-h-[100px]"
                  />
                </div>
                <Button onClick={handleNextStep} className="w-full">
                  Next: Choose Location
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card rounded-lg p-6 border">
                <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
                {selectedLocation ? (
                  <VideoUploadForm
                    latitude={selectedLocation.lat}
                    longitude={selectedLocation.lng}
                    initialTitle={title}
                    initialDescription={description}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    Please select a location on the map
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="h-[500px] rounded-lg overflow-hidden border">
            <Map
              onLocationSelect={(lat, lng) =>
                setSelectedLocation({ lat, lng })
              }
              initialCenter={{ lat: 52.2297, lng: 21.0122 }}
              zoom={6}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AddVideo;