import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, MessageCircle, Calendar } from "lucide-react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ReportLocationModal } from "@/components/ReportLocationModal";

const VideoPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: video, isLoading: isVideoLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      if (!id) throw new Error('Video ID is required');
      
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
    enabled: !!id,
  });

  const { data: comments, isLoading: areCommentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      if (!id) throw new Error('Video ID is required');

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!id) throw new Error('Video ID is required');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User must be logged in to comment');

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            video_id: id,
            content,
            user_id: user.id
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
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ voteType }: { voteType: boolean }) => {
      if (!id) throw new Error('Video ID is required');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Musisz być zalogowany, aby głosować');
      }

      const { data: existingVote, error: fetchError } = await supabase
        .from('votes')
        .select('*')
        .eq('video_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingVote) {
        const { error } = await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('votes')
          .insert({
            video_id: id,
            user_id: user.id,
            vote_type: voteType,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', id] });
      toast({
        title: "Sukces",
        description: "Twój głos został zapisany.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się zapisać głosu. Spróbuj ponownie.",
        variant: "destructive",
      });
    },
  });

  const handleVote = async (voteType: boolean) => {
    try {
      await voteMutation.mutateAsync({ voteType });
    } catch (error) {
      console.error('Vote handling error:', error);
    }
  };

  if (isVideoLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-[500px] bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto p-4">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-700">Video not found</h2>
                <p className="text-gray-500 mt-2">The video you're looking for might have been removed or is no longer available.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const upvotes = video?.votes?.filter(v => v.vote_type).length || 0;
  const downvotes = video?.votes?.filter(v => !v.vote_type).length || 0;

  return (
    <>
      <Helmet>
        <title>{video?.title || 'Loading...'} - Dashcam Video</title>
        <meta name="description" content={video?.description || `Watch dashcam footage`} />
        <meta property="og:title" content={`${video?.title || 'Loading...'} - Dashcam Video`} />
        <meta property="og:description" content={video?.description || `Watch dashcam footage`} />
        {video?.thumbnail_url && <meta property="og:image" content={video.thumbnail_url} />}
      </Helmet>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto p-4">
          <Card className="max-w-5xl mx-auto overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                {video.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                {new Date(video.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-lg overflow-hidden mb-6 shadow-md">
                {video.source === 'youtube' ? (
                  <div className="relative w-full pb-[56.25%]">
                    <iframe
                      src={video.video_url}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                    />
                  </div>
                ) : (
                  <video 
                    src={video.video_url}
                    controls
                    className="w-full"
                    poster={video.thumbnail_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              <div className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">{video.description}</p>
                </div>

                <div className="flex items-center justify-between gap-6 py-4">
                  <div className="flex items-center gap-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(true)}
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp className="w-5 h-5" />
                      <span>{upvotes}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(false)}
                      className="flex items-center gap-2"
                    >
                      <ThumbsDown className="w-5 h-5" />
                      <span>{downvotes}</span>
                    </Button>
                  </div>
                  <ReportLocationModal
                    videoId={video.id}
                    currentLat={Number(video.latitude)}
                    currentLng={Number(video.longitude)}
                  />
                </div>

                <Separator className="my-8" />

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
                    <MessageCircle className="w-5 h-5" />
                    Comments
                  </h3>
                  
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] resize-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={addCommentMutation.isPending || !newComment.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>

                  <div className="space-y-6 mt-8">
                    {areCommentsLoading ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : comments && comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                          <p className="text-sm text-gray-500 mb-2">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default VideoPage;
