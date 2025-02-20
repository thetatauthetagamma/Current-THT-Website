import BroNavBar from "@/components/BroNavBar";
import { useState, useEffect } from 'react';
import supabase from '@/supabase';
import Select from 'react-select';
import RushAdminPanel from '@/components/admin/RushAdminPanel';
interface RoleAssignments {
  [key: string]: string;
}
/*This page is shown to "admin" of our org. On it different  */
export default function Admin() {
  const [userID, setUserID] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>({});
  const [pledges, setPledges] = useState<PledgeData[]>([]);
  const [rollEditingMode, setRollEditingMode] = useState<boolean>(false);
  const [eboardEditingMode, setEboardEditingMode] = useState<boolean>(false);
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
  };

  const fetchPledges = async () => {
    try {
      const { data, error } = await supabase.from('Pledges').select('uniqname, firstname, lastname, major, year, pronouns, email, phone, linkedin');

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
    await supabase
      .from('PDSignOffs')
      .delete()
      .eq('pledge', uniqname)
    await supabase
      .from('CommitteeSignOffs')
      .delete()
      .eq('pledge', uniqname)
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

  return (
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020] min-h-screen">
      <BroNavBar isPledge={false} />

      <div className="flex-1 p-4">
        <h1 className="text-3xl font-bold text-[#8B0000] mb-4">
          Admin Dashboard
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* COLUMN 1: Rush Admin Panel (if user is rush or dev) */}
          {(adminRole === 'rush' || adminRole === 'dev') && (
            <div className="w-full lg:w-full">
              <RushAdminPanel />
            </div>
          )}

          {/* COLUMN 2: Additional Settings */}
          <div className="flex flex-col space-y-6 w-1/2">
            {/* Update Statuses (regent, scribe, dev) */}
            {(adminRole === 'regent' || adminRole === 'scribe' || adminRole === 'dev') && (
              <div className="bg-white rounded-md shadow-md p-4">
                <h2 className="text-xl font-semibold text-[#8B0000] mb-2">Update Statuses</h2>

                {/* Roll-Editing Mode */}
                {rollEditingMode ? (
                  <div className="bg-[#fff0f0] p-4 rounded-md">
                    <h3 className="text-lg font-bold mb-2">
                      Assign pledges roll numbers
                    </h3>
                    {pledges.map((pledge) => (
                      <div
                        key={pledge.uniqname}
                        className="flex flex-col sm:flex-row mb-2 w-full items-center"
                      >
                        <p className="sm:w-2/5 font-semibold">
                          {pledge.firstname} {pledge.lastname}
                        </p>
                        <input
                          type="text"
                          placeholder="Assign Roll Number"
                          className="border-2 border-[#8b000070] rounded ml-2 p-1"
                          onChange={(e) =>
                            handleRoleNumberChange(pledge.uniqname, e.target.value)
                          }
                        />
                      </div>
                    ))}
                    <div className="flex space-x-2 mt-4">
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
                    Initiate Pledges
                  </button>
                )}

                {/* Eboard Editing */}
                {eboardEditingMode ? (
                  <div className="bg-[#fff0f0] p-4 rounded-md mt-4">
                    <h3 className="text-lg font-bold mb-2">
                      Update Eboard and Committee Heads
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      (Update yourself last to avoid losing admin access)
                    </p>
                    {/* Choose Role */}
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
                        <div className="flex flex-col sm:flex-row items-center">
                          <div className="w-full sm:w-2/3 mb-2 sm:mb-0 sm:mr-2">
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
                            className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800"
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
                    className="bg-[#8B0000] text-white font-bold py-2 px-4 mt-4 rounded hover:bg-red-800 w-full"
                  >
                    Update EBoard
                  </button>
                )}
              </div>
            )}

            {/* Misc Settings (academic, dev) */}
            {(adminRole === 'academic' || adminRole === 'dev') && (
              <div className="bg-white rounded-md shadow-md p-4">
                <h2 className="text-xl font-semibold text-[#8B0000] mb-2">
                  Misc Settings
                </h2>
                <button
                  onClick={handleArchiveClasses}
                  className="bg-[#8B0000] text-white font-bold py-2 px-4 rounded hover:bg-red-800 w-full"
                >
                  Archive Classes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
