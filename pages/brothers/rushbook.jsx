import BroNavBar from "@/components/BroNavBar";
import { useEffect, useState } from "react";
import RusheeTile from "@/components/rush/RusheeTile";
import supabase from "../../supabase";
import { CSVLink } from "react-csv"; // Import CSV download library
import { BrothersProvider } from "@/contexts/BrothersContext";

// Helper to compute "net score"
function getNetScore(rushee) {
  const likesCount = rushee.likes?.length || 0;
  const dislikesCount = rushee.dislikes?.length || 0;
  const starsCount = rushee.stars?.length || 0;
  // example weighting: like = +1, dislike = -1, star = +2
  return likesCount + 2 * starsCount - dislikesCount;
}

export default function RushBook() {
  const [rushees, setRushees] = useState([]);
  const [sortedRushees, setSortedRushees] = useState([]);
  const [userID, setUserID] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Sorting & filtering states
  const [sortField, setSortField] = useState('uniqname');  // default sort by 'uniqname' for non-admin
  const [sortOrder, setSortOrder] = useState('asc');       // 'asc' or 'desc'
  const [searchTerm, setSearchTerm] = useState('');        // filter by name

  // 1. Fetch current user
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user?.email) {
          // only keep part before '@'
          setUserID(data.session.user.email.split('@')[0]);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchSession();
    console.log("Fidget Fam == Best Fam")
  }, []);

  // 2. Check if user is admin
  useEffect(() => {
    const fetchAdminRole = async () => {
      if (!userID) return
      const { data, error } = await supabase
        .from('Brothers')
        .select('adminrole')
        .eq('userid', userID)
        .single()

      if (!error && data) {
        const isAdminUser = data.adminrole === 'dev' || data.adminrole === 'rush'
        setIsAdmin(isAdminUser)
        
        // Set default sort for non-admin users
        if (!isAdminUser) {
          setSortField('uniqname')
          setSortOrder('asc')
        }
      } else {
        console.error('Error fetching admin role:', error)
      }
    }
    fetchAdminRole()
  }, [userID])
  const fetchRushees = async () => {
    const { data: rusheesData, error } = await supabase
      .from('Rushees')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error(error);
    } else if (rusheesData) {
      setRushees(rusheesData);
    }
  };
  // 3. Fetch rushees
  useEffect(() => {

    fetchRushees();
  }, []);

  // 4. Sort & filter whenever rushees or sort settings change
  useEffect(() => {
    // Make a copy so we don’t mutate the original
    let updated = [...rushees];

    // Filter by searchTerm
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      updated = updated.filter((r) =>
        r.uniqname?.toLowerCase().includes(term) ||
        r.firstname?.toLowerCase().includes(term)
      );
    }

    // Sort in ascending order, then invert if "desc"
    updated.sort((a, b) => {
      let result = 0;

      // Values used in numeric sorts
      const aLikes = a.likes?.length || 0;
      const bLikes = b.likes?.length || 0;
      const aDislikes = a.dislikes?.length || 0;
      const bDislikes = b.dislikes?.length || 0;
      const aStars = a.stars?.length || 0;
      const bStars = b.stars?.length || 0;

      // Helper for net score
      const aNet = getNetScore(a); // likes + 2*stars - dislikes
      const bNet = getNetScore(b);

      switch (sortField) {
        case 'likes':
          // ascending => smaller #likes first
          result = aLikes - bLikes;
          break;
        case 'dislikes':
          // ascending => smaller #dislikes first
          result = aDislikes - bDislikes;
          break;
        case 'stars':
          // ascending => smaller #stars first
          result = aStars - bStars;
          break;
        case 'netscore':
          // ascending => lower netscore first
          result = aNet - bNet;
          break;
        case 'uniqname':
          // localeCompare returns negative if a < b => ascending
          result = a.uniqname.localeCompare(b.uniqname);
          break;
        case 'firstname':
          result = a.firstname.localeCompare(b.firstname);
          break;
        default:
          result = 0;
      }

      // If user selected desc, invert the result
      return sortOrder === 'desc' ? -result : result;
    });

    setSortedRushees(updated);
  }, [rushees, sortField, sortOrder, searchTerm]);


  const generateCSVData = () => {
    return sortedRushees.map((rushee) => ({
      uniqname: rushee.uniqname,
      full_name: `${rushee.firstname} ${rushee.lastname}`,
      pronouns: rushee.pronouns || '',
      likes: rushee.likes?.length || 0,
      dislikes: rushee.dislikes?.length || 0,
      stars: rushee.stars?.length || 0,
      score: getNetScore(rushee) || 0,
    }));
  };


  return (
    <BrothersProvider>
      <div className="flex flex-col md:flex-row flex-grow border-b-2 border-[#a3000020] min-h-screen">
        <BroNavBar />
        <div className="flex-1 p-4 bg-gray-100">

          {/* Page Title */}
          <h1 className="text-2xl font-bold mb-4">Rush Book</h1>
          {isAdmin && (
            <CSVLink
              data={generateCSVData()}
              filename={`rushee_data_${new Date().toISOString().slice(0, 10)}.csv`}
              className="bg-red-800 text-white px-3 py-2 rounded hover:bg-red-900"
            >
              Download CSV
            </CSVLink>
          )}
          {/* SORT & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 ">
            {/* Search Input */}
            <div>
              <label className="font-semibold mr-2">Search (First Name/Uniqname):</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-2 py-1"
                placeholder="e.g. katemcg"
              />
            </div>

            {/* Sort Field */}
            <div>
              <label className="font-semibold mr-2">Sort By:</label>
              <select
                className="border p-1 rounded"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                {isAdmin && <option value="likes">Likes</option>}
                {isAdmin && <option value="dislikes">Dislikes</option>}
                {isAdmin && <option value="stars">Stars</option>}
                {isAdmin && <option value="netscore">Net Score</option>}
                <option value="uniqname">Uniqname</option>
                <option value="firstname">First Name</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="font-semibold mr-2">Order:</label>
              <select
                className="border p-1 rounded"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedRushees.map((rushee) => (
              <RusheeTile
                key={rushee.uniqname}
                uniqname={rushee.uniqname}
                firstname={rushee.firstname}
                lastname={rushee.lastname}
                pronouns={rushee.pronouns}
                likes={rushee.likes}
                dislikes={rushee.dislikes}
                stars={rushee.stars}
                brotherID={userID}
              />
            ))}
          </div>
        </div>
      </div>
    </BrothersProvider>
  );
}
