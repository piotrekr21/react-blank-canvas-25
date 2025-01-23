import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center space-x-6 text-sm text-gray-600">
          <Link 
            to="/privacy-policy" 
            className="hover:text-gray-900 transition-colors"
          >
            Polityka Prywatności
          </Link>
          <Link 
            to="/terms" 
            className="hover:text-gray-900 transition-colors"
          >
            Regulamin
          </Link>
        </div>
        <div className="text-center mt-4 text-sm text-gray-500">
          © {new Date().getFullYear()} Wszystkie prawa zastrzeżone
        </div>
      </div>
    </footer>
  );
};