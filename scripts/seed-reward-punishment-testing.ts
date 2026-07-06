import { spawnSync } from "node:child_process";

const steps = [
  {
    label: "Seed assessment 3 bulan",
    command: "pnpm",
    args: ["seed:three-month-assessments"]
  },
  {
    label: "Generate rekomendasi testing",
    command: "pnpm",
    args: ["seed:generated-recommendations"]
  }
];

async function main() {
  for (const step of steps) {
    console.log(`\n==> ${step.label}`);

    const result = spawnSync(step.command, step.args, {
      stdio: "inherit",
      shell: true
    });

    if (result.status !== 0) {
      throw new Error(`${step.label} gagal dijalankan.`);
    }
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        message:
          "Seed lengkap testing Evaluasi, Reward, dan Punishment selesai dijalankan."
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
