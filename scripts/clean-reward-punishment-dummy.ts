import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DUMMY_TAG = "[DUMMY-RP-TEST]";

async function main() {
  const dummyAssessments = await prisma.dailyAssessment.findMany({
    where: {
      notes: {
        contains: DUMMY_TAG
      }
    },
    select: {
      id: true
    }
  });

  const assessmentIds = dummyAssessments.map((item) => item.id);

  if (!assessmentIds.length) {
    console.log(
      JSON.stringify(
        {
          success: true,
          message: "Tidak ada dummy assessment reward/punishment yang perlu dihapus."
        },
        null,
        2
      )
    );
    return;
  }

  await prisma.assessmentScore.deleteMany({
    where: {
      dailyAssessmentId: {
        in: assessmentIds
      }
    }
  });

  await prisma.dailyAssessment.deleteMany({
    where: {
      id: {
        in: assessmentIds
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        deletedAssessments: assessmentIds.length,
        message: "Dummy assessment reward/punishment berhasil dibersihkan."
      },
      null,
      2
    )
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
