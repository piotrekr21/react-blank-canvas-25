import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Trash } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Video = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user_id: string;
};

type Vote = {
  id: string;
  video_id: string;
  user_id: string;
  vote_type: boolean;
  created_at: string;
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to verify admin status",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        if (!profile || profile.role !== "admin") {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          });
          navigate("/");
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error in admin check:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate, toast]);

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Video[];
    },
    enabled: isAdmin,
  });

  // Fetch votes
  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ["admin-votes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Vote[];
    },
    enabled: isAdmin,
  });

  const handleVideoStatus = async (videoId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("videos")
        .update({ status })
        .eq("id", videoId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast({
        title: "Success",
        description: `Video ${status} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update video status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVote = async (voteId: string) => {
    try {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("id", voteId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-votes"] });
      toast({
        title: "Success",
        description: "Vote deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vote",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Videos</h2>
          <Table>
            <TableCaption>List of all videos</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videosLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : videos?.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>{video.title}</TableCell>
                  <TableCell>{video.status}</TableCell>
                  <TableCell>{new Date(video.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2">
                    {video.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleVideoStatus(video.id, "approved")}
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleVideoStatus(video.id, "rejected")}
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Votes</h2>
          <Table>
            <TableCaption>List of all votes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Video ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Vote Type</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {votesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : votes?.map((vote) => (
                <TableRow key={vote.id}>
                  <TableCell>{vote.video_id}</TableCell>
                  <TableCell>{vote.user_id}</TableCell>
                  <TableCell>{vote.vote_type ? "Up" : "Down"}</TableCell>
                  <TableCell>{new Date(vote.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteVote(vote.id)}
                    >
                      <Trash className="h-4 w-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
