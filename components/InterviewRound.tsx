import React from 'react';

interface InterviewRoundProps {
  roundNumber: number;
  onRemove: () => void;
  onChange: (data: { type: string; notes: string }) => void;
}

export default function InterviewRound({ 
  roundNumber, 
  onRemove,
  onChange 
}: InterviewRoundProps) {
  return (
    <div className="relative border border-[#8b000020] rounded-lg p-6 mb-4">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
      <div className="mb-4">
        <h3 className="text-lg mb-2">Round {roundNumber} Type</h3>
        <input
          type="text"
          placeholder="e.g., Behavioral or Technical"
          className="w-full px-4 py-2 border border-[#8b000020] rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors"
          onChange={(e) => onChange({ type: e.target.value, notes: '' })}
        />
      </div>
      <div>
        <h4 className="text-gray-600 mb-2">Notes</h4>
        <textarea
          placeholder="e.g., Talked about OOP, inheritance, etc."
          className="w-full px-4 py-2 border border-[#8b000020] rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors min-h-[100px]"
          onChange={(e) => onChange({ type: '', notes: e.target.value })}
        />
      </div>
    </div>
  );
}
