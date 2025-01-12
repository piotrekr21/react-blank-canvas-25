import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const VideoPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: video, isLoading: isVideoLoading } = useQuery({
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

  const { data: comments, isLoading: areCommentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            video_id: id,
            content,
          },
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  if (isVideoLoading) {
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
            {video.source === 'youtube' ? (
              <div className="relative w-full pb-[56.25%] mb-4">
                <iframe
                  src={video.video_url}
                  className="absolute top-0 left-0 w-full h-full rounded-md"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                />
              </div>
            ) : (
              <video 
                src={video.video_url}
                controls
                className="w-full rounded-md mb-4"
                poster={video.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
            )}
            <p className="text-gray-600 mb-4">{video.description}</p>
            <div className="flex items-center gap-4 mb-8">
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

            {/* Comments Section */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments
              </h3>
              
              {/* Add Comment */}
              <div className="mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={addCommentMutation.isPending || !newComment.trim()}
                >
                  {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                </Button>
              </div>

              {/* Comments List */}
              {areCommentsLoading ? (
                <p>Loading comments...</p>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Posted on {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                      <p>{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default VideoPage;