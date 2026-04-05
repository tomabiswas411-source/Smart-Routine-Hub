// Script to seed library links directly into the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const libraryLinks = [
  // M.Sc. Links
  {
    degree: 'msc',
    semester: 1,
    url: 'https://drive.google.com/drive/folders/1VceHXEDmrp9r1cUlIABu18p3Uf33NmfB?usp=drive_link',
    title: '1st Semester M.Sc.',
  },
  {
    degree: 'msc',
    semester: 2,
    url: 'https://drive.google.com/drive/folders/101yM-H-_Je9gaI-a0kb8c0tPvv0sCdLP?usp=drive_link',
    title: '2nd Semester M.Sc.',
  },
  {
    degree: 'msc',
    semester: 3,
    url: 'https://drive.google.com/drive/folders/1Mll30F1tJGwitES0wAQlJb5abPfC2nCS?usp=drive_link',
    title: '3rd Semester M.Sc.',
  },
  // B.Sc. Links
  {
    degree: 'bsc',
    semester: 1,
    url: 'https://drive.google.com/drive/folders/1l7zmdJNbk2T_MgpOCkBH_S2khxPbA42W?usp=sharing',
    title: '1st Semester B.Sc.',
  },
  {
    degree: 'bsc',
    semester: 2,
    url: 'https://drive.google.com/drive/folders/1ahuHL8DyIUFNCiS63JxTwOvkR9SHv3B7?usp=drive_link',
    title: '2nd Semester B.Sc.',
  },
  {
    degree: 'bsc',
    semester: 3,
    url: 'https://drive.google.com/drive/folders/1-vHXH9nz2fMw9Af7VwrhyjDOPyjIideD?usp=drive_link',
    title: '3rd Semester B.Sc.',
  },
  {
    degree: 'bsc',
    semester: 4,
    url: 'https://drive.google.com/drive/folders/1FHd6PMDEGgBoOC1gwrigzskaFjiXSiFN?usp=drive_link',
    title: '4th Semester B.Sc.',
  },
  {
    degree: 'bsc',
    semester: 5,
    url: 'https://drive.google.com/drive/folders/1SY-WSZzgyPVXDFqHX8FanOVXjkNGxlN_?usp=drive_link',
    title: '5th Semester B.Sc.',
  },
  {
    degree: 'bsc',
    semester: 6,
    url: 'https://drive.google.com/drive/folders/1wFirn1sbteUvygvuxFIIQrCcXme6-rwI?usp=drive_link',
    title: '6th Semester B.Sc.',
  },
  {
    degree: 'bsc',
    semester: 7,
    url: '', // Empty as per user input
    title: '7th Semester B.Sc.',
  },
  {
    degree: 'bsc',
    semester: 8,
    url: 'https://drive.google.com/drive/folders/10sCVbVJracEi448rZLUopuHbOnZSoKJc?usp=drive_link',
    title: '8th Semester B.Sc.',
  },
  // Others
  {
    degree: 'others',
    semester: 0,
    url: 'https://drive.google.com/drive/folders/1_Ag7tHC_yPkQpMSZHNDzdccx8AuLahGh?usp=drive_link',
    title: 'Others - Additional Resources',
  },
];

async function main() {
  console.log('Starting to seed library links...');
  
  for (const link of libraryLinks) {
    try {
      // Skip empty URLs except for 7th semester which should be marked as no link
      if (!link.url && link.semester !== 7) {
        console.log(`Skipping ${link.title} - no URL provided`);
        continue;
      }
      
      const existing = await prisma.libraryLink.findUnique({
        where: {
          degree_semester: {
            degree: link.degree,
            semester: link.semester,
          },
        },
      });
      
      if (existing) {
        // Update existing
        await prisma.libraryLink.update({
          where: { id: existing.id },
          data: {
            url: link.url,
            title: link.title,
            isActive: true,
          },
        });
        console.log(`Updated: ${link.title}`);
      } else {
        // Create new
        await prisma.libraryLink.create({
          data: {
            degree: link.degree,
            semester: link.semester,
            url: link.url,
            title: link.title,
            isActive: true,
          },
        });
        console.log(`Created: ${link.title}`);
      }
    } catch (error) {
      console.error(`Error processing ${link.title}:`, error);
    }
  }
  
  console.log('Library links seeding completed!');
  
  // Show all links
  const allLinks = await prisma.libraryLink.findMany({
    orderBy: [{ degree: 'asc' }, { semester: 'asc' }],
  });
  console.log('\nAll library links in database:');
  console.log(JSON.stringify(allLinks, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
