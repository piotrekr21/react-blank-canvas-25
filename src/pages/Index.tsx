import { Map } from "@/components/Map";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin(profiles?.role === 'admin');
      }
    };

    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Homepage
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/top-videos">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Top Videos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/add-video">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Add Video
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {isAdmin && (
                <NavigationMenuItem>
                  <Link to="/admin">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Admin
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Dashcam Videos Map</h1>
          <Map />
          
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Latest Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestVideos?.map((video) => (
                <Card key={video.id}>
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
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;