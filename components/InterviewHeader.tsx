import Link from "next/link";
import { useState } from "react";

interface InterviewHeaderProps {
  onSearchClick?: () => void;  // Optional for the search page reset functionality
}

export default function InterviewHeader({ onSearchClick }: InterviewHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex justify-between items-center p-4 border-b border-[#a3000020] bg-white relative">
      <div className="text-2xl font-bold text-[#8b0000]">THETA TAU GLASSDOOR: INTERVIEWS DATABASE</div>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-8 mr-4">
        {onSearchClick ? (
          <button 
            onClick={onSearchClick}
            className="text-[#8b0000] hover:underline"
          >
            Search
          </button>
        ) : (
          <Link href="/brothers/interviews" className="text-[#8b0000] hover:underline">
            Search
          </Link>
        )}
        <Link href="/brothers/interviews/add" className="text-[#8b0000] hover:underline">
          Add An Interview
        </Link>
      </div>

      {/* Mobile Hamburger Button */}
      <button 
        className="md:hidden text-[#8b0000] p-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isMenuOpen ? (
            // X icon when menu is open
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            // Hamburger icon when menu is closed
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 w-48 bg-white border border-[#8b000020] rounded-lg shadow-lg mt-2 py-2 md:hidden">
          {onSearchClick ? (
            <button 
              onClick={() => {
                onSearchClick();
                setIsMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-[#8b0000] hover:bg-[#8b000010]"
            >
              Search
            </button>
          ) : (
            <Link 
              href="/brothers/interviews" 
              className="block px-4 py-2 text-[#8b0000] hover:bg-[#8b000010]"
              onClick={() => setIsMenuOpen(false)}
            >
              Search
            </Link>
          )}
          <Link 
            href="/brothers/interviews/add" 
            className="block px-4 py-2 text-[#8b0000] hover:bg-[#8b000010]"
            onClick={() => setIsMenuOpen(false)}
          >
            Add An Interview
          </Link>
        </div>
      )}
    </div>
  );
}
