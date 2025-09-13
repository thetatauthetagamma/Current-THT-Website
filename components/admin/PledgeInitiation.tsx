import { useState } from 'react';

interface PledgeData {
  uniqname: string;
  firstname: string;
  lastname: string;
}

interface Props {
  pledges: PledgeData[];
  handleSubmit: (roleAssignments: { [key: string]: string }) => void;
}

export default function PledgeInitiation({ pledges, handleSubmit }: Props) {
  const [roleAssignments, setRoleAssignments] = useState<{ [key: string]: string }>({});

  const handleRoleNumberChange = (uniqname: string, roleNumber: string) => {
    setRoleAssignments((prev) => ({ ...prev, [uniqname]: roleNumber }));
  };

  const handleConfirmSubmit = () => {
    if (window.confirm('Are you sure you want to initiate these PNMs?')) {
      handleSubmit(roleAssignments);
    }
  };

  return (
    <div className="bg-[#fff0f0] p-4 rounded-md flex flex-col m-2 items-center">
      <h1 className="text-lg font-bold">Assign Roll Numbers:</h1>
      {pledges.map((pledge) => (
        <div key={pledge.uniqname} className="flex flex-col sm:flex-row m-4 w-full justify-center">
          <p className="m-2 text-end">{`${pledge.firstname} ${pledge.lastname}`}</p>
          <input
            type="text"
            placeholder="Roll Number"
            className="border-2 border-[#8b000070] text-center"
            onChange={(e) => handleRoleNumberChange(pledge.uniqname, e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleConfirmSubmit} className="bg-[#8b000070] text-white p-2 rounded-md">Submit</button>
    </div>
  );
}
