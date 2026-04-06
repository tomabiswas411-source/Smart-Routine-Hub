import { NextResponse } from "next/server";
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Course data for ICE Department - B.Sc. Program
const courses = [
  // 1st Semester
  { code: "ICE1111", name: "Introduction to Information and Communication Engineering", creditHours: 3, type: "theory", semester: 1, program: "bsc" },
  { code: "ICE1121", name: "Digital Electronics", creditHours: 3, type: "theory", semester: 1, program: "bsc" },
  { code: "ICE1122", name: "Digital Electronics Lab", creditHours: 1.5, type: "lab", semester: 1, program: "bsc" },
  { code: "PHY1191", name: "Electronics-I", creditHours: 3, type: "theory", semester: 1, program: "bsc" },
  { code: "PHY1192", name: "Electronics-I Lab", creditHours: 1.5, type: "lab", semester: 1, program: "bsc" },
  { code: "MATH1111", name: "Algebra, Trigonometry and Vector Analysis", creditHours: 3, type: "theory", semester: 1, program: "bsc" },
  { code: "CHEM1111", name: "Physical and Inorganic Chemistry", creditHours: 3, type: "theory", semester: 1, program: "bsc" },
  { code: "ENG1111", name: "Technical and Communicative English", creditHours: 2, type: "theory", semester: 1, program: "bsc" },

  // 2nd Semester
  { code: "ICE1211", name: "Electronics-II", creditHours: 3, type: "theory", semester: 2, program: "bsc" },
  { code: "ICE1212", name: "Electronics-II Lab", creditHours: 1.5, type: "lab", semester: 2, program: "bsc" },
  { code: "CSE1291", name: "Programming with C", creditHours: 3, type: "theory", semester: 2, program: "bsc" },
  { code: "CSE1292", name: "Programming with C Lab", creditHours: 1.5, type: "lab", semester: 2, program: "bsc" },
  { code: "MATH1211", name: "Differential and Integral Calculus", creditHours: 3, type: "theory", semester: 2, program: "bsc" },
  { code: "STAT1211", name: "Statistics for Engineers", creditHours: 2, type: "theory", semester: 2, program: "bsc" },
  { code: "PHY1221", name: "Electricity and Magnetism", creditHours: 3, type: "theory", semester: 2, program: "bsc" },
  { code: "ECON1211", name: "Economics", creditHours: 2, type: "theory", semester: 2, program: "bsc" },
  { code: "ICE1210", name: "Viva-Voce", creditHours: 1, type: "theory", semester: 2, program: "bsc" },

  // 3rd Semester
  { code: "ICE2111", name: "Electronics-III", creditHours: 3, type: "theory", semester: 3, program: "bsc" },
  { code: "ICE2112", name: "Electronics-III Lab", creditHours: 1.5, type: "lab", semester: 3, program: "bsc" },
  { code: "ICE2121", name: "Data Structures and Algorithms", creditHours: 3, type: "theory", semester: 3, program: "bsc" },
  { code: "ICE2122", name: "Data Structures and Algorithms Lab", creditHours: 1.5, type: "lab", semester: 3, program: "bsc" },
  { code: "EEE2191", name: "Electromagnetic Fields and Waves", creditHours: 3, type: "theory", semester: 3, program: "bsc" },
  { code: "MATH2111", name: "Matrices and Differential Equations", creditHours: 3, type: "theory", semester: 3, program: "bsc" },
  { code: "STAT2111", name: "Basic Theory of Statistics", creditHours: 2, type: "theory", semester: 3, program: "bsc" },
  { code: "ACCO2111", name: "Industrial Management and Accountancy", creditHours: 2, type: "theory", semester: 3, program: "bsc" },

  // 4th Semester
  { code: "ICE2211", name: "Cellular and Mobile Communication", creditHours: 3, type: "theory", semester: 4, program: "bsc" },
  { code: "ICE2221", name: "Signals and Systems", creditHours: 3, type: "theory", semester: 4, program: "bsc" },
  { code: "ICE2222", name: "Signals and Systems Lab", creditHours: 1.5, type: "lab", semester: 4, program: "bsc" },
  { code: "ICE2231", name: "Analog Communication and Radio-TV Engineering", creditHours: 3, type: "theory", semester: 4, program: "bsc" },
  { code: "ICE2232", name: "Analog Communication and Radio-TV Engineering Lab", creditHours: 1.5, type: "lab", semester: 4, program: "bsc" },
  { code: "MATH2221", name: "Discrete Mathematics and Numerical Methods", creditHours: 3, type: "theory", semester: 4, program: "bsc" },
  { code: "LAW2211", name: "Cyber Law and Engineering Ethics", creditHours: 2, type: "theory", semester: 4, program: "bsc" },
  { code: "ICE2210", name: "Viva-Voce", creditHours: 1, type: "theory", semester: 4, program: "bsc" },

  // 5th Semester
  { code: "ICE3111", name: "Microwave Communication and Radar", creditHours: 3, type: "theory", semester: 5, program: "bsc" },
  { code: "ICE3121", name: "Digital Signal Processing", creditHours: 3, type: "theory", semester: 5, program: "bsc" },
  { code: "ICE3122", name: "Digital Signal Processing Lab", creditHours: 1.5, type: "lab", semester: 5, program: "bsc" },
  { code: "ICE3131", name: "Object-Oriented Programming with Java", creditHours: 3, type: "theory", semester: 5, program: "bsc" },
  { code: "ICE3132", name: "Object-Oriented Programming with Java Lab", creditHours: 1.5, type: "lab", semester: 5, program: "bsc" },
  { code: "ICE3141", name: "Antenna Engineering", creditHours: 3, type: "theory", semester: 5, program: "bsc" },
  { code: "ICE3142", name: "Antenna Engineering Lab", creditHours: 1.5, type: "lab", semester: 5, program: "bsc" },
  { code: "ICE3151", name: "Software Engineering", creditHours: 3, type: "theory", semester: 5, program: "bsc" },
  { code: "ICE3152", name: "Software Engineering Lab", creditHours: 1.5, type: "lab", semester: 5, program: "bsc" },

  // 6th Semester
  { code: "ICE3211", name: "Database Management Systems", creditHours: 3, type: "theory", semester: 6, program: "bsc" },
  { code: "ICE3212", name: "Database Management Systems Lab", creditHours: 1.5, type: "lab", semester: 6, program: "bsc" },
  { code: "ICE3221", name: "Digital Communication", creditHours: 3, type: "theory", semester: 6, program: "bsc" },
  { code: "ICE3222", name: "Digital Communication Lab", creditHours: 1.5, type: "lab", semester: 6, program: "bsc" },
  { code: "ICE3231", name: "Telecommunication Engineering", creditHours: 3, type: "theory", semester: 6, program: "bsc" },
  { code: "ICE3241", name: "Artificial Intelligence and Neural Computing", creditHours: 3, type: "theory", semester: 6, program: "bsc" },
  { code: "ICE3242", name: "Artificial Intelligence and Neural Computing Lab", creditHours: 1.5, type: "lab", semester: 6, program: "bsc" },
  { code: "ICE3251", name: "Satellite Communication", creditHours: 3, type: "theory", semester: 6, program: "bsc" },
  { code: "ICE3210", name: "Viva-Voce", creditHours: 1, type: "theory", semester: 6, program: "bsc" },

  // 7th Semester
  { code: "ICE4111", name: "Optical Fiber Communication", creditHours: 3, type: "theory", semester: 7, program: "bsc" },
  { code: "ICE4112", name: "Optical Fiber Communication Lab", creditHours: 1.5, type: "lab", semester: 7, program: "bsc" },
  { code: "ICE4121", name: "Machine Learning", creditHours: 3, type: "theory", semester: 7, program: "bsc" },
  { code: "ICE4122", name: "Machine Learning Lab", creditHours: 1.5, type: "lab", semester: 7, program: "bsc" },
  { code: "ICE4131", name: "Wireless Communication", creditHours: 3, type: "theory", semester: 7, program: "bsc" },
  { code: "ICE4132", name: "Wireless Communication Lab", creditHours: 1.5, type: "lab", semester: 7, program: "bsc" },
  { code: "ICE4141", name: "Digital Image Processing", creditHours: 3, type: "theory", semester: 7, program: "bsc" },
  { code: "ICE4142", name: "Digital Image Processing Lab", creditHours: 1.5, type: "lab", semester: 7, program: "bsc" },
  { code: "ICE4154", name: "Research Project – Phase I", creditHours: 1, type: "theory", semester: 7, program: "bsc" },
  { code: "ICE4156", name: "Industrial Training", creditHours: 1, type: "theory", semester: 7, program: "bsc" },

  // 8th Semester - Core Courses
  { code: "ICE4211", name: "Computer Networks", creditHours: 3, type: "theory", semester: 8, program: "bsc" },
  { code: "ICE4212", name: "Computer Networks Lab", creditHours: 1.5, type: "lab", semester: 8, program: "bsc" },
  { code: "ICE4231", name: "Information Theory and Coding", creditHours: 3, type: "theory", semester: 8, program: "bsc" },
  { code: "ICE4210", name: "Viva-Voce", creditHours: 2, type: "theory", semester: 8, program: "bsc" },
  { code: "ICE4254", name: "Research Project – Phase II", creditHours: 3, type: "theory", semester: 8, program: "bsc" },

  // 8th Semester - Elective Courses
  { code: "ICE4221", name: "Computer Architecture and Microprocessor", creditHours: 3, type: "theory", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4222", name: "Computer Architecture and Microprocessor Lab", creditHours: 1.5, type: "lab", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4241", name: "Cryptography", creditHours: 3, type: "theory", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4242", name: "Cryptography Lab", creditHours: 1.5, type: "lab", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4251", name: "Robotics and Automation", creditHours: 3, type: "theory", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4252", name: "Robotics and Automation Lab", creditHours: 1.5, type: "lab", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4261", name: "Internet of Things", creditHours: 3, type: "theory", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4262", name: "Internet of Things Lab", creditHours: 1.5, type: "lab", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4271", name: "Information Security", creditHours: 3, type: "theory", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4272", name: "Information Security Lab", creditHours: 1.5, type: "lab", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4281", name: "Web Engineering", creditHours: 3, type: "theory", semester: 8, program: "bsc", isElective: true },
  { code: "ICE4282", name: "Web Engineering Lab", creditHours: 1.5, type: "lab", semester: 8, program: "bsc", isElective: true },
];

