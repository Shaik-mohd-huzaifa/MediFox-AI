
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-inter">
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-mediGreen/10 rounded-full mb-6">
          <span className="text-3xl text-mediGreen">404</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page not found</h1>
        <p className="text-lg text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link to="/" className="bg-mediGreen hover:bg-green-600 text-white py-2 px-6 rounded-md transition-colors font-medium">
          Return to home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
