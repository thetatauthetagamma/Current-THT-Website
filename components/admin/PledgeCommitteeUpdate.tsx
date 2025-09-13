import { useState, useEffect } from 'react';
import supabase from '@/supabase';
import Select from 'react-select';


interface RoleAssignments {
  [key: string]: string;
}

interface BrotherData {
  userid: string;
  firstname: string;
  lastname: string;
  major: string;
  year: number;
  pronouns: string;
  email: string;
  phone: string;
  linkedin: string;
  roll: string;
  adminrole: string;
  classes: string[];
  archivedclasses: string[];
}


export default function PledgeCommitteeManager({
    setPledgeEditingMode,
  }: {
    setPledgeEditingMode: (value: boolean) => void;
  }) {
    const [pledgeCommittee, setPledgeCommittee] = useState<BrotherData[]>([]);
    const [searchResults, setSearchResults] = useState<BrotherData[]>([]);
    const [selectedBrother, setSelectedBrother] = useState<BrotherData | null>(null);
  
    // Fetch Pledge Committee Members
    const fetchPledgeCommittee = async () => {
      try {
        const { data, error } = await supabase
          .from("Brothers")
          .select("userid, firstname, lastname, adminrole")
          .eq("adminrole", "parent");
  
        if (error) throw error;
        if (data) setPledgeCommittee(data as BrotherData[]);
      } catch (error) {
        console.error("Error fetching pledge committee:", error);
      }
    };
  
    // Remove Pledge Member
    const removePledgeMember = async (userid: string) => {
      const confirmRemove = window.confirm(
        "Are you sure you want to remove this member from the Pledge Committee?"
      );
      if (!confirmRemove) return;
  
      try {
        const { error } = await supabase
          .from("Brothers")
          .update({ adminrole: null })
          .eq("userid", userid);
  
        if (error) throw error;
        setPledgeCommittee((prev) => prev.filter((member) => member.userid !== userid));
      } catch (error) {
        console.error("Error removing pledge member:", error);
      }
    };
  
    // Search for Brothers (Exclude Current Rush Members)
    const handleSearchChange = (inputValue: string) => {
      if (inputValue.length < 2) {
        setSearchResults([]);
        return;
      }
    
      // Fetch data asynchronously but don't return a promise to the Select component
      fetchBrothers(inputValue);
    };
    
    const fetchBrothers = async (query: string) => {
      try {
        const { data, error } = await supabase
          .from("Brothers")
          .select("userid, firstname, lastname, major, year, pronouns, email, phone, linkedin, roll, adminrole, classes, archivedclasses")
          .or(`firstname.ilike.%${query}%,lastname.ilike.%${query}%`)
          
    
        if (error) throw error;
        setSearchResults(data as BrotherData[] || []);
      } catch (error) {
        console.error("Error searching brothers:", error);
      }
    };
  
    // Add pledge Member
    const addPledgeMember = async () => {
      if (!selectedBrother) return alert("Please select a brother to add!");
  
      try {
        const { error } = await supabase
          .from("Brothers")
          .update({ adminrole: "parent" })
          .eq("userid", selectedBrother.userid);
  
        if (error) throw error;
  
        setPledgeCommittee((prev) => [...prev, selectedBrother]);
        setSelectedBrother(null);
        setSearchResults([]);
      } catch (error) {
        console.error("Error adding pledge member:", error);
      }
    };
  
    // Fetch Committee Members on Mount
    useEffect(() => {
      fetchPledgeCommittee();
    }, []);
  
    return (
      <div className="bg-white rounded-md shadow-md p-4">
        <h2 className="text-xl font-semibold text-[#8B0000] mb-2">PNM Committee Management</h2>
  
        {/* Current Members */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Current PNM Committee</h3>
          {pledgeCommittee.length > 0 ? (
            <ul>
              {pledgeCommittee.map((member) => (
                <li key={member.userid} className="flex justify-between items-center border-b py-2">
                  <span>
                    {member.firstname} {member.lastname}
                  </span>
                  <button
                    onClick={() => removePledgeMember(member.userid)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No members in the PNM Committee.</p>
          )}
        </div>
  
        {/* Add New Member */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Add Brother to PNM</h3>
          <Select
            options={searchResults.map((brother) => ({
              value: brother.userid,
              label: `${brother.firstname} ${brother.lastname}`,
            }))}
            onInputChange={(newValue) => handleSearchChange(newValue)}
            onChange={(selectedOption) => {
              const brother = searchResults.find((b) => b.userid === selectedOption?.value);
              setSelectedBrother(brother || null);
            }}
            placeholder="Search for a brother..."
            isClearable
          />
          <button
            onClick={addPledgeMember}
            className="bg-green-600 text-white px-3 py-2 mt-2 rounded hover:bg-green-700"
          >
            Add to PNM Committee
          </button>
        </div>
  
        {/* Done Updating Button */}
        <button
          onClick={() => setPledgeEditingMode(false)}
          className="bg-gray-400 text-white px-3 py-2 mt-4 rounded hover:bg-gray-500"
        >
          Done Updating PNM Committee
        </button>
      </div>
    );
  }