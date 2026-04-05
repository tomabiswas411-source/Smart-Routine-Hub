import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Seed library links (can be called from browser)
export async function GET() {
  try {
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
        url: 'https://drive.google.com/drive/folders/1NVqjlf3UgySV8Z2lgbwmWS-vkmD0W3hY?usp=drive_link',
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

    let created = 0;
    let updated = 0;

    for (const link of libraryLinks) {
      if (!link.url) continue;

      const existing = await db.libraryLink.findUnique({
        where: {
          degree_semester: {
            degree: link.degree,
            semester: link.semester,
          },
        },
      });

      if (existing) {
        await db.libraryLink.update({
          where: { id: existing.id },
          data: {
            url: link.url,
            title: link.title,
            isActive: true,
          },
        });
        updated++;
      } else {
        await db.libraryLink.create({
          data: {
            degree: link.degree,
            semester: link.semester,
            url: link.url,
            title: link.title,
            isActive: true,
          },
        });
        created++;
      }
    }

    const allLinks = await db.libraryLink.findMany({
      orderBy: [{ degree: 'asc' }, { semester: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      message: `Library links seeded: ${created} created, ${updated} updated`,
      total: allLinks.length,
      data: allLinks,
    });
  } catch (error) {
    console.error("Error seeding library links:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed library links: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
