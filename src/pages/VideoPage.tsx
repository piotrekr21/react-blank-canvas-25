import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Helmet } from "react-helmet";

const VideoPage = () => {
  const { id } = useParams();

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          votes (
            vote_type
          )
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      return data;
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

  if (!video) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-4">Video not found</div>
      </>
    );
  }

  const score = video.votes.reduce((acc: number, vote: { vote_type: boolean }) => 
    acc + (vote.vote_type ? 1 : -1), 0);

  return (
    <>
      <Helmet>
        <title>{video.title} - Dashcam Video</title>
        <meta name="description" content={video.description || `Watch ${video.title} dashcam footage`} />
        <meta property="og:title" content={`${video.title} - Dashcam Video`} />
        <meta property="og:description" content={video.description || `Watch ${video.title} dashcam footage`} />
        {video.thumbnail_url && <meta property="og:image" content={video.thumbnail_url} />}
      </Helmet>
      <Header />
      <div className="container mx-auto p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{video.title}</CardTitle>
            <CardDescription>Posted on {new Date(video.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {video.thumbnail_url && (
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-[400px] object-cover rounded-md mb-4"
              />
            )}
            <p className="text-gray-600 mb-4">{video.description}</p>
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
                Score: {score}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default VideoPage;