import BroNavBar from "@/components/BroNavBar";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import InterviewHeader from "@/components/InterviewHeader";
import supabase from "@/supabase";

interface Interview {
  id: number;
  company: string;
  major: string;
  employment_type: string;
  position: string;
  got_job: string;
  first_interview_date: string | null;
  num_interviews: number;
}

interface Company {
  company: string;
  count: number;
}

export default function Interviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allInterviews, setAllInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("InterviewDetails")
      .select(
        "id, company, major, employment_type, position, got_job, first_interview_date, num_interviews"
      )
      .order("first_interview_date", { ascending: false });

    if (error) {
      console.error("Error fetching interviews:", error);
      setIsLoading(false);
      return;
    }

    const interviews = data || [];
    setAllInterviews(interviews);

    const companyCounts = interviews.reduce(
      (acc: { [key: string]: number }, curr) => {
        if (curr.company) acc[curr.company] = (acc[curr.company] || 0) + 1;
        return acc;
      },
      {}
    );

    const uniqueCompanies = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 14);

    setCompanies(uniqueCompanies);
    setIsLoading(false);
  };

  const filteredInterviews = useMemo(() => {
    let results = allInterviews;

    if (activeCompany) {
      results = results.filter((i) => i.company === activeCompany);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (i) =>
          i.company?.toLowerCase().includes(q) ||
          i.major?.toLowerCase().includes(q) ||
          i.position?.toLowerCase().includes(q) ||
          i.employment_type?.toLowerCase().includes(q)
      );
    }

    return results;
  }, [allInterviews, searchQuery, activeCompany]);

  const handleCompanyChip = (company: string) => {
    if (activeCompany === company) {
      setActiveCompany(null);
    } else {
      setActiveCompany(company);
      setSearchQuery("");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex md:flex-row flex-col min-h-screen">
      <BroNavBar isPledge={false} />
      <div
        className="flex-grow flex flex-col overflow-hidden"
        style={{ backgroundColor: "#f5f3dc", height: "100vh" }}
      >
        <InterviewHeader
          onSearchClick={() => {
            setSearchQuery("");
            setActiveCompany(null);
          }}
        />

        {/* Sticky search + filter bar */}
        <div
          className="flex-shrink-0 px-6 py-4 border-b border-[#8b000015]"
          style={{ backgroundColor: "#f5f3dc" }}
        >
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Search input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b000060]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by company, position, major, or type..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveCompany(null);
                }}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#8b000025] rounded-xl focus:outline-none focus:border-[#8b0000] transition-colors text-sm shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {/* Company filter chips */}
            <div
              className="flex gap-2 overflow-x-auto pb-0.5"
              style={{ scrollbarWidth: "none" }}
            >
              {companies.map(({ company, count }) => (
                <button
                  key={company}
                  onClick={() => handleCompanyChip(company)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    activeCompany === company
                      ? "bg-[#8b0000] text-white shadow-sm"
                      : "bg-white text-[#8b0000] border border-[#8b000025] hover:border-[#8b0000] hover:shadow-sm"
                  }`}
                >
                  {company}
                  <span className={`ml-1 ${activeCompany === company ? "opacity-70" : "opacity-50"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable interview feed */}
        <div className="flex-grow overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {isLoading
                  ? "Loading..."
                  : `${filteredInterviews.length} interview${filteredInterviews.length !== 1 ? "s" : ""}`}
              </p>
              <Link
                href="/brothers/interviews/add"
                className="text-xs px-3 py-1.5 bg-[#8b0000] text-white rounded-lg hover:bg-[#a00000] transition-colors font-medium"
              >
                + Add Interview
              </Link>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-white rounded-xl animate-pulse opacity-50"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredInterviews.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-base font-medium">No interviews found</p>
                <p className="text-sm mt-1">Try a different search or filter</p>
              </div>
            )}

            {/* Interview cards */}
            {!isLoading && filteredInterviews.length > 0 && (
              <div className="space-y-2.5">
                {filteredInterviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={`/brothers/interviews/${interview.id}`}
                    className="flex items-start gap-3.5 bg-white rounded-xl border border-[#8b000010] hover:border-[#8b000035] hover:shadow-md transition-all p-4 group"
                  >
                    {/* Company initial */}
                    <div className="w-10 h-10 rounded-lg bg-[#8b000012] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#8b0000] font-bold text-sm">
                        {interview.company?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-[#8b0000] transition-colors text-sm truncate">
                            {interview.position}
                          </h3>
                          <p className="text-[#8b0000] text-sm font-medium">
                            {interview.company}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            interview.employment_type === "Full Time"
                              ? "bg-[#8b0000] text-white"
                              : "bg-[#8b000012] text-[#8b0000]"
                          }`}
                        >
                          {interview.employment_type}
                        </span>
                      </div>

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 flex-wrap">
                        {interview.major && <span>{interview.major}</span>}
                        {interview.num_interviews > 0 && (
                          <>
                            <span>·</span>
                            <span>
                              {interview.num_interviews} round
                              {interview.num_interviews !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                        {interview.first_interview_date && (
                          <>
                            <span>·</span>
                            <span>{formatDate(interview.first_interview_date)}</span>
                          </>
                        )}
                        <span>·</span>
                        <span
                          className={
                            interview.got_job === "Y"
                              ? "text-green-600 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {interview.got_job === "Y"
                            ? "✓ Offer received"
                            : "No offer"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
