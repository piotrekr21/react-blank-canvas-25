import { Map } from "@/components/Map";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  const { data: latestVideos } = useQuery({
    queryKey: ['latest-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F7]">
      <Header />
      <main className="flex-1">
        <div className="max-w-[1440px] mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-[#1A1F2C]">Dashcam Videos Map</h1>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Map />
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6 text-[#1A1F2C]">Latest Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestVideos?.map((video) => (
                <Link 
                  key={video.id} 
                  to={`/video/${video.id}`} 
                  className="block transition-transform hover:scale-105"
                >
                  <Card className="h-full bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-[#1A1F2C]">{video.title}</CardTitle>
                      <CardDescription className="text-[#8E9196]">
                        {new Date(video.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {video.thumbnail_url && (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      )}
                      <p className="mt-4 text-sm text-[#8E9196] line-clamp-2">
                        {video.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;