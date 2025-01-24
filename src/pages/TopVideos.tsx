import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const TopVideos = () => {
  const { data: topVideos, isLoading } = useQuery({
    queryKey: ['top-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          votes (
            vote_type
          )
        `)
        .eq('status', 'approved');

      if (error) throw error;

      const videosWithScore = data.map(video => ({
        ...video,
        score: video.votes.reduce((acc: number, vote: { vote_type: boolean }) => 
          acc + (vote.vote_type ? 1 : -1), 0)
      }));

      return videosWithScore.sort((a, b) => b.score - a.score);
    },
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto p-4">
            <div className="animate-pulse space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto p-4 animate-fade-in">
          <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Najlepsze Filmy z Kamer
          </h1>
          <div className="grid grid-cols-1 gap-6">
            {topVideos?.map((video, index) => (
              <Link to={`/video/${video.id}`} key={video.id}>
                <Card className="relative hover:shadow-lg transition-shadow duration-300 transform hover:scale-[1.01]">
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <CardHeader className="pl-16">
                    <CardTitle>{video.title}</CardTitle>
                    <CardDescription>Dodano {new Date(video.created_at).toLocaleDateString('pl-PL')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      {video.thumbnail_url && (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-48 h-32 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{video.votes.filter(v => v.vote_type).length}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <ThumbsDown className="w-4 h-4" />
                            <span>{video.votes.filter(v => !v.vote_type).length}</span>
                          </div>
                          <div className="text-sm text-purple-600 font-medium">
                            Score: {video.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TopVideos;