// GET - Seed courses
export async function GET() {
  try {
    let created = 0;
    let updated = 0;

    for (const course of courses) {
      // Check if course already exists
      const q = query(
        collection(db, "courses"),
        where("code", "==", course.code)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        // Update existing course
        const docRef = existing.docs[0].ref;
        await updateDoc(docRef, {
          ...course,
          isActive: true,
          updatedAt: serverTimestamp(),
        });
        updated++;
      } else {
        // Create new course
        await addDoc(collection(db, "courses"), {
          ...course,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        created++;
      }
    }

    // Get all courses
    const allCoursesQuery = query(collection(db, "courses"), where("isActive", "==", true));
    const allCoursesSnapshot = await getDocs(allCoursesQuery);
    const total = allCoursesSnapshot.size;

    return NextResponse.json({
      success: true,
      message: `Courses seeded: ${created} created, ${updated} updated`,
      total,
      summary: {
        "1st Semester": courses.filter(c => c.semester === 1 && !c.isElective).length + " courses",
        "2nd Semester": courses.filter(c => c.semester === 2).length + " courses",
        "3rd Semester": courses.filter(c => c.semester === 3).length + " courses",
        "4th Semester": courses.filter(c => c.semester === 4).length + " courses",
        "5th Semester": courses.filter(c => c.semester === 5).length + " courses",
        "6th Semester": courses.filter(c => c.semester === 6).length + " courses",
        "7th Semester": courses.filter(c => c.semester === 7).length + " courses",
        "8th Semester": courses.filter(c => c.semester === 8 && !c.isElective).length + " core + " + courses.filter(c => c.semester === 8 && c.isElective).length + " electives",
      },
      courses: courses.map(c => ({
        code: c.code,
        name: c.name,
        credits: c.creditHours,
        type: c.type.toUpperCase(),
        semester: c.semester,
        elective: c.isElective || false
      }))
    });
  } catch (error) {
    console.error("Error seeding courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed courses: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
