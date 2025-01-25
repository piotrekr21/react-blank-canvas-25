import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Trash, Eye, Edit2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Video = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user_id: string;
  video_url: string;
  source: string;
};

type User = {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "user";
};

type Vote = {
  id: string;
  video_id: string;
  user_id: string;
  vote_type: boolean;
  created_at: string;
  video: {
    title: string;
  };
  user: {
    email: string;
  };
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

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

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, role, created_at");

      if (profilesError) throw profilesError;

      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const combinedUsers = profiles.map(profile => {
        const authUser = authUsers.users.find(u => u.id === profile.id);
        return {
          id: profile.id,
          email: authUser?.email || "Unknown",
          created_at: profile.created_at,
          role: profile.role,
        };
      });

      return combinedUsers as User[];
    },
    enabled: isAdmin,
  });

  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ["admin-votes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select(`
          *,
          video:videos(title),
          user:profiles(id)
        `)
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

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
      
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const handleVideoPreview = (video: Video) => {
    setSelectedVideo(video);
    setEditedTitle(video.title);
    setEditedDescription(video.description || "");
    setEditMode(false);
  };

  const handleClosePreview = () => {
    setSelectedVideo(null);
    setEditMode(false);
  };

  const handleEditSave = async () => {
    if (!selectedVideo) return;

    try {
      const { error } = await supabase
        .from("videos")
        .update({
          title: editedTitle,
          description: editedDescription,
        })
        .eq("id", selectedVideo.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast({
        title: "Success",
        description: "Video updated successfully",
      });
      setEditMode(false);
      setSelectedVideo(prev => prev ? { ...prev, title: editedTitle, description: editedDescription } : null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

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
                    <TableCell>{new Date(video.created_at).toLocaleDateString('pl-PL')}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVideoPreview(video)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      {video.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleVideoStatus(video.id, "approved")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleVideoStatus(video.id, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <Table>
              <TableCaption>List of all users</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('pl-PL')}</TableCell>
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
                  <TableHead>Video</TableHead>
                  <TableHead>Vote Type</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votesLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : votes?.map((vote) => (
                  <TableRow key={vote.id}>
                    <TableCell>{vote.video?.title || "Deleted video"}</TableCell>
                    <TableCell>{vote.vote_type ? "Upvote" : "Downvote"}</TableCell>
                    <TableCell>{new Date(vote.created_at).toLocaleDateString('pl-PL')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                {editMode ? (
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  selectedVideo?.title
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  {editMode ? "Cancel" : "Edit"}
                </Button>
              </DialogTitle>
              {editMode && (
                <DialogDescription>
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="mt-2"
                    placeholder="Video description"
                  />
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="mt-4">
              {selectedVideo?.source === 'youtube' ? (
                <div className="relative w-full pb-[56.25%]">
                  <iframe
                    src={selectedVideo?.video_url}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideo?.title}
                  />
                </div>
              ) : (
                <video 
                  src={selectedVideo?.video_url}
                  controls
                  className="w-full"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {!editMode && selectedVideo?.description && (
                <p className="mt-4 text-gray-700">{selectedVideo.description}</p>
              )}
              {editMode && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleEditSave}>
                    Save Changes
                  </Button>
                </div>
              )}
              {selectedVideo?.status === "pending" && !editMode && (
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    onClick={() => {
                      handleVideoStatus(selectedVideo.id, "approved");
                      handleClosePreview();
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleVideoStatus(selectedVideo.id, "rejected");
                      handleClosePreview();
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Admin;