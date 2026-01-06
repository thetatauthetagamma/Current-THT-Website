import BroNavBar from "@/components/BroNavBar";
import React, { useState, useEffect } from 'react';
import supabase from '@/supabase';
import Select from 'react-select';
import RushAdminPanel from '@/components/admin/RushAdminPanel';
import BLPairAdder from '@/components/admin/BLPairAdder';
import PledgeCommitteeManager from "@/components/admin/PledgeCommitteeUpdate";
import PledgeAdminPanel from '@/components/admin/PledgeAdminPanel';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button
} from '@nextui-org/react';


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
/*This page is shown to "admin" of our org. On it different  */
export default function Admin() {
  const [userID, setUserID] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>({});
  const [pledges, setPledges] = useState<PledgeData[]>([]);
  const [bulkSignoffLoading, setBulkSignoffLoading] = useState<{ [uniqname: string]: boolean }>({});
  const [signOffEveryoneLoading, setSignOffEveryoneLoading] = useState<boolean>(false);
  const [rollEditingMode, setRollEditingMode] = useState<boolean>(false);
  const [eboardEditingMode, setEboardEditingMode] = useState<boolean>(false);
  const [rushEditingMode, setRushEditingMode] = useState<boolean>(false);
  const [pledgeEditingMode, setPledgeEditingMode] = useState<boolean>(false);
  
  // Dropdown states for categories
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({
    rush: false,
    pnms: false,
    brotherhood: false,
    system: false,
  });
  const [eboardMembers, setEboardMembers] = useState<BrotherData[]>([]);
  const [newRoleNames, setNewRoleNames] = useState<{ [key: string]: string }>({});
  const [searchResults, setSearchResults] = useState<BrotherData[]>([]);
  const [selectedBrother, setSelectedBrother] = useState<{ [key: string]: string }>({});
  const [selectedRole, setSelectedRole] = useState<string>('');
  const eboardPositions = [
    { role: "regent", label: "Regent" },
    { role: "vice", label: "Vice Regent" },
    { role: "scribe", label: "Scribe" },
    { role: "treasurer", label: "Treasurer" },
    { role: "corsec", label: "Corsec" },
  ];

  interface PledgeData {
    uniqname: string;
    firstname: string;
    lastname: string;
    major: string;
    year: number;
    pronouns: string;
    email: string;
    phone: string;
    linkedin: string;
    roll: string;
    classes: string[];
    archivedclasses: string[];
  }


  const handleRoleNameChange = (role: string, newName: string) => {
    setNewRoleNames((prevNames) => ({
      ...prevNames,
      [role]: newName,
    }));
    console.log(newRoleNames);
  };

  const fetchEboardMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('Brothers')
        .select('userid, firstname, lastname, adminrole')
        .in('adminrole', ['regent', 'vice', 'scribe', 'treasurer', 'corsec', 'parents', 'academic', 'rush']);

      if (error) {
        throw error;
      }

      if (data) {
        setEboardMembers(data as BrotherData[]);
        console.log(eboardMembers);
      }
    } catch (error) {
      console.error('Error fetching EBoard members:', error);
    }
  };

  const handleArchiveClasses = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to archive all of the current classes? Please only do this at the end of a semester.'
    );

    if (isConfirmed) {
      try {
        const { data: allBrothers, error: brothersError } = await supabase
          .from('Brothers')
          .select('userid, classes, archivedclasses');

        if (brothersError) {
          throw brothersError;
        }

        for (const brother of allBrothers) {
          if (brother.classes && brother.classes.length > 0) {
            const updatedClasses = [...(brother.archivedclasses || []), ...brother.classes];

            await supabase
              .from('Brothers')
              .update({
                classes: [],
                archivedclasses: updatedClasses
              })
              .eq('userid', brother.userid);
          }
        }

        console.log('Brother classes archived successfully');

        const { data: allPledges, error: pledgeError } = await supabase
          .from('Pledges')
          .select('uniqname, classes, archivedclasses');

        if (pledgeError) {
          throw pledgeError;
        }

        for (const pledge of allPledges) {
          if (pledge.classes && pledge.classes.length > 0) {
            const updatedClasses = [...(pledge.archivedclasses || []), ...pledge.classes];

            await supabase
              .from('Pledges')
              .update({
                classes: [],
                archivedclasses: updatedClasses
              })
              .eq('uniqname', pledge.uniqname);
          }
        }

        console.log('Pledge classes archived successfully');

      } catch (error) {
        console.error('Error archiving classes:', error);
      }
    }
  };

  const handleSearchChange = async (inputValue: string) => {
    if (inputValue.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Brothers')
        .select('userid, firstname, lastname')
        .or(`firstname.ilike.%${inputValue}%,lastname.ilike.%${inputValue}%`);

      if (error) {
        throw error;
      }

      if (data) {
        setSearchResults(data as BrotherData[]);
      }
    } catch (error) {
      console.error('Error searching brothers:', error);
    }
  };

  const handleInputChange = (newValue: string, role: string) => {
    handleSearchChange(newValue);
  };

  const handleSelectChange = (selectedOption: any, role: string) => {
    setSelectedBrother((prevSelected) => ({
      ...prevSelected,
      [role]: selectedOption ? selectedOption.value : ''
    }));
    setNewRoleNames((prevNames) => ({
      ...prevNames,
      [role]: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleEboardSubmit = async (adminRole: string) => {
    try {
      const newMemberUpdate = { adminrole: adminRole };
      console.log(newRoleNames[adminRole]);
      await supabase
        .from('Brothers')
        .update([newMemberUpdate])
        .eq('userid', newRoleNames[adminRole]);

      for (const member of eboardMembers) {
        if (member.adminrole === adminRole && (member.userid != newRoleNames[adminRole])) {
          await supabase
            .from('Brothers')
            .update({ adminrole: null })
            .eq('userid', member.userid);
        }
      }
      fetchEboardMembers();

      console.log('EBoard updated successfully');
    } catch (error) {
      console.error('Error updating EBoard:', error);
    }
  };

  useEffect(() => {
    fetchPledges();
    fetchEboardMembers();
  }, []);

  const handleRoleNumberChange = (uniqname: string, roleNumber: string) => {
    setRoleAssignments((prevAssignments) => ({
      ...prevAssignments,
      [uniqname]: roleNumber,
    }));
    console.log(roleAssignments);
    console.log(pledges)
  };

  const fetchPledges = async () => {
    try {
      const { data, error } = await supabase.from('Pledges').select('uniqname, firstname, lastname, major, year, pronouns, email, phone, linkedin, classes, archivedclasses');

      if (error) {
        throw error;
      }

      if (data) {
        setPledges(data as PledgeData[]);
      }
    } catch (error) {
      console.error('Error fetching pledges:', error);
    }
  };

  const handleInitiatePledges = () => {
    setRollEditingMode(true);
  };

  const handleCancel = () => {
    setRollEditingMode(false);
  };
  const handleCancelEBoard = () => {
    setEboardEditingMode(false);
  };
  const handleUpdateEboard = () => {
    setEboardEditingMode(true);
  }

  const handleSubmit = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to initiate these pledges? All of their pledging data will be deleted and they will be added to the brother database.'
    )
    

    if (isConfirmed) {
      try {
        const assignedPledges = pledges.filter((pledge) => roleAssignments[pledge.uniqname]);
        console.log(assignedPledges)
        const brothersData: BrotherData[] = assignedPledges.map((pledge) => ({
          userid: pledge.uniqname,
          firstname: pledge.firstname,
          lastname: pledge.lastname,
          major: pledge.major,
          year: pledge.year,
          pronouns: pledge.pronouns,
          email: pledge.email,
          phone: pledge.phone,
          linkedin: pledge.linkedin,
          roll: roleAssignments[pledge.uniqname],
          adminrole: '',
          classes: pledge.classes,
          archivedclasses: pledge.archivedclasses,
        }));

        const { data, error } = await supabase.from('Brothers').upsert(brothersData);

        if (error) {
          throw error;
        }

        console.log('Brothers added successfully:', data);
        for (const pledge of assignedPledges) {
          await handleDeletePledge(pledge.uniqname);
        }
      } catch (error) {
        console.error('Error adding brothers:', error);
      } finally {
        setRollEditingMode(false);
      }
    }
  };

  const getAllRequirementIds = async () => {
    // Fetch BOTH PD and COMMITTEE requirements separately to ensure we get both
    const [pdResult, committeeResult] = await Promise.all([
      supabase
        .from('Pledge_Requirements_Update')
        .select('id, type')
        .eq('type', 'PD'),
      supabase
        .from('Pledge_Requirements_Update')
        .select('id, type')
        .eq('type', 'COMMITTEE')
    ])

    if (pdResult.error) throw pdResult.error
    if (committeeResult.error) throw committeeResult.error

    const pdReqs = pdResult.data || []
    const committeeReqs = committeeResult.data || []

    // Merge both lists and extract all IDs
    const allReqs = [...pdReqs, ...committeeReqs]
    const allIds = Array.from(
      new Set(
        allReqs
          .map((r: any) => Number(r.id))
          .filter((n: number) => Number.isFinite(n))
      )
    ).sort((a, b) => a - b) // Sort for consistency

    return { allIds, pdReqs, committeeReqs }
  }

  const handleSignOffAllRequirementsForPledge = async (uniqname: string) => {
    const isConfirmed = window.confirm(
      `Sign off ALL PD + Committee requirements for ${uniqname}? This will overwrite their current signoffs list.`
    )
    if (!isConfirmed) return

    setBulkSignoffLoading(prev => ({ ...prev, [uniqname]: true }))
    try {
      const { allIds, pdReqs, committeeReqs } = await getAllRequirementIds()

      const { error: updateError } = await supabase
        .from('Pledges')
        .update({ signoffs: allIds })
        .eq('uniqname', uniqname)

      if (updateError) throw updateError

      alert(
        `Signed off ALL requirements for ${uniqname}.\n` +
          `PD requirements: ${pdReqs.length}\n` +
          `Committee requirements: ${committeeReqs.length}\n` +
          `Total written: ${allIds.length}`
      )
      fetchPledges() // Refresh the list
    } catch (err) {
      console.error('Error signing off all requirements:', err)
      alert('Error signing off all requirements. Check console for details.')
    } finally {
      setBulkSignoffLoading(prev => ({ ...prev, [uniqname]: false }))
    }
  }

  const handleSignOffEveryoneForEverything = async () => {
    const isConfirmed = window.confirm(
      `Sign off ALL PNMs for ALL PD + Committee requirements? This will overwrite all current signoffs lists.\n\n` +
      `This will affect ${pledges.length} PNM(s). Are you sure?`
    )
    if (!isConfirmed) return

    setSignOffEveryoneLoading(true)
    try {
      const { allIds, pdReqs, committeeReqs } = await getAllRequirementIds()

      // Update all pledges in parallel
      const updatePromises = pledges.map(pledge =>
        supabase
          .from('Pledges')
          .update({ signoffs: allIds })
          .eq('uniqname', pledge.uniqname)
      )

      const results = await Promise.all(updatePromises)
      const errors = results.filter(r => r.error)

      if (errors.length > 0) {
        throw new Error(`${errors.length} pledge(s) failed to update`)
      }

      alert(
        `Signed off ALL requirements for ALL PNMs.\n` +
          `PD requirements: ${pdReqs.length}\n` +
          `Committee requirements: ${committeeReqs.length}\n` +
          `Total written per PNM: ${allIds.length}\n` +
          `PNMs affected: ${pledges.length}`
      )
      fetchPledges() // Refresh the list
    } catch (err) {
      console.error('Error signing off everyone:', err)
      alert('Error signing off everyone. Check console for details.')
    } finally {
      setSignOffEveryoneLoading(false)
    }
  }

  const handleDeletePledge = async (uniqname: string) => {
    const { data, error } = await supabase
      .from('Pledges')
      .delete()
      .eq('uniqname', uniqname)

    if (error) {
      console.error('Error deleting pledge:', error.message)
    } else {
      fetchPledges()
    }
    // Clear signoffs array (no separate table to delete from)
    await supabase
      .from('Pledges')
      .update({ signoffs: [] })
      .eq('uniqname', uniqname)

  }

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession()
        if (session) {
          setUserID(session.data.session?.user.email || '')
        }
      } catch (error) { }
    }

    fetchSession()
    console.log("Fidget Fam == Best Fam")
  }, [])

  useEffect(() => {
    const fetchAdminRole = async () => {
      try {
        const { data, error } = await supabase
          .from('Brothers')
          .select('adminrole')
          .eq('email', userID)

        if (error) {
          throw error
        }
        if (data) {
          setAdminRole(data[0].adminrole);
        }
      } catch (error) { }
    }

    fetchAdminRole();
  }, [userID])

  const handleRoleChange = (selectedOption: any) => {
    setSelectedRole(selectedOption ? selectedOption.value : '');
  };

  const currentMember = eboardMembers.find(member => member.adminrole === selectedRole);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Helper component for collapsible category sections
  const CategorySection = ({ 
    title, 
    category, 
    children, 
    requiredRoles 
  }: { 
    title: string; 
    category: string; 
    children: React.ReactNode;
    requiredRoles: string[];
  }) => {
    const hasAccess = requiredRoles.some(role => adminRole === role);
    if (!hasAccess) return null;

    const isOpen = openCategories[category];

    return (
      <div className="bg-white rounded-md shadow-md p-4 w-full">
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-xl font-semibold text-[#8B0000]">
            {title}
          </h2>
          <svg
            className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020] min-h-screen">
      <BroNavBar isPledge={false} />

      <div className="flex-1 p-4">
        <h1 className="text-3xl font-bold text-[#8B0000] mb-4">
          Admin Dashboard
        </h1>
        <h2 className="text-gray-600 mb-6">Your admin role: <span className="font-semibold">{adminRole}</span></h2>
        
        <div className="flex flex-col space-y-4 w-full max-w-6xl">
          {/* RUSH CATEGORY */}
          <CategorySection 
            title="Rush Management" 
            category="rush"
            requiredRoles={['rush', 'dev', 'regent', 'vice']}
          >
            <div className="space-y-4">
              {(adminRole === 'rush' || adminRole === 'dev') && (
                <RushAdminPanel />
              )}
              {(adminRole === 'regent' || adminRole === 'dev' || adminRole === 'vice' || adminRole === 'rush') && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {rushEditingMode ? (
                    <RushCommitteeManager setRushEditingMode={setRushEditingMode} />
                  ) : (
                    <button 
                      onClick={() => setRushEditingMode(true)} 
                      className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800 w-full"
                    >
                      Update Rush Committee
                    </button>
                  )}
                </div>
              )}
            </div>
          </CategorySection>

          {/* PNMs CATEGORY */}
          <CategorySection 
            title="PNM Management" 
            category="pnms"
            requiredRoles={['regent', 'dev', 'scribe', 'parent']}
          >
            <div className="space-y-4">
              {(adminRole === 'dev' || adminRole === 'parent') && (
                <PledgeAdminPanel />
              )}
              {(adminRole === 'regent' || adminRole === 'dev' || adminRole === 'scribe' || adminRole === 'parent') && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {pledgeEditingMode ? (
                    <PledgeCommitteeManager setPledgeEditingMode={setPledgeEditingMode} />
                  ) : (
                    <button 
                      onClick={() => setPledgeEditingMode(true)} 
                      className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800 w-full"
                    >
                      Update PNM Committee
                    </button>
                  )}
                </div>
              )}
              {(adminRole === 'regent' || adminRole === 'dev' || adminRole === 'scribe' || adminRole === 'parent') && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-2 text-[#8B0000]">
                    Bulk Signoffs
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Sign off PNMs for all PD + Committee requirements (writes all requirement IDs to `Pledges.signoffs`).
                  </p>
                  
                  {/* Sign off everyone button */}
                  <div className="mb-4">
                    <button
                      onClick={handleSignOffEveryoneForEverything}
                      disabled={signOffEveryoneLoading || pledges.length === 0}
                      className={`font-bold py-2 px-4 rounded w-full ${
                        signOffEveryoneLoading || pledges.length === 0
                          ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                          : 'bg-[#8B0000] text-white hover:bg-red-800'
                      }`}
                    >
                      {signOffEveryoneLoading 
                        ? `Signing off ${pledges.length} PNM(s)…` 
                        : `Sign off ALL PNMs for ALL Requirements (${pledges.length} PNM(s))`}
                    </button>
                  </div>

                  {/* Individual PNM dropdown */}
                  {pledges.length === 0 ? (
                    <div className="text-sm text-gray-500">No PNMs found.</div>
                  ) : (
                    <div className="mt-4">
                      <Dropdown placement="bottom-start">
                        <DropdownTrigger>
                          <Button 
                            variant="bordered" 
                            className="w-full sm:w-auto bg-white border-gray-300 hover:bg-gray-50"
                          >
                            Sign off Individual PNM
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu 
                          aria-label="Select PNM to sign off"
                          className="max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-md"
                          itemClasses={{
                            base: "data-[hover=true]:bg-gray-100",
                          }}
                        >
                          {pledges.map((pledge) => (
                            <DropdownItem
                              key={`bulk-signoff-${pledge.uniqname}`}
                              onClick={() => handleSignOffAllRequirementsForPledge(pledge.uniqname)}
                              isDisabled={!!bulkSignoffLoading[pledge.uniqname]}
                              className={bulkSignoffLoading[pledge.uniqname] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              textValue={`${pledge.firstname} ${pledge.lastname} (${pledge.uniqname})`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {pledge.firstname} {pledge.lastname} ({pledge.uniqname})
                                </span>
                                {bulkSignoffLoading[pledge.uniqname] && (
                                  <span className="text-xs text-gray-500 ml-2">Signing off…</span>
                                )}
                              </div>
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  )}
                </div>
              )}
              {(adminRole === 'regent' || adminRole === 'dev' || adminRole === 'scribe' || adminRole === 'parent') && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {rollEditingMode ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-[#8B0000]">
                        Assign Roll Numbers to New Members
                      </h3>
                      <div className="space-y-3 mb-4">
                        {pledges.map((pledge) => (
                          <div
                            key={pledge.uniqname}
                            className="flex flex-col sm:flex-row items-center gap-2"
                          >
                            <p className="sm:w-2/5 font-semibold">
                              {pledge.firstname} {pledge.lastname}
                            </p>
                            <input
                              type="text"
                              placeholder="Assign Roll Number"
                              className="border-2 border-[#8b000070] rounded p-2 flex-1"
                              onChange={(e) =>
                                handleRoleNumberChange(pledge.uniqname, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCancel}
                          className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmit}
                          className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleInitiatePledges}
                      className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800 w-full"
                    >
                      Initiate Potential New Members
                    </button>
                  )}
                </div>
              )}
            </div>
          </CategorySection>

          {/* BROTHERHOOD CATEGORY */}
          <CategorySection 
            title="Brotherhood Management" 
            category="brotherhood"
            requiredRoles={['regent', 'dev', 'scribe']}
          >
            <div className="space-y-4">
              {(adminRole === 'regent' || adminRole === 'dev' || adminRole === 'scribe') && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {eboardEditingMode ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-[#8B0000]">
                        Update Eboard and Committee Heads
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        (Update yourself last to avoid losing admin access)
                      </p>
                      <div className="mb-4">
                        <Select
                          options={eboardPositions.map(({ role, label }) => ({
                            value: role,
                            label,
                          }))}
                          onChange={handleRoleChange}
                          placeholder="Select role to update"
                          isClearable
                        />
                      </div>

                      {selectedRole && (
                        <div className="mb-4">
                          <p className="mb-1 text-sm text-gray-700">
                            Current {eboardPositions.find((pos) => pos.role === selectedRole)?.label}:{' '}
                            {currentMember
                              ? `${currentMember.firstname} ${currentMember.lastname}`
                              : 'None'}
                          </p>
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="w-full sm:w-2/3">
                              <Select
                                options={searchResults.map((brother) => ({
                                  value: brother.userid,
                                  label: `${brother.firstname} ${brother.lastname}`,
                                }))}
                                onInputChange={(newValue) =>
                                  handleInputChange(newValue, selectedRole)
                                }
                                onChange={(selectedOption) =>
                                  setNewRoleNames((prev) => ({
                                    ...prev,
                                    [selectedRole]: selectedOption ? selectedOption.value : '',
                                  }))
                                }
                                placeholder={`Search new ${eboardPositions.find((pos) => pos.role === selectedRole)?.label}`}
                                isClearable
                              />
                            </div>
                            <button
                              onClick={() => handleEboardSubmit(selectedRole)}
                              className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800 w-full sm:w-auto"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleCancelEBoard}
                        className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded w-full sm:w-auto"
                      >
                        Done Updating
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleUpdateEboard}
                      className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800 w-full"
                    >
                      Update EBoard
                    </button>
                  )}
                </div>
              )}
              {(adminRole === 'dev' || adminRole === 'parent') && (
                <BLPairAdder />
              )}
            </div>
          </CategorySection>

          {/* SYSTEM CATEGORY */}
          <CategorySection 
            title="System Settings" 
            category="system"
            requiredRoles={['academic', 'dev']}
          >
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-[#8B0000]">
                Archive Classes
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Archive all current classes for all brothers and pledges. This should only be done at the end of a semester.
              </p>
              <button
                onClick={handleArchiveClasses}
                className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800 w-full"
              >
                Archive Classes
              </button>
            </div>
          </CategorySection>
        </div>
      </div>
    </div>
  );
}



function RushCommitteeManager({
  setRushEditingMode,
}: {
  setRushEditingMode: (value: boolean) => void;
}) {
  const [rushCommittee, setRushCommittee] = useState<BrotherData[]>([]);
  const [searchResults, setSearchResults] = useState<BrotherData[]>([]);
  const [selectedBrother, setSelectedBrother] = useState<BrotherData | null>(null);

  // Fetch Rush Committee Members
  const fetchRushCommittee = async () => {
    try {
      const { data, error } = await supabase
        .from("Brothers")
        .select("userid, firstname, lastname, adminrole")
        .eq("adminrole", "rush");

      if (error) throw error;
      if (data) setRushCommittee(data as BrotherData[]);
    } catch (error) {
      console.error("Error fetching rush committee:", error);
    }
  };

  // Remove Rush Member
  const removeRushMember = async (userid: string) => {
    const confirmRemove = window.confirm(
      "Are you sure you want to remove this member from the Rush Committee?"
    );
    if (!confirmRemove) return;

    try {
      const { error } = await supabase
        .from("Brothers")
        .update({ adminrole: null })
        .eq("userid", userid);

      if (error) throw error;
      setRushCommittee((prev) => prev.filter((member) => member.userid !== userid));
    } catch (error) {
      console.error("Error removing rush member:", error);
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

  // Add Rush Member
  const addRushMember = async () => {
    if (!selectedBrother) return alert("Please select a brother to add!");

    try {
      const { error } = await supabase
        .from("Brothers")
        .update({ adminrole: "rush" })
        .eq("userid", selectedBrother.userid);

      if (error) throw error;

      setRushCommittee((prev) => [...prev, selectedBrother]);
      setSelectedBrother(null);
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding rush member:", error);
    }
  };

  // Fetch Committee Members on Mount
  useEffect(() => {
    fetchRushCommittee();
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold text-[#8B0000] mb-4">Rush Committee Management</h3>

      {/* Current Members */}
      <div className="mb-4">
        <h4 className="text-md font-semibold mb-2">Current Rush Committee</h4>
        {rushCommittee.length > 0 ? (
          <ul className="space-y-2">
            {rushCommittee.map((member) => (
              <li key={member.userid} className="flex justify-between items-center border-b border-gray-200 py-2">
                <span className="font-medium">
                  {member.firstname} {member.lastname}
                </span>
                <button
                  onClick={() => removeRushMember(member.userid)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-bold"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No members in the Rush Committee.</p>
        )}
      </div>

      {/* Add New Member */}
      <div className="mb-4">
        <h4 className="text-md font-semibold mb-2">Add Brother to Rush</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
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
          </div>
          <button
            onClick={addRushMember}
            className="bg-[#8B0000] text-white font-bold px-4 py-2 rounded hover:bg-red-800"
          >
            Add to Rush Committee
          </button>
        </div>
      </div>

      {/* Done Updating Button */}
      <button
        onClick={() => setRushEditingMode(false)}
        className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded w-full"
      >
        Done Updating Rush Committee
      </button>
    </div>
  );
}