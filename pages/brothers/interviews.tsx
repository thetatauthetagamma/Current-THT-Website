import BroNavBar from "@/components/BroNavBar";
import Link from "next/link";
import { useState, useEffect } from "react";
import supabase from "@/supabase";

interface Company {
  company: string;
  count: number;
}

interface Interview {
  id: number;
  company: string;
  major: string;
  employment_type: string;
  position: string;
  // Add other fields as needed
}

export default function Interviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchResults, setSearchResults] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unique companies on mount
  useEffect(() => {
    fetchUniqueCompanies();
  }, []);

  const fetchUniqueCompanies = async () => {
    const { data, error } = await supabase
      .from('InterviewDetails')
      .select('company')
      .not('company', 'is', null);

    if (error) {
      console.error('Error fetching companies:', error);
      return;
    }

    // Count occurrences of each company
    const companyCounts = data.reduce((acc: { [key: string]: number }, curr) => {
      acc[curr.company] = (acc[curr.company] || 0) + 1;
      return acc;
    }, {});

    // Convert to array of objects with company name and count
    const uniqueCompanies = Object.entries(companyCounts).map(([company, count]) => ({
      company,
      count
    }));

    setCompanies(uniqueCompanies);
  };

  const performSearch = async (searchTerm: string) => {
    setIsLoading(true);
    setSearchQuery(searchTerm);

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
       .from('InterviewDetails')
        .select('*')
        .or(
          `company.ilike.%${searchTerm}%,` +
          `major.ilike.%${searchTerm}%,` +
          `position.ilike.%${searchTerm}%,` +
          `employment_type.ilike.%${searchTerm}%`
        )
        .order('first_interview_date', { ascending: false })  // Most recent interviews first
        .limit(5);
    
    console.log('Search term:', searchTerm);
    console.log('Search results:', data);
    console.log('Search error:', error);

    if (error) {
      console.error('Search error:', error);
      setIsLoading(false);
      return;
    }

    setSearchResults(data || []);
    setIsLoading(false);
  };

  const handleCompanyClick = (company: string) => {
    setSearchQuery(company);
    performSearch(company);
  };

  return (
    <div className="flex md:flex-row flex-col min-h-screen">
      <BroNavBar isPledge={false}/>
      <div className="flex-grow" style={{ backgroundColor: '#f5f3dc' }}>
        {/* Header Section */}
        <div className="flex justify-between items-center p-4 border-b border-[#a3000020] bg-white">
          <div className="text-2xl font-bold text-[#8b0000]">THETA TAU GLASSDOOR: INTERVIEWS DATABASE</div>
          <div className="space-x-8 mr-4">
            <button 
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }} 
              className="text-[#8b0000] hover:underline"
            >
              Search
            </button>
            <Link href="/brothers/interviews/add" className="text-[#8b0000] hover:underline">Add An Interview</Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center p-8" style={{ paddingTop: '15vh' }}>
          <h1 className="text-3xl font-bold mb-8 text-[#8b0000]">Interview Search</h1>
          
          {/* Search Bar */}
          <div className="w-full max-w-2xl mb-12">
            <input
              type="text"
              placeholder="Search by company, major, position, or employment type..."
              value={searchQuery}
              onChange={(e) => performSearch(e.target.value)}
              className="w-full px-4 py-2 border-2 border-[#8b000050] rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors"
            />
          </div>

          {/* Companies Section */}
          {!searchQuery && (
            <div className="w-full max-w-4xl text-center">
              <h2 className="text-2xl font-semibold mb-12 text-[#8b0000]">Check Out Interviews Happening At</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((company) => (
                  <button
                    key={company.company}
                    onClick={() => handleCompanyClick(company.company)}
                    className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#8b000020] text-left"
                  >
                    <h3 className="font-semibold text-[#8b0000]">{company.company}</h3>
                    <p className="text-gray-600 text-sm">{company.count} interview{company.count !== 1 ? 's' : ''}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="w-full max-w-4xl mt-8">
              {isLoading ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : (
                <div className="space-y-4">
                  {searchResults.length === 0 ? (
                    <p className="text-center text-gray-600">No interviews found</p>
                  ) : (
                    searchResults.map((interview) => (
                      <Link
                        key={interview.id}
                        href={`/brothers/interviews/${interview.id}`}
                        className="block p-4 bg-white rounded-lg shadow-sm border border-[#8b000020] hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <h3 className="font-semibold text-[#8b0000]">{interview.position} at {interview.company}</h3>
                        <p className="text-gray-600">{interview.major} • {interview.employment_type}</p>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}