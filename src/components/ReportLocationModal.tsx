import { useState } from "react";
import { Map } from "./Map";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReportLocationModalProps {
  videoId: string;
  currentLat: number;
  currentLng: number;
}

export const ReportLocationModal = ({ videoId, currentLat, currentLng }: ReportLocationModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      toast({
        title: "Error",
        description: "Please select a location on the map",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to report a location",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("location_reports").insert({
        video_id: videoId,
        user_id: user.id,
        suggested_latitude: selectedLocation.lat,
        suggested_longitude: selectedLocation.lng,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location report submitted successfully",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error submitting location report:", error);
      toast({
        title: "Error",
        description: "Failed to submit location report",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Zgłoś Nieprawidłową Lokalizację</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zgłoś Nieprawidłową Lokalizację</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Kliknij na mapie, aby wybrać prawidłową lokalizację dla tego filmu.
          </p>
          <div className="h-[300px] w-full rounded-md overflow-hidden border">
            <Map
              onLocationSelect={handleLocationSelect}
              initialCenter={{ lat: currentLat, lng: currentLng }}
              zoom={12}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit}>Wyślij Zgłoszenie</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};