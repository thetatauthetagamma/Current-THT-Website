import BroNavBar from "@/components/BroNavBar";
import Link from "next/link";
import { useState } from "react";

export default function Interviews() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex md:flex-row flex-col min-h-screen">
      <BroNavBar isPledge={false}/>
      <div className="flex-grow flex flex-col" style={{ backgroundColor: '#f5f3dc' }}>
        {/* Header Section */}
        <div className="flex justify-between items-center p-4 border-b border-[#a3000020] bg-white">
          <div className="text-2xl font-bold text-[#8b0000]">THETA TAU GLASSDOOR</div>
          <div className="space-x-8 mr-4">
            <Link href="/brothers/interviews" className="text-[#8b0000] hover:underline">Search</Link>
            <Link href="/brothers/interviews/add" className="text-[#8b0000] hover:underline">Add An Interview</Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center flex-grow p-8" style={{ paddingTop: '15vh' }}>
          <h1 className="text-3xl font-bold mb-8 text-[#8b0000]">Interview Search</h1>
          
          {/* Search Bar */}
          <div className="w-full max-w-2xl">
            <input
              type="text"
              placeholder="Search for interviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-[#8b000050] rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}