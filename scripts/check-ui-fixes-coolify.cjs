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
