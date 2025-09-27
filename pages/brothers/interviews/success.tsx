import BroNavBar from "@/components/BroNavBar";
import Link from "next/link";

export default function InterviewSuccess() {
  return (
    <div className="flex md:flex-row flex-col min-h-screen">
      <BroNavBar isPledge={false}/>
      <div className="flex-grow" style={{ backgroundColor: '#f5f3dc' }}>
        {/* Header Section */}
        <div className="flex justify-between items-center p-4 border-b border-[#a3000020] bg-white">
          <div className="text-2xl font-bold text-[#8b0000]">THETA TAU GLASSDOOR: INTERVIEWS DATABASE</div>
          <div className="space-x-8 mr-4">
            <Link href="/brothers/interviews" className="text-[#8b0000] hover:underline">Search</Link>
            <Link href="/brothers/interviews/add" className="text-[#8b0000] hover:underline">Add An Interview</Link>
          </div>
        </div>

        {/* Success Content */}
        <div className="flex flex-col items-center justify-center flex-grow p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#8b0000] mb-4">
              Submission Received!
            </h1>
            <p className="text-[#8b0000] text-xl">
              Thank you for sharing your interview experience.
            </p>
          </div>
          
          <Link href="/brothers/interviews/add">
            <button className="px-6 py-3 bg-[#8b0000] text-white rounded-lg hover:bg-[#a00000] transition-colors text-lg">
              Submit Another Interview
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
