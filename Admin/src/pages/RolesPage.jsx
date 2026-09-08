import { useEffect, useMemo, useState } from "react";
import {
  LuCheck,
  LuPlus,
  LuSearch,
  LuShieldCheck,
  LuUserPlus,
  LuUsers,
  LuX,
} from "react-icons/lu";
import {
  assignAdminRole,
  createAdminRole,
  getRolesData,
  updateRolePermissions,
} from "../services/adminApi";

const permissionActions = ["view", "create", "edit", "delete", "approve", "export"];
const permissionDomains = [
  "users",
  "roles",
  "companies",
  "jobs",
  "candidates",
  "applications",
  "reports",
  "settings",
];

const defaultRoleForm = {
  name: "",
  scope: "Custom",
  description: "",
};

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState(defaultRoleForm);
  const [assignForm, setAssignForm] = useState({ userKey: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await getRolesData();
      setRoles(response.data.roles);
      setAssignableUsers(response.data.assignableUsers);
      setMetrics(response.data.metrics);
      setSelectedRoleId((current) => current || response.data.roles[0]?.id || "");
    } catch (requestError) {
      setPageError(requestError.message || "Unable to load roles.");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRoles = useMemo(() => {
    return roles.filter((role) =>
      `${role.name} ${role.scope} ${role.description}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [roles, searchQuery]);

  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) || roles[0] || null;

  const assignOptions = assignableUsers.map((user) => ({
    value: `${user.source}:${user.id}`,
    label: `${user.name} - ${user.email}`,
  }));

  const handleCreateRole = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setActionError("");

    try {
      await createAdminRole(roleForm);
      setRoleForm(defaultRoleForm);
      setIsRoleModalOpen(false);
      await loadRoles();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to create role.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignRole = async (event) => {
    event.preventDefault();

    if (!selectedRole || !assignForm.userKey) {
      return;
    }

    const [source, userId] = assignForm.userKey.split(":");
    setIsSaving(true);
    setActionError("");

    try {
      await assignAdminRole({
        id: selectedRole.id,
        source,
        userId,
      });
      setAssignForm({ userKey: "" });
      setIsAssignModalOpen(false);
      await loadRoles();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to assign role.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = async (domain, action) => {
    if (!selectedRole) {
      return;
    }

    const nextPermissions = {
      ...selectedRole.permissions,
      [domain]: {
        ...selectedRole.permissions[domain],
        [action]: !selectedRole.permissions[domain][action],
      },
    };

    setActionError("");
    setRoles((currentRoles) =>
      currentRoles.map((role) =>
        role.id === selectedRole.id
          ? { ...role, permissions: nextPermissions }
          : role,
      ),
    );

    try {
      await updateRolePermissions({
        id: selectedRole.id,
        permissions: nextPermissions,
      });
      await loadRoles();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to update permissions.");
      await loadRoles();
    }
  };

  if (isLoading) {
    return <PageState title="Loading role management..." />;
  }

  if (pageError) {
    return <PageState title={pageError} error />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Role templates", value: metrics?.roleTemplates ?? 0 },
          { label: "Assigned members", value: metrics?.assignedMembers ?? 0 },
          { label: "Editable permissions", value: metrics?.editablePermissions ?? 0 },
          { label: "Protected roles", value: metrics?.protectedRoles ?? 0 },
        ].map((metric) => (
          <article
            key={metric.label}
            className="group flex min-h-[170px] flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-lime-300 hover:shadow-[0_22px_55px_rgba(132,204,22,0.14)]"
          >
            <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Role templates
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Define and assign roles
              </h2>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition-colors duration-200 focus-within:border-lime-300 focus-within:bg-white">
              <LuSearch size={18} className="text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search role templates"
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="mt-5 space-y-3">
            {filteredRoles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`w-full rounded-[22px] border p-5 text-left transition-all duration-200 ${
                  role.id === selectedRoleId
                    ? "border-lime-300 bg-lime-50 shadow-[0_18px_45px_rgba(132,204,22,0.12)]"
                    : "border-slate-200 bg-slate-50 hover:border-lime-300 hover:bg-lime-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{role.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {role.description}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {role.scope}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <LuUsers size={14} />
                  {role.members.length} assigned members
                </div>
              </button>
            ))}
          </div>
        </article>

        {selectedRole ? (
          <div className="space-y-6">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Selected role
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {selectedRole.name}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {selectedRole.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setActionError("");
                      setIsAssignModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-lime-300 hover:bg-lime-50"
                  >
                    <LuUserPlus size={16} />
                    Assign role
                  </button>
                  <button
                    onClick={() => {
                      setActionError("");
                      setIsRoleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#20498f]"
                  >
                    <LuPlus size={16} />
                    Create role
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <InfoCard label="Scope" value={selectedRole.scope} />
                <InfoCard label="Assigned members" value={selectedRole.members.length} />
                <InfoCard
                  label="Enabled permissions"
                  value={countEnabledPermissions(selectedRole.permissions)}
                />
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2">
                <LuShieldCheck size={16} className="text-lime-500" />
                <h2 className="text-lg font-bold text-slate-900">
                  Permission matrix editor
                </h2>
              </div>

              <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
                <div className="grid grid-cols-[1.2fr_repeat(6,0.7fr)] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span>Domain</span>
                  {permissionActions.map((action) => (
                    <span key={action} className="text-center">
                      {action}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-slate-200">
                  {permissionDomains.map((domain) => (
                    <div
                      key={domain}
                      className="grid min-h-[78px] grid-cols-[1.2fr_repeat(6,0.7fr)] items-center gap-3 px-4 py-4 transition-colors duration-200 hover:bg-lime-50/30"
                    >
                      <span className="font-semibold capitalize text-slate-900">
                        {domain}
                      </span>
                      {permissionActions.map((action) => (
                        <div key={action} className="flex justify-center">
                          <TogglePill
                            checked={selectedRole.permissions[domain][action]}
                            onClick={() => togglePermission(domain, action)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2">
                <LuUsers size={16} className="text-lime-500" />
                <h2 className="text-lg font-bold text-slate-900">
                  Assigned members
                </h2>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {selectedRole.members.map((member) => (
                  <div
                    key={`${member.source}-${member.userId}`}
                    className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 transition-colors duration-200 hover:border-lime-300 hover:bg-lime-50/40"
                  >
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        ) : null}
      </section>

      {isRoleModalOpen && (
        <RoleModal
          roleForm={roleForm}
          setRoleForm={setRoleForm}
          onClose={() => {
            setRoleForm(defaultRoleForm);
            setIsRoleModalOpen(false);
          }}
          onSubmit={handleCreateRole}
          isSaving={isSaving}
          error={actionError}
        />
      )}

      {isAssignModalOpen && selectedRole ? (
        <AssignRoleModal
          assignForm={assignForm}
          setAssignForm={setAssignForm}
          options={assignOptions}
          selectedRole={selectedRole}
          onClose={() => setIsAssignModalOpen(false)}
          onSubmit={handleAssignRole}
          isSaving={isSaving}
          error={actionError}
        />
      ) : null}
    </div>
  );
}

function PageState({ title, error = false }) {
  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-7xl items-center justify-center">
      <div
        className={`rounded-[28px] border px-8 py-7 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
          error ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
        }`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Roles & Permissions
        </p>
        <p className="mt-3 text-lg font-semibold text-slate-900">{title}</p>
      </div>
    </div>
  );
}

function countEnabledPermissions(permissions) {
  return Object.values(permissions).reduce(
    (total, domain) => total + Object.values(domain).filter(Boolean).length,
    0,
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5 transition-colors duration-200 hover:border-lime-300 hover:bg-lime-50/40">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TogglePill({ checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-14 items-center rounded-full px-1 transition ${
        checked ? "bg-lime-400" : "bg-slate-200"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#163060] shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {checked ? <LuCheck size={14} /> : null}
      </span>
    </button>
  );
}

function RoleModal({
  roleForm,
  setRoleForm,
  onClose,
  onSubmit,
  isSaving,
  error,
}) {
  return (
    <ModalShell title="Create role" onClose={onClose}>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field
          label="Role name"
          value={roleForm.name}
          onChange={(value) =>
            setRoleForm((current) => ({ ...current, name: value }))
          }
        />
        <Field
          label="Scope"
          type="select"
          value={roleForm.scope}
          options={["Custom", "Global", "Operational", "Regional", "Workspace"]}
          onChange={(value) =>
            setRoleForm((current) => ({ ...current, scope: value }))
          }
        />
        <Field
          label="Description"
          type="textarea"
          value={roleForm.description}
          onChange={(value) =>
            setRoleForm((current) => ({ ...current, description: value }))
          }
        />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-lime-300 hover:bg-lime-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#20498f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LuPlus size={16} />
            {isSaving ? "Saving..." : "Save role"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AssignRoleModal({
  assignForm,
  setAssignForm,
  selectedRole,
  options,
  onClose,
  onSubmit,
  isSaving,
  error,
}) {
  return (
    <ModalShell title={`Assign ${selectedRole.name} role`} onClose={onClose}>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field
          label="Select user"
          type="select"
          value={assignForm.userKey}
          options={["", ...options.map((option) => option.value)]}
          optionLabels={Object.fromEntries(
            options.map((option) => [option.value, option.label]),
          )}
          onChange={(value) =>
            setAssignForm((current) => ({ ...current, userKey: value }))
          }
        />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-lime-300 hover:bg-lime-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#20498f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LuUserPlus size={16} />
            {isSaving ? "Assigning..." : "Assign role"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 px-4 py-4 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Role workflow
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-lime-300 hover:bg-lime-50"
          >
            <LuX size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  options = [],
  optionLabels = {},
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {optionLabels[option] || option || "Select an option"}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white"
        />
      )}
    </label>
  );
}
