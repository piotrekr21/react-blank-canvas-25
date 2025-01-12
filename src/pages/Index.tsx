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

const createSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Dashcam Videos Map</h1>
          <Map />
          
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Latest Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestVideos?.map((video) => (
                <Link 
                  key={video.id} 
                  to={`/video/${video.id}/${createSlug(video.title)}`} 
                  className="block hover:opacity-90 transition-opacity"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{video.title}</CardTitle>
                      <CardDescription>{new Date(video.created_at).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {video.thumbnail_url && (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      )}
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{video.description}</p>
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