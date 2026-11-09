import BroNavBar from "@/components/BroNavBar";
import Link from "next/link";
import InterviewHeader from "@/components/InterviewHeader";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import supabase from "@/supabase";


interface InterviewData {
  id: number;
  name: string;
  major: string;
  email: string;
  company: string;
  position: string;
  employment_type: string;
  num_interviews: string;
  overall_experience: string;
  got_job: string;
  tips: string;
  first_interview_date: string | null;
  interview_rounds: Array<{
    type: string;
    notes: string;
  }>;
}

export default function ViewInterview() {
  const router = useRouter();
  const isPledge = router.pathname.startsWith("/members/");
  const interviewsRoute = isPledge ? "/members/interviews" : "/brothers/interviews";
  const { id } = router.query;
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInterview();
    }
  }, [id]);

  const fetchInterview = async () => {
    const [{ data: sessionData }, { data, error }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from('InterviewDetails').select('*').eq('id', id).single(),
    ]);

    if (error) {
      console.error('Error fetching interview:', error);
      return;
    }

    const sessionEmail = sessionData.session?.user.email ?? "";
    setIsOwner(!!sessionEmail && sessionEmail.toLowerCase() === data.email?.toLowerCase());
    setInterview(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex md:flex-row flex-col min-h-screen">
        <BroNavBar isPledge={isPledge}/>
        <div className="flex-grow flex items-center justify-center" style={{ backgroundColor: '#f5f3dc' }}>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex md:flex-row flex-col min-h-screen">
        <BroNavBar isPledge={isPledge}/>
        <div className="flex-grow flex items-center justify-center" style={{ backgroundColor: '#f5f3dc' }}>
          <p className="text-gray-600">Interview not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex md:flex-row flex-col min-h-screen">
      <BroNavBar isPledge={isPledge}/>
      <div className="flex-grow" style={{ backgroundColor: '#f5f3dc' }}>
        <InterviewHeader isPledge={isPledge} />

        {/* Interview Content */}
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#8b0000]">Interview Experience</h1>
            {isOwner && (
              <Link
                href={`${interviewsRoute}/edit/${interview.id}`}
                className="text-xs px-3 py-1.5 bg-white border border-[#8b000025] text-[#8b0000] rounded-lg hover:border-[#8b0000] hover:shadow-sm transition-all font-medium"
              >
                Edit
              </Link>
            )}
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-6">General Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Name</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{interview.name}</p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Major</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{interview.major}</p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Email</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{interview.email}</p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">First Interview Date</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">
                    {interview.first_interview_date ? new Date(interview.first_interview_date).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric'
                    }) : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Company</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{interview.company}</p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Position</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{interview.position}</p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Employment Type</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{interview.employment_type}</p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Number of Interview Rounds</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{interview.num_interviews}</p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Overall Interview Experience</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap">{interview.overall_experience}</p>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Got the job?</label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{interview.got_job === 'Y' ? 'Yes' : 'No'}</p>
                </div>
                {interview.tips && (
                  <div>
                    <label className="block mb-1 font-medium">Tips for Future Candidates</label>
                    <p className="px-4 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap">{interview.tips}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interview Rounds Section */}
            <div>
              <h2 className="text-xl font-semibold mb-6">Interview Rounds</h2>
              {interview.interview_rounds && interview.interview_rounds.length > 0 ? (
                <div className="space-y-6">
                  {interview.interview_rounds.map((round, index) => (
                    <div key={index} className="border border-[#8b000020] rounded-lg p-6 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-[#8b0000]">Round {index + 1}</h3>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">{round.type}</span>
                      </div>
                      <div>
                        <h4 className="text-gray-700 font-medium mb-2">Notes</h4>
                        <div className="px-4 py-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                          {round.notes || "No notes provided"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No interview rounds information provided</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
