import BroNavBar from "@/components/BroNavBar";
import Link from "next/link";

export default function AddInterview() {
  return (
    <div className="flex md:flex-row flex-col min-h-screen">
      <BroNavBar isPledge={false}/>
      <div className="flex-grow">
        {/* Header Section */}
        <div className="flex justify-between items-center p-4 border-b border-[#a3000020]">
          <div className="text-2xl font-bold text-[#8b0000]">THETA TAU GLASSDOOR</div>
          <div className="space-x-8 mr-4">
            <Link href="/brothers/interviews" className="text-[#8b0000] hover:underline">Search</Link>
            <Link href="/brothers/interviews/add" className="text-[#8b0000] hover:underline">Add An Interview</Link>
          </div>
        </div>

        {/* Main Content - Empty for now as requested */}
        <div className="flex flex-col items-center justify-center flex-grow p-8">
        </div>
      </div>
    </div>
  );
}
