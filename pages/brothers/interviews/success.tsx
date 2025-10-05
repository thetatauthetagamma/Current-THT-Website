import BroNavBar from "@/components/BroNavBar";
import Link from "next/link";
import InterviewHeader from "@/components/InterviewHeader";

export default function InterviewSuccess() {
  return (
    <div className="flex md:flex-row flex-col min-h-screen">
      <BroNavBar isPledge={false}/>
      <div className="flex-grow" style={{ backgroundColor: '#f5f3dc' }}>
        <InterviewHeader />

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
