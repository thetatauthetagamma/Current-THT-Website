import { safeLinkedInUrl } from '@/utils/alumni'
import { FormEvent, useCallback, useEffect, useState } from "react";
import BroNavBar from "@/components/BroNavBar";
import supabase from "@/supabase";

interface PDResource {
  id: number;
  title: string;
  url: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

interface PDCommitteeMember {
  id: number;
  name: string;
  major: string;
  email: string;
  phone: string;
  linkedin_url: string | null;
  areas_of_expertise: string[] | string | null;
  sort_order: number;
  created_at: string;
}

interface ResourceFormState {
  title: string;
  url: string;
  description: string;
  sortOrder: string;
}

interface MemberFormState {
  name: string;
  major: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  areasOfExpertise: string;
  sortOrder: string;
}

const emptyResourceForm: ResourceFormState = {
  title: "",
  url: "",
  description: "",
  sortOrder: "0",
};

const emptyMemberForm: MemberFormState = {
  name: "",
  major: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  areasOfExpertise: "",
  sortOrder: "0",
};

const inputClasses =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]";

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const getExpertiseAreas = (
  value: PDCommitteeMember["areas_of_expertise"],
): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).map((area) => area.trim()).filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsedValue: unknown = JSON.parse(value);
    if (Array.isArray(parsedValue)) {
      return parsedValue.map(String).map((area) => area.trim()).filter(Boolean);
    }
  } catch {
    // Fall back to parsing comma-separated or Postgres array text.
  }

  return value
    .replace(/^\{|\}$/g, "")
    .split(",")
    .map((area) => area.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
};

