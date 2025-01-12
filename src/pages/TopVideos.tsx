import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
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

      // Calculate score (upvotes - downvotes) for each video
      const videosWithScore = data.map(video => ({
        ...video,
        score: video.votes.reduce((acc: number, vote: { vote_type: boolean }) => 
          acc + (vote.vote_type ? 1 : -1), 0)
      }));

      // Sort by score in descending order
      return videosWithScore.sort((a, b) => b.score - a.score);
    },
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-4">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Top Dashcam Videos</h1>
        <div className="grid grid-cols-1 gap-6">
          {topVideos?.map((video, index) => (
            <Card key={video.id} className="relative">
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <CardHeader className="pl-16">
                <CardTitle>{video.title}</CardTitle>
                <CardDescription>Posted on {new Date(video.created_at).toLocaleDateString()}</CardDescription>
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
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{video.votes.filter(v => v.vote_type).length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4" />
                        <span>{video.votes.filter(v => !v.vote_type).length}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Score: {video.score}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default TopVideos;