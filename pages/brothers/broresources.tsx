import { useState, useEffect } from "react";
import supabase from "@/supabase";
import BroNavBar from "@/components/BroNavBar";

interface ResourceData {
  id: number;
  title: string;
  link: string;
  broResource: boolean;
}

export default function BroResources() {
  const [adminRole, setAdminRole] = useState("");
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fields for adding/editing
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [linkInput, setLinkInput] = useState("");

  const [editingMode, setEditingMode] = useState(false);

  // --- 1) Check if user is an admin on mount
  useEffect(() => {
    const getSessionAndAdmin = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const email = session?.user?.email || "";

        if (!email) return;

        // Query Brothers to find their adminrole
        const { data, error } = await supabase
          .from("Brothers")
          .select("adminrole")
          .eq("email", email)
          .single();

        if (error) {
          console.error("Error fetching admin role:", error);
          return;
        }
        if (data?.adminrole) {
          setAdminRole(data.adminrole);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    getSessionAndAdmin();
    console.log("Fidget Fam == Best Fam")
  }, []);

  // --- 2) Fetch resources (only broResource = true)
  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("Resources")
        .select("*")
        .eq("broResource", true);

      if (error) {
        setFetchError(error.message);
        console.error("Error fetching resources:", error);
      } else {
        setResources(data || []);
        setFetchError(null);
      }
    } catch (err: any) {
      setFetchError(err.message);
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // --- 3) Admin-only: add or edit resource
  const handleAddOrEditResource = async () => {
    if (!titleInput || !linkInput) {
      alert("Please fill in both title and link.");
      return;
    }

    try {
      if (editingResourceId) {
        // EDIT
        const { error } = await supabase
          .from("Resources")
          .update({ title: titleInput, link: linkInput })
          .eq("id", editingResourceId);

        if (error) throw error;
      } else {
        // ADD
        const { error } = await supabase.from("Resources").insert([
          {
            title: titleInput,
            link: linkInput,
            broResource: true, // This page is only for broResource = true
          },
        ]);
        if (error) throw error;
      }

      setTitleInput("");
      setLinkInput("");
      setEditingResourceId(null);
      fetchResources();
    } catch (error) {
      console.error("Error adding/editing resource:", error);
      alert("Error adding/editing resource. Check console.");
    }
  };

  // --- 4) Admin-only: delete resource
  const handleDeleteResource = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this resource?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("Resources").delete().eq("id", id);
      if (error) throw error;

      fetchResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  // Start editing a resource
  const beginEdit = (res: ResourceData) => {
    setEditingResourceId(res.id);
    setTitleInput(res.title);
    setLinkInput(res.link);
    setEditingMode(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingResourceId(null);
    setTitleInput("");
    setLinkInput("");
  };

  return (
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020] min-h-screen">
      <BroNavBar isPledge={false} />
      
      <div className="flex-grow p-4 bg-gray-100">
        <h1 className="font-bold text-4xl py-4">Resources</h1>

        {/* Existing resource links (visible to all Brothers) */}
        {fetchError && <p className="text-red-600 mb-4">Error: {fetchError}</p>}
        <div className="space-y-4 mb-8">
          {resources.map((res) => (
            <div key={res.id} className="p-4 bg-white rounded shadow flex flex-col sm:flex-row sm:items-center justify-between">
              <a
                href={res.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mb-2 sm:mb-0"
              >
                {res.title}
              </a>
              {/* Only show delete/edit for certain admin roles */}
              {(adminRole === "dev" || adminRole === "parent" || adminRole === "regent" || adminRole ==="vice" || adminRole === "scribe" || adminRole === "treasurer") && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => beginEdit(res)}
                    className="px-3 py-1 bg-yellow-400 text-black rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteResource(res.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Admin-only: toggle a Resource Manager section */}
        {(adminRole === "dev" || adminRole === "parent" || adminRole === "webhead") && (
          <div className="bg-white rounded-md shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#8B0000]">
                {editingResourceId ? "Edit Resource" : "Add New Resource"}
              </h2>
              {/* Toggle entire form if you want a separate editing mode: */}
              <button
                onClick={() => setEditingMode(!editingMode)}
                className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
              >
                {editingMode ? "Cancel" : "Manage Resources"}
              </button>
            </div>
            
            {editingMode && (
              <div>
                <label className="block mb-2">
                  Title:
                  <input
                    type="text"
                    className="border rounded ml-2 p-1 w-full sm:w-1/2"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                  />
                </label>
                <label className="block mb-4">
                  Link:
                  <input
                    type="url"
                    className="border rounded ml-2 p-1 w-full sm:w-1/2"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                  />
                </label>

                <div className="space-x-2">
                  <button
                    onClick={handleAddOrEditResource}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                  >
                    {editingResourceId ? "Update Resource" : "Add Resource"}
                  </button>
                  {editingResourceId && (
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