export default function ProfessionalDevelopment() {
  const [resources, setResources] = useState<PDResource[]>([]);
  const [members, setMembers] = useState<PDCommitteeMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [showResourceManager, setShowResourceManager] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [resourceForm, setResourceForm] =
    useState<ResourceFormState>(emptyResourceForm);
  const [memberForm, setMemberForm] =
    useState<MemberFormState>(emptyMemberForm);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(
    null,
  );
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [resourceMessage, setResourceMessage] = useState("");
  const [memberMessage, setMemberMessage] = useState("");
  const [isSavingResource, setIsSavingResource] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");

    const [resourceResponse, memberResponse] = await Promise.all([
      supabase
        .from("PDResources")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true }),
      supabase
        .from("PDCommitteeMembers")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

    if (resourceResponse.error || memberResponse.error) {
      setFetchError(
        resourceResponse.error?.message ||
          memberResponse.error?.message ||
          "Unable to load Professional Development information.",
      );
    }

    setResources(resourceResponse.data || []);
    setMembers(memberResponse.data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  useEffect(() => {
    const checkManagerAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const email = session?.user?.email;

      if (!email) return;
      const uniqname = email.split("@")[0].toLowerCase();

      const { data, error } = await supabase
        .from("PDManagers")
        .select("uniqname")
        .eq("uniqname", uniqname)
        .single();

      if (!error && data) {
        setCanManage(true);
      }
    };

    checkManagerAccess();
  }, []);

  const resetResourceForm = () => {
    setResourceForm(emptyResourceForm);
    setEditingResourceId(null);
  };

  const resetMemberForm = () => {
    setMemberForm(emptyMemberForm);
    setEditingMemberId(null);
  };

  const handleResourceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResourceMessage("");

    const title = resourceForm.title.trim();
    const url = resourceForm.url.trim();

    if (!title || !url) {
      setResourceMessage("Title and URL are required.");
      return;
    }

    if (!isValidUrl(url)) {
      setResourceMessage("Enter a valid URL beginning with http:// or https://.");
      return;
    }

    setIsSavingResource(true);
    const payload = {
      title,
      url,
      description: resourceForm.description.trim() || null,
      sort_order: Number(resourceForm.sortOrder) || 0,
    };

    const { error } = editingResourceId
      ? await supabase
          .from("PDResources")
          .update(payload)
          .eq("id", editingResourceId)
      : await supabase.from("PDResources").insert(payload);

    if (error) {
      setResourceMessage(error.message);
    } else {
      setResourceMessage(
        editingResourceId ? "Resource updated." : "Resource added.",
      );
      resetResourceForm();
      await fetchPageData();
    }

    setIsSavingResource(false);
  };

  const handleMemberSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMemberMessage("");

    const name = memberForm.name.trim();
    const major = memberForm.major.trim();
    const email = memberForm.email.trim();
    const phone = memberForm.phone.trim();
    const linkedinUrl = memberForm.linkedinUrl.trim();

    if (!name || !major || !email || !phone) {
      setMemberMessage("Name, major, email, and phone are required.");
      return;
    }

    if (linkedinUrl && !isValidUrl(linkedinUrl)) {
      setMemberMessage(
        "Enter a valid LinkedIn URL beginning with http:// or https://.",
      );
      return;
    }

    setIsSavingMember(true);
    const payload = {
      name,
      major,
      email,
      phone,
      linkedin_url: linkedinUrl || null,
      areas_of_expertise: memberForm.areasOfExpertise
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean),
      sort_order: Number(memberForm.sortOrder) || 0,
    };

    const { error } = editingMemberId
      ? await supabase
          .from("PDCommitteeMembers")
          .update(payload)
          .eq("id", editingMemberId)
      : await supabase.from("PDCommitteeMembers").insert(payload);

    if (error) {
      setMemberMessage(error.message);
    } else {
      setMemberMessage(
        editingMemberId ? "Committee member updated." : "Committee member added.",
      );
      resetMemberForm();
      await fetchPageData();
    }

    setIsSavingMember(false);
  };

  const editResource = (resource: PDResource) => {
    setEditingResourceId(resource.id);
    setResourceForm({
      title: resource.title,
      url: resource.url,
      description: resource.description || "",
      sortOrder: String(resource.sort_order ?? 0),
    });
    setResourceMessage("");
    setShowResourceManager(true);
  };

  const editMember = (member: PDCommitteeMember) => {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      major: member.major,
      email: member.email,
      phone: member.phone,
      linkedinUrl: member.linkedin_url || "",
      areasOfExpertise: getExpertiseAreas(member.areas_of_expertise).join(", "),
      sortOrder: String(member.sort_order ?? 0),
    });
    setMemberMessage("");
    setShowMemberManager(true);
  };

  const deleteResource = async (resource: PDResource) => {
    if (!window.confirm(`Delete "${resource.title}"?`)) return;

    const { error } = await supabase
      .from("PDResources")
      .delete()
      .eq("id", resource.id);

    if (error) {
      setResourceMessage(error.message);
      return;
    }

    setResourceMessage("Resource deleted.");
    if (editingResourceId === resource.id) resetResourceForm();
    await fetchPageData();
  };

  const deleteMember = async (member: PDCommitteeMember) => {
    if (!window.confirm(`Delete ${member.name} from the PD committee?`)) return;

    const { error } = await supabase
      .from("PDCommitteeMembers")
      .delete()
      .eq("id", member.id);

    if (error) {
      setMemberMessage(error.message);
      return;
    }

    setMemberMessage("Committee member deleted.");
    if (editingMemberId === member.id) resetMemberForm();
    await fetchPageData();
  };

  return (
    <div className="flex min-h-screen flex-grow flex-col border-b-2 border-[#a3000020] md:flex-row">
      <BroNavBar isPledge={false} />

      <main className="flex-grow bg-gray-100 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Professional Development
            </h1>
          </div>

          {fetchError && (
            <div
              role="alert"
              className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              We could not load all PD information: {fetchError}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">
              Loading Professional Development resources...
            </div>
          ) : (
            <div className="space-y-10">
              <section aria-labelledby="resources-heading">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2
                      id="resources-heading"
                      className="text-2xl font-bold text-gray-900"
                    >
                      PD Resources
                    </h2>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowResourceManager((isOpen) => !isOpen)
                      }
                      className="shrink-0 rounded-md bg-[#8b0000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6f0000]"
                    >
                      {showResourceManager ? "Close" : "Manage"}
                    </button>
                  )}
                </div>

                {resources.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
                    No PD resources have been added yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <article
                        key={resource.id}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#8b000050] hover:shadow"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[#8b0000] hover:underline"
                            >
                              {resource.title}{" "}
                              <span aria-hidden="true">↗</span>
                            </a>
                            {resource.description && (
                              <p className="mt-1 text-sm leading-6 text-gray-600">
                                {resource.description}
                              </p>
                            )}
                          </div>
                          {canManage && (
                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => editResource(resource)}
                                className="rounded px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteResource(resource)}
                                className="rounded px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {canManage && showResourceManager && (
                  <form
                    onSubmit={handleResourceSubmit}
                    className="mt-4 rounded-lg border border-[#8b000030] bg-white p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-[#8b0000]">
                      {editingResourceId ? "Edit resource" : "Add a resource"}
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium text-gray-700">
                        Title
                        <input
                          required
                          className={inputClasses}
                          value={resourceForm.title}
                          onChange={(event) =>
                            setResourceForm({
                              ...resourceForm,
                              title: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        URL
                        <input
                          required
                          type="url"
                          placeholder="https://"
                          className={inputClasses}
                          value={resourceForm.url}
                          onChange={(event) =>
                            setResourceForm({
                              ...resourceForm,
                              url: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                        Description
                        <textarea
                          rows={3}
                          className={inputClasses}
                          value={resourceForm.description}
                          onChange={(event) =>
                            setResourceForm({
                              ...resourceForm,
                              description: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Display order
                        <input
                          type="number"
                          className={inputClasses}
                          value={resourceForm.sortOrder}
                          onChange={(event) =>
                            setResourceForm({
                              ...resourceForm,
                              sortOrder: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    {resourceMessage && (
                      <p className="mt-3 text-sm text-gray-700">
                        {resourceMessage}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        type="submit"
                        disabled={isSavingResource}
                        className="rounded-md bg-[#8b0000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6f0000] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingResource
                          ? "Saving..."
                          : editingResourceId
                            ? "Update resource"
                            : "Add resource"}
                      </button>
                      {editingResourceId && (
                        <button
                          type="button"
                          onClick={resetResourceForm}
                          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </section>

              <section aria-labelledby="committee-heading">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2
                      id="committee-heading"
                      className="text-2xl font-bold text-gray-900"
                    >
                      PD Committee
                    </h2>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setShowMemberManager((isOpen) => !isOpen)}
                      className="shrink-0 rounded-md bg-[#8b0000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6f0000]"
                    >
                      {showMemberManager ? "Close" : "Manage"}
                    </button>
                  )}
                </div>

                {members.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
                    No PD committee members have been added yet.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {members.map((member) => {
                      const expertiseAreas = getExpertiseAreas(
                        member.areas_of_expertise,
                      );

                      return (
                        <article
                          key={member.id}
                          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                        >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {member.name}
                            </h3>
                            <p className="text-sm font-medium text-[#8b0000]">
                              {member.major}
                            </p>
                          </div>
                          {canManage && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => editMember(member)}
                                className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMember(member)}
                                className="rounded px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                          <a
                            href={`mailto:${member.email}`}
                            className="text-gray-700 hover:text-[#8b0000] hover:underline"
                          >
                            {member.email}
                          </a>
                          <a
                            href={`tel:${member.phone.replace(/[^\d+]/g, "")}`}
                            className="text-gray-700 hover:text-[#8b0000] hover:underline"
                          >
                            {member.phone}
                          </a>
                          {safeLinkedInUrl(member.linkedin_url) && (
                            <a
                              href={safeLinkedInUrl(member.linkedin_url) ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-[#8b0000] hover:underline"
                            >
                              LinkedIn <span aria-hidden="true">↗</span>
                            </a>
                          )}
                        </div>

                        {expertiseAreas.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {expertiseAreas.map((area) => (
                              <span
                                key={area}
                                className="rounded-full bg-[#8b000012] px-3 py-1 text-xs font-medium text-[#8b0000]"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                        </article>
                      );
                    })}
                  </div>
                )}

                {canManage && showMemberManager && (
                  <form
                    onSubmit={handleMemberSubmit}
                    className="mt-4 rounded-lg border border-[#8b000030] bg-white p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-[#8b0000]">
                      {editingMemberId
                        ? "Edit committee member"
                        : "Add a committee member"}
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium text-gray-700">
                        Name
                        <input
                          required
                          className={inputClasses}
                          value={memberForm.name}
                          onChange={(event) =>
                            setMemberForm({
                              ...memberForm,
                              name: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Major
                        <input
                          required
                          className={inputClasses}
                          value={memberForm.major}
                          onChange={(event) =>
                            setMemberForm({
                              ...memberForm,
                              major: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Email
                        <input
                          required
                          type="email"
                          className={inputClasses}
                          value={memberForm.email}
                          onChange={(event) =>
                            setMemberForm({
                              ...memberForm,
                              email: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Phone
                        <input
                          required
                          type="tel"
                          className={inputClasses}
                          value={memberForm.phone}
                          onChange={(event) =>
                            setMemberForm({
                              ...memberForm,
                              phone: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        LinkedIn URL
                        <input
                          type="url"
                          placeholder="https://"
                          className={inputClasses}
                          value={memberForm.linkedinUrl}
                          onChange={(event) =>
                            setMemberForm({
                              ...memberForm,
                              linkedinUrl: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Display order
                        <input
                          type="number"
                          className={inputClasses}
                          value={memberForm.sortOrder}
                          onChange={(event) =>
                            setMemberForm({
                              ...memberForm,
                              sortOrder: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                        Areas of expertise
                        <input
                          className={inputClasses}
                          placeholder="Consulting, resumes, interviewing"
                          value={memberForm.areasOfExpertise}
                          onChange={(event) =>
                            setMemberForm({
                              ...memberForm,
                              areasOfExpertise: event.target.value,
                            })
                          }
                        />
                        <span className="mt-1 block text-xs font-normal text-gray-500">
                          Separate each area with a comma.
                        </span>
                      </label>
                    </div>
                    {memberMessage && (
                      <p className="mt-3 text-sm text-gray-700">
                        {memberMessage}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        type="submit"
                        disabled={isSavingMember}
                        className="rounded-md bg-[#8b0000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6f0000] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingMember
                          ? "Saving..."
                          : editingMemberId
                            ? "Update member"
                            : "Add member"}
                      </button>
                      {editingMemberId && (
                        <button
                          type="button"
                          onClick={resetMemberForm}
                          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
