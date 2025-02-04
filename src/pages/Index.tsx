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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto p-4 animate-fade-in">
          <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Mapa Filmów z Kamer Samochodowych
          </h1>
          <Card className="mb-8 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <Map />
            </CardContent>
          </Card>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Najnowsze Filmy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestVideos?.map((video) => (
                <Link 
                  key={video.id} 
                  to={`/video/${video.slug}`} 
                  className="transform transition-all duration-300 hover:scale-[1.02]"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="text-xl">{video.title}</CardTitle>
                      <CardDescription>
                        {new Date(video.created_at).toLocaleDateString('pl-PL')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {video.thumbnail_url && (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-md mb-4"
                        />
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">
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