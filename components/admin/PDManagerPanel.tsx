import { FormEvent, useCallback, useEffect, useState } from "react";
import Select from "react-select";
import supabase from "@/supabase";

interface PDManager {
  uniqname: string;
  created_at: string;
}

interface Brother {
  userid: string;
  firstname: string;
  lastname: string;
}

interface BrotherOption {
  value: string;
  label: string;
}

export default function PDManagerPanel() {
  const [managers, setManagers] = useState<PDManager[]>([]);
  const [brothers, setBrothers] = useState<Brother[]>([]);
  const [selectedBrother, setSelectedBrother] =
    useState<BrotherOption | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchManagers = useCallback(async () => {
    setIsLoading(true);
    const [managerResponse, brotherResponse] = await Promise.all([
      supabase
        .from("PDManagers")
        .select("uniqname, created_at")
        .order("uniqname", { ascending: true }),
      supabase
        .from("Brothers")
        .select("userid, firstname, lastname")
        .order("firstname", { ascending: true }),
    ]);

    if (managerResponse.error || brotherResponse.error) {
      setMessage(
        managerResponse.error?.message ||
          brotherResponse.error?.message ||
          "Unable to load PD managers.",
      );
    } else {
      setManagers(managerResponse.data || []);
      setBrothers(brotherResponse.data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const addManager = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!selectedBrother) {
      setMessage("Select a brother to add.");
      return;
    }

    const normalizedUniqname = selectedBrother.value;
    setIsSaving(true);
    const { error } = await supabase
      .from("PDManagers")
      .insert({ uniqname: normalizedUniqname });

    if (error) {
      setMessage(
        error.code === "23505"
          ? `${normalizedUniqname} is already a PD manager.`
          : error.message,
      );
    } else {
      setSelectedBrother(null);
      setMessage(`${normalizedUniqname} can now manage the PD page.`);
      await fetchManagers();
    }
    setIsSaving(false);
  };

  const removeManager = async (managerUniqname: string) => {
    if (
      !window.confirm(
        `Remove ${managerUniqname} from the list of PD managers?`,
      )
    ) {
      return;
    }

    setMessage("");
    const { error } = await supabase
      .from("PDManagers")
      .delete()
      .eq("uniqname", managerUniqname);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`${managerUniqname} can no longer manage the PD page.`);
      await fetchManagers();
    }
  };

  const managerUniqnames = new Set(
    managers.map((manager) => manager.uniqname.toLowerCase()),
  );
  const brotherOptions = brothers
    .filter((brother) => !managerUniqnames.has(brother.userid.toLowerCase()))
    .map((brother) => ({
      value: brother.userid.toLowerCase(),
      label: `${brother.firstname} ${brother.lastname} (${brother.userid})`,
    }));

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-lg font-semibold text-[#8B0000]">
        Professional Development Managers
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        These brothers can add, edit, and remove PD resources and committee
        profiles.
      </p>

      <form
        onSubmit={addManager}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex-1">
          <Select
            options={brotherOptions}
            value={selectedBrother}
            onChange={(option) => setSelectedBrother(option)}
            placeholder="Search brothers by name or uniqname..."
            isClearable
            isSearchable
            noOptionsMessage={() => "No matching brothers"}
          />
        </div>
        <button
          type="submit"
          disabled={isSaving || !selectedBrother}
          className="rounded bg-[#8B0000] px-4 py-2 font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Adding..." : "Add Manager"}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading PD managers...</p>
        ) : managers.length === 0 ? (
          <p className="text-sm text-gray-500">No PD managers added yet.</p>
        ) : (
          managers.map((manager) => (
            <div
              key={manager.uniqname}
              className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2"
            >
              <span className="font-medium">
                {(() => {
                  const brother = brothers.find(
                    (item) =>
                      item.userid.toLowerCase() ===
                      manager.uniqname.toLowerCase(),
                  );
                  return brother
                    ? `${brother.firstname} ${brother.lastname} (${manager.uniqname})`
                    : manager.uniqname;
                })()}
              </span>
              <button
                type="button"
                onClick={() => removeManager(manager.uniqname)}
                className="rounded px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
