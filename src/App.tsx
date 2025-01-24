import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import VideoPage from "./pages/VideoPage";
import AddVideo from "./pages/AddVideo";
import TopVideos from "./pages/TopVideos";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { Toaster } from "./components/ui/toaster";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/video/:slug" element={<VideoPage />} />
        <Route path="/video/id/:id" element={<VideoPage />} /> {/* Backward compatibility */}
        <Route path="/add-video" element={<AddVideo />} />
        <Route path="/top-videos" element={<TopVideos />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;