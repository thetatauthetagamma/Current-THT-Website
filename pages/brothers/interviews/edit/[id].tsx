import BroNavBar from "@/components/BroNavBar";
import InterviewHeader from "@/components/InterviewHeader";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import supabase from "@/supabase";
import InterviewRound from "@/components/InterviewRound";

interface FormData {
  name: string;
  major: string;
  company: string;
  position: string;
  employmentType: "Internship" | "Full Time";
  numInterviewRounds: string;
  overallExperience: string;
  gotJob: "Y" | "N";
  tips: string;
  interviewDate: string;
  rounds: Array<{
    type: string;
    notes: string;
  }>;
}

export default function EditInterview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, boolean>>>({});

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    const [{ data: sessionData }, { data: interviewData, error: interviewError }] =
      await Promise.all([
        supabase.auth.getSession(),
        supabase.from("InterviewDetails").select("*").eq("id", id).single(),
      ]);

    if (interviewError || !interviewData) {
      console.error("Error fetching interview:", interviewError);
      setLoading(false);
      return;
    }

    const sessionEmail = sessionData.session?.user.email ?? "";
    if (sessionEmail.toLowerCase() !== interviewData.email.toLowerCase()) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    setFormData({
      name: interviewData.name ?? "",
      major: interviewData.major ?? "",
      company: interviewData.company ?? "",
      position: interviewData.position ?? "",
      employmentType: interviewData.employment_type === "Full Time" ? "Full Time" : "Internship",
      numInterviewRounds: interviewData.num_interviews?.toString() ?? "",
      overallExperience: interviewData.overall_experience ?? "",
      gotJob: interviewData.got_job === "Y" ? "Y" : "N",
      tips: interviewData.tips ?? "",
      interviewDate: interviewData.first_interview_date ?? "",
      rounds:
        Array.isArray(interviewData.interview_rounds) && interviewData.interview_rounds.length > 0
          ? interviewData.interview_rounds
          : [{ type: "", notes: "" }],
    });
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleRoundChange = (index: number, data: { type: string; notes: string }) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const newRounds = [...prev.rounds];
      newRounds[index] = { ...newRounds[index], ...data };
      return { ...prev, rounds: newRounds };
    });
  };

  const addRound = () => {
    setFormData((prev) => (prev ? { ...prev, rounds: [...prev.rounds, { type: "", notes: "" }] } : prev));
  };

  const removeRound = (index: number) => {
    setFormData((prev) =>
      prev ? { ...prev, rounds: prev.rounds.filter((_, i) => i !== index) } : prev
    );
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    const newErrors: Partial<Record<keyof FormData, boolean>> = {};
    let isValid = true;

    const requiredFields: (keyof FormData)[] = [
      "name", "major", "company", "position", "numInterviewRounds", "overallExperience",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = true;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !validateForm()) return;

    try {
      const { error } = await supabase
        .from("InterviewDetails")
        .update({
          name: formData.name,
          major: formData.major,
          company: formData.company,
          position: formData.position,
          employment_type: formData.employmentType,
          num_interviews: parseInt(formData.numInterviewRounds, 10),
          overall_experience: formData.overallExperience,
          got_job: formData.gotJob,
          interview_rounds: formData.rounds,
          tips: formData.tips,
          first_interview_date: formData.interviewDate || null,
        })
        .eq("id", id);

      if (error) {
        console.error("Error updating interview:", error);
        alert(`Failed to update interview: ${error.message}`);
        return;
      }

      router.push(`/brothers/interviews/${id}`);
    } catch (err) {
      console.error("Error:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex md:flex-row flex-col min-h-screen">
        <BroNavBar isPledge={false} />
        <div className="flex-grow flex items-center justify-center" style={{ backgroundColor: "#f5f3dc" }}>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex md:flex-row flex-col min-h-screen">
        <BroNavBar isPledge={false} />
        <div className="flex-grow flex items-center justify-center" style={{ backgroundColor: "#f5f3dc" }}>
          <div className="text-center">
            <p className="text-gray-700 font-medium">You don&apos;t have permission to edit this entry.</p>
            <p className="text-gray-500 text-sm mt-1">Only the original submitter can edit it.</p>
            <button
              onClick={() => router.push(`/brothers/interviews/${id}`)}
              className="mt-4 px-4 py-2 bg-[#8b0000] text-white rounded-lg hover:bg-[#a00000] transition-colors text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex md:flex-row flex-col min-h-screen">
        <BroNavBar isPledge={false} />
        <div className="flex-grow flex items-center justify-center" style={{ backgroundColor: "#f5f3dc" }}>
          <p className="text-gray-600">Interview not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex md:flex-row flex-col min-h-screen">
      <BroNavBar isPledge={false} />
      <div className="flex-grow" style={{ backgroundColor: "#f5f3dc" }}>
        <InterviewHeader />

        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-8 text-[#8b0000]">Edit Interview</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">General Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., John Doe"
                    className={`w-full px-4 py-2 border ${errors.name ? "border-red-500" : "border-[#8b000020]"} rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors`}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">Name is required</p>}
                </div>

                <div>
                  <label className="block mb-1">Major *</label>
                  <input
                    type="text"
                    name="major"
                    placeholder="e.g., Computer Science"
                    className={`w-full px-4 py-2 border ${errors.major ? "border-red-500" : "border-[#8b000020]"} rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors`}
                    value={formData.major}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.major && <p className="text-red-500 text-sm mt-1">Major is required</p>}
                </div>

                <div>
                  <label className="block mb-1">Company *</label>
                  <input
                    type="text"
                    name="company"
                    placeholder="e.g., Theta Tau"
                    className={`w-full px-4 py-2 border ${errors.company ? "border-red-500" : "border-[#8b000020]"} rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors`}
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.company && <p className="text-red-500 text-sm mt-1">Company is required</p>}
                </div>

                <div>
                  <label className="block mb-1">Position *</label>
                  <input
                    type="text"
                    name="position"
                    placeholder="e.g., Software Engineer"
                    className={`w-full px-4 py-2 border ${errors.position ? "border-red-500" : "border-[#8b000020]"} rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors`}
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.position && <p className="text-red-500 text-sm mt-1">Position is required</p>}
                </div>

                <div>
                  <label className="block mb-1">First Interview Date</label>
                  <input
                    type="date"
                    name="interviewDate"
                    className="w-full px-4 py-2 border border-[#8b000020] rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors"
                    value={formData.interviewDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block mb-1">Employment Type *</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="employmentType"
                        value="Internship"
                        checked={formData.employmentType === "Internship"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Internship
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="employmentType"
                        value="Full Time"
                        checked={formData.employmentType === "Full Time"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Full Time
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Number of Interview Rounds *</label>
                  <input
                    type="number"
                    name="numInterviewRounds"
                    placeholder="e.g., 3"
                    className={`w-full px-4 py-2 border ${errors.numInterviewRounds ? "border-red-500" : "border-[#8b000020]"} rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors`}
                    value={formData.numInterviewRounds}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.numInterviewRounds && <p className="text-red-500 text-sm mt-1">Number of rounds is required</p>}
                </div>

                <div>
                  <label className="block mb-1">Overall Interview Experience *</label>
                  <textarea
                    name="overallExperience"
                    placeholder="Describe your overall interview experience..."
                    className={`w-full px-4 py-2 border ${errors.overallExperience ? "border-red-500" : "border-[#8b000020]"} rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors min-h-[100px]`}
                    value={formData.overallExperience}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.overallExperience && <p className="text-red-500 text-sm mt-1">Overall experience is required</p>}
                </div>

                <div>
                  <label className="block mb-1">Tips for Future Candidates</label>
                  <textarea
                    name="tips"
                    placeholder="Share any tips, advice, or things you wish you knew before the interview..."
                    className="w-full px-4 py-2 border border-[#8b000020] rounded-lg focus:outline-none focus:border-[#8b0000] transition-colors min-h-[100px]"
                    value={formData.tips}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block mb-1">Got the job? *</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gotJob"
                        value="Y"
                        checked={formData.gotJob === "Y"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gotJob"
                        value="N"
                        checked={formData.gotJob === "N"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Interview Rounds (Optional)</h2>
              <p className="text-gray-600 mb-6">Add details about each interview round.</p>

              {formData.rounds.map((round, index) => (
                <InterviewRound
                  key={index}
                  roundNumber={index + 1}
                  onRemove={() => removeRound(index)}
                  onChange={(data) => handleRoundChange(index, data)}
                  initialType={round.type}
                  initialNotes={round.notes}
                />
              ))}

              <button
                type="button"
                onClick={addRound}
                className="mt-4 px-4 py-2 bg-white border border-[#8b000020] rounded-lg hover:bg-gray-50 transition-colors"
              >
                + Add Another Round
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push(`/brothers/interviews/${id}`)}
                className="px-6 py-2 bg-white border border-[#8b000020] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#8b0000] text-white rounded-lg hover:bg-[#a00000] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
