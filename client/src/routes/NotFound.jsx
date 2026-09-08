import { Link } from "react-router-dom";
import { MdErrorOutline, MdHome, MdConstruction } from "react-icons/md";

export default function NotFound({ type = "404" }) {
  const isUnderConstruction = type === "construction";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-xl w-full text-center border border-gray-200">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-900/10 p-6 rounded-full">
            {isUnderConstruction ? (
              <MdConstruction className="text-blue-900 text-6xl" />
            ) : (
              <MdErrorOutline className="text-blue-900 text-6xl" />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-blue-900 mb-4">
          {isUnderConstruction ? "Page Under Construction" : "404 - Page Not Found"}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mb-8 text-sm md:text-base">
          {isUnderConstruction
            ? "We're currently working on this feature. Please check back soon."
            : "The page you're looking for doesn't exist or has been moved."}
        </p>

        {/* Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 shadow-md"
        >
          <MdHome />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
