import BroNavBar from "@/components/BroNavBar";
import { useEffect, useState } from "react";
import RusheeTile from "@/components/rush/RusheeTile";
import supabase from "../../supabase";

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

  // Sorting & filtering states
  const [sortField, setSortField] = useState('likes');  // default sort by 'likes'
  const [sortOrder, setSortOrder] = useState('desc');   // 'asc' or 'desc'
  const [searchTerm, setSearchTerm] = useState('');      // filter by name

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
  }, []);

  // 2. Fetch rushees
  useEffect(() => {
    const fetchRushees = async () => {
      const { data: rusheesData, error } = await supabase
        .from('Rushees')
        .select('*');

      if (error) {
        console.error(error);
      } else if (rusheesData) {
        setRushees(rusheesData);
      }
    };
    fetchRushees();
  }, []);

  // 3. Sort & filter whenever rushees or sort settings change
  useEffect(() => {
    // Make a copy so we don’t mutate the original array
    let updated = [...rushees];

    // Optional: Filter by searchTerm (search in uniqname or firstname)
    if (searchTerm.trim() !== '') {
      updated = updated.filter((r) => {
        const term = searchTerm.toLowerCase();
        return (
          r.uniqname?.toLowerCase().includes(term) ||
          r.firstname?.toLowerCase().includes(term)
        );
      });
    }

    // Sort logic
    updated.sort((a, b) => {
      // Decide each field
      const aLikes = a.likes?.length || 0;
      const bLikes = b.likes?.length || 0;
      const aDislikes = a.dislikes?.length || 0;
      const bDislikes = b.dislikes?.length || 0;
      const aStars = a.stars?.length || 0;
      const bStars = b.stars?.length || 0;

      switch (sortField) {
        case 'likes':
          return bLikes - aLikes;
        case 'dislikes':
          return bDislikes - aDislikes;
        case 'stars':
          return bStars - aStars;
        case 'netscore':
          return getNetScore(b) - getNetScore(a);
        case 'uniqname':
          return a.uniqname.localeCompare(b.uniqname);
        case 'firstname':
          return a.firstname.localeCompare(b.firstname);
        default:
          return 0;
      }
    });

    // If user selected ascending, reverse it
    if (sortOrder === 'asc') {
      updated.reverse();
    }

    setSortedRushees(updated);
  }, [rushees, sortField, sortOrder, searchTerm]);

  return (
    <div className="flex flex-col md:flex-row flex-grow border-b-2 border-[#a3000020] min-h-screen">
      <BroNavBar />
      <div className="flex-1 p-4">

        {/* Page Title */}
        <h1 className="text-2xl font-bold mb-4">Rush Book</h1>

        {/* SORT & SEARCH BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          {/* Search Input */}
          <div>
            <label className="font-semibold mr-2">Search (Name/Uniqname):</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder="e.g. Katemcg"
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
              <option value="likes">Likes</option>
              <option value="dislikes">Dislikes</option>
              <option value="stars">Stars</option>
              <option value="netscore">Net Score</option>
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

        {/* RUSHEE TILES IN A RESPONSIVE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
  );
}
