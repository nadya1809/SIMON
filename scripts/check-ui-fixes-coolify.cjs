const fs = require("node:fs");

const checks = [
  {
    file: "src/components/dashboard/dashboard-frame.tsx",
    label: "Mobile sidebar solid background",
    pattern: "bg-[var(--card)]"
  },
  {
    file: "src/components/dashboard/dashboard-frame.tsx",
    label: "Mobile sidebar can scroll",
    pattern: "overflow-y-auto"
  },
  {
    file: "src/components/dashboard/dashboard-frame.tsx",
    label: "Dashboard frame prevents mobile horizontal overflow",
    pattern: "overflow-x-hidden"
  },
  {
    file: "src/components/dashboard/topbar.tsx",
    label: "Topbar uses compact mobile spacing",
    pattern: "px-3 py-3"
  },
  {
    file: "src/components/ui/dialog.tsx",
    label: "Dialog respects dynamic mobile viewport",
    pattern: "100dvh"
  },
  {
    file: "src/components/ui/module-filters.tsx",
    label: "Filter actions stack neatly on mobile",
    pattern: "flex-col gap-3 sm:flex-row"
  },
  {
    file: "src/components/ui/form-dialog-actions.tsx",
    label: "Form dialog actions stack on mobile",
    pattern: "flex-col-reverse"
  },
  {
    file: "src/components/ui/table.tsx",
    label: "Tables contain horizontal scroll on mobile",
    pattern: "overscroll-x-contain"
  },
  {
    file: "src/components/users/user-management.tsx",
    label: "User password visibility state",
    pattern: "isPasswordVisible"
  },
  {
    file: "src/components/users/user-management.tsx",
    label: "User password show button",
    pattern: "Tampilkan password"
  }
];

const results = checks.map((check) => {
  const content = fs.readFileSync(check.file, "utf8");

  return {
    check: check.label,
    ok: content.includes(check.pattern)
  };
});

console.table(results);

const failed = results.filter((result) => !result.ok);

if (failed.length) {
  console.error("Ada UI fix yang belum masuk ke source hasil deploy.");
  process.exitCode = 1;
}
