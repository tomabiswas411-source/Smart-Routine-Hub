import { NextResponse } from "next/server";
import { 
  createUser, 
  getUsers, 
  createCourse, 
  createRoom, 
  createTimeSlot, 
  createSchedule, 
  createNotice, 
  createCalendarEvent,
  updateSiteSettings
} from "@/lib/firebase-services";
import { hash } from "bcryptjs";

// Days of the week
const DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];

// Time slots with proper schedule
const TIME_SLOTS = [
  { label: "1st Period", startTime: "08:00", endTime: "08:50", slotOrder: 1 },
  { label: "2nd Period", startTime: "09:00", endTime: "09:50", slotOrder: 2 },
  { label: "3rd Period", startTime: "10:00", endTime: "10:50", slotOrder: 3 },
  { label: "4th Period", startTime: "11:00", endTime: "11:50", slotOrder: 4 },
  { label: "5th Period", startTime: "12:00", endTime: "12:50", slotOrder: 5 },
  { label: "6th Period", startTime: "14:00", endTime: "14:50", slotOrder: 6 },
  { label: "7th Period", startTime: "15:00", endTime: "15:50", slotOrder: 7 },
  { label: "8th Period", startTime: "16:00", endTime: "16:50", slotOrder: 8 },
];

// Teachers with specific course assignments
const TEACHERS_DATA = [
  { fullName: "Dr. Mohammad Rahman", designation: "Professor", email: "rahman@ru.ac.bd", officeRoom: "Room 401", specialization: "Digital Electronics, VLSI" },
  { fullName: "Dr. Farhana Akter", designation: "Associate Professor", email: "farhana@ru.ac.bd", officeRoom: "Room 402", specialization: "Communication Systems" },
  { fullName: "Md. Kamal Hossain", designation: "Assistant Professor", email: "kamal@ru.ac.bd", officeRoom: "Room 403", specialization: "Embedded Systems, IoT" },
  { fullName: "Dr. Nafisa Islam", designation: "Associate Professor", email: "nafisa@ru.ac.bd", officeRoom: "Room 404", specialization: "Mathematics, Algorithms" },
  { fullName: "Tanvir Ahmed", designation: "Lecturer", email: "tanvir@ru.ac.bd", officeRoom: "Room 405", specialization: "Programming, Physics" },
  { fullName: "Dr. Abdur Rahim", designation: "Professor", email: "rahim@ru.ac.bd", officeRoom: "Room 406", specialization: "Computer Networks" },
  { fullName: "Dr. Sabrina Khan", designation: "Associate Professor", email: "sabrina@ru.ac.bd", officeRoom: "Room 407", specialization: "AI, Machine Learning" },
  { fullName: "Md. Jamil Hossain", designation: "Assistant Professor", email: "jamil@ru.ac.bd", officeRoom: "Room 408", specialization: "Wireless Communication" },
  { fullName: "Dr. Rumana Begum", designation: "Professor", email: "rumana@ru.ac.bd", officeRoom: "Room 409", specialization: "Database, Software Engineering" },
  { fullName: "Asif Mahmud", designation: "Lecturer", email: "asif@ru.ac.bd", officeRoom: "Room 410", specialization: "Web Technologies" },
  { fullName: "Dr. Fatema Khatun", designation: "Associate Professor", email: "fatema@ru.ac.bd", officeRoom: "Room 411", specialization: "Control Systems, Robotics" },
  { fullName: "Dr. Hasan Mahmud", designation: "Professor", email: "hasan@ru.ac.bd", officeRoom: "Room 412", specialization: "Image Processing, Computer Vision" },
];

// Rooms with types
const ROOMS_DATA = [
  { roomNumber: "301", building: "Main Building", type: "classroom" as const, capacity: 60 },
  { roomNumber: "302", building: "Main Building", type: "classroom" as const, capacity: 60 },
  { roomNumber: "303", building: "Main Building", type: "classroom" as const, capacity: 45 },
  { roomNumber: "304", building: "Main Building", type: "classroom" as const, capacity: 50 },
  { roomNumber: "401", building: "Science Building", type: "classroom" as const, capacity: 55 },
  { roomNumber: "402", building: "Science Building", type: "classroom" as const, capacity: 55 },
  { roomNumber: "Lab 101", building: "ICE Building", type: "lab" as const, capacity: 30 },
  { roomNumber: "Lab 102", building: "ICE Building", type: "lab" as const, capacity: 30 },
  { roomNumber: "Lab 201", building: "ICE Building", type: "lab" as const, capacity: 30 },
  { roomNumber: "Computer Lab 1", building: "ICE Building", type: "lab" as const, capacity: 40 },
  { roomNumber: "Computer Lab 2", building: "ICE Building", type: "lab" as const, capacity: 40 },
  { roomNumber: "Seminar Room", building: "Main Building", type: "seminar" as const, capacity: 100 },
];

// BSc Courses - Organized by semester
const BSC_COURSES = {
  // 1st Semester (Sem 1)
  1: [
    { name: "Digital Electronics", code: "ICE-1101", creditHours: 3, type: "theory" as const, teacherIdx: 0 },
    { name: "Digital Electronics Lab", code: "ICE-1102", creditHours: 1.5, type: "lab" as const, teacherIdx: 0 },
    { name: "Electrical Circuit Analysis", code: "ICE-1103", creditHours: 3, type: "theory" as const, teacherIdx: 1 },
    { name: "Electrical Circuit Lab", code: "ICE-1104", creditHours: 1.5, type: "lab" as const, teacherIdx: 1 },
    { name: "Mathematics-I", code: "ICE-1105", creditHours: 3, type: "theory" as const, teacherIdx: 3 },
    { name: "Physics-I", code: "ICE-1106", creditHours: 3, type: "theory" as const, teacherIdx: 4 },
  ],
  // 2nd Semester (Sem 2)
  2: [
    { name: "Analog Electronics", code: "ICE-1201", creditHours: 3, type: "theory" as const, teacherIdx: 0 },
    { name: "Analog Electronics Lab", code: "ICE-1202", creditHours: 1.5, type: "lab" as const, teacherIdx: 0 },
    { name: "Signals and Systems", code: "ICE-1203", creditHours: 3, type: "theory" as const, teacherIdx: 1 },
    { name: "Mathematics-II", code: "ICE-1204", creditHours: 3, type: "theory" as const, teacherIdx: 3 },
    { name: "Programming Fundamentals", code: "ICE-1205", creditHours: 3, type: "theory" as const, teacherIdx: 4 },
    { name: "Programming Lab", code: "ICE-1206", creditHours: 1.5, type: "lab" as const, teacherIdx: 4 },
  ],
  // 3rd Semester (Sem 3)
  3: [
    { name: "Data Structures", code: "ICE-2101", creditHours: 3, type: "theory" as const, teacherIdx: 5 },
    { name: "Data Structures Lab", code: "ICE-2102", creditHours: 1.5, type: "lab" as const, teacherIdx: 5 },
    { name: "Microprocessors", code: "ICE-2103", creditHours: 3, type: "theory" as const, teacherIdx: 2 },
    { name: "Microprocessors Lab", code: "ICE-2104", creditHours: 1.5, type: "lab" as const, teacherIdx: 2 },
    { name: "Electromagnetic Fields", code: "ICE-2105", creditHours: 3, type: "theory" as const, teacherIdx: 1 },
    { name: "Mathematics-III", code: "ICE-2106", creditHours: 3, type: "theory" as const, teacherIdx: 3 },
  ],
  // 4th Semester (Sem 4)
  4: [
    { name: "Computer Networks", code: "ICE-2201", creditHours: 3, type: "theory" as const, teacherIdx: 5 },
    { name: "Networks Lab", code: "ICE-2202", creditHours: 1.5, type: "lab" as const, teacherIdx: 5 },
    { name: "Database Systems", code: "ICE-2203", creditHours: 3, type: "theory" as const, teacherIdx: 8 },
    { name: "Database Lab", code: "ICE-2204", creditHours: 1.5, type: "lab" as const, teacherIdx: 8 },
    { name: "Communication Systems", code: "ICE-2205", creditHours: 3, type: "theory" as const, teacherIdx: 1 },
    { name: "Communication Lab", code: "ICE-2206", creditHours: 1.5, type: "lab" as const, teacherIdx: 7 },
  ],
  // 5th Semester (Sem 5)
  5: [
    { name: "Operating Systems", code: "ICE-3101", creditHours: 3, type: "theory" as const, teacherIdx: 5 },
    { name: "OS Lab", code: "ICE-3102", creditHours: 1.5, type: "lab" as const, teacherIdx: 5 },
    { name: "Digital Signal Processing", code: "ICE-3103", creditHours: 3, type: "theory" as const, teacherIdx: 1 },
    { name: "DSP Lab", code: "ICE-3104", creditHours: 1.5, type: "lab" as const, teacherIdx: 1 },
    { name: "Algorithms", code: "ICE-3105", creditHours: 3, type: "theory" as const, teacherIdx: 3 },
    { name: "VLSI Design", code: "ICE-3106", creditHours: 3, type: "theory" as const, teacherIdx: 0 },
  ],
  // 6th Semester (Sem 6)
  6: [
    { name: "Software Engineering", code: "ICE-3201", creditHours: 3, type: "theory" as const, teacherIdx: 8 },
    { name: "Software Eng Lab", code: "ICE-3202", creditHours: 1.5, type: "lab" as const, teacherIdx: 8 },
    { name: "Control Systems", code: "ICE-3203", creditHours: 3, type: "theory" as const, teacherIdx: 10 },
    { name: "Control Lab", code: "ICE-3204", creditHours: 1.5, type: "lab" as const, teacherIdx: 10 },
    { name: "Wireless Communication", code: "ICE-3205", creditHours: 3, type: "theory" as const, teacherIdx: 7 },
    { name: "Antenna Theory", code: "ICE-3206", creditHours: 3, type: "theory" as const, teacherIdx: 7 },
  ],
  // 7th Semester (Sem 7)
  7: [
    { name: "Artificial Intelligence", code: "ICE-4101", creditHours: 3, type: "theory" as const, teacherIdx: 6 },
    { name: "AI Lab", code: "ICE-4102", creditHours: 1.5, type: "lab" as const, teacherIdx: 6 },
    { name: "Image Processing", code: "ICE-4103", creditHours: 3, type: "theory" as const, teacherIdx: 11 },
    { name: "Image Proc Lab", code: "ICE-4104", creditHours: 1.5, type: "lab" as const, teacherIdx: 11 },
    { name: "Cybersecurity", code: "ICE-4105", creditHours: 3, type: "theory" as const, teacherIdx: 5 },
    { name: "IoT Systems", code: "ICE-4106", creditHours: 3, type: "theory" as const, teacherIdx: 2 },
  ],
  // 8th Semester (Sem 8)
  8: [
    { name: "Machine Learning", code: "ICE-4201", creditHours: 3, type: "theory" as const, teacherIdx: 6 },
    { name: "ML Lab", code: "ICE-4202", creditHours: 1.5, type: "lab" as const, teacherIdx: 6 },
    { name: "Cloud Computing", code: "ICE-4203", creditHours: 3, type: "theory" as const, teacherIdx: 9 },
    { name: "Project Work", code: "ICE-4204", creditHours: 4, type: "theory" as const, teacherIdx: 0 },
    { name: "Mobile Computing", code: "ICE-4205", creditHours: 3, type: "theory" as const, teacherIdx: 2 },
  ],
};

// MSc Courses
const MSC_COURSES = {
  // 1st Semester (Year 1, Sem 1)
  1: [
    { name: "Advanced Digital Communication", code: "ICE-6101", creditHours: 3, type: "theory" as const, teacherIdx: 1 },
    { name: "Advanced Signal Processing", code: "ICE-6102", creditHours: 3, type: "theory" as const, teacherIdx: 1 },
    { name: "Research Methodology", code: "ICE-6103", creditHours: 3, type: "theory" as const, teacherIdx: 3 },
    { name: "Advanced Electronics Lab", code: "ICE-6104", creditHours: 1.5, type: "lab" as const, teacherIdx: 0 },
  ],
  // 2nd Semester (Year 1, Sem 2)
  2: [
    { name: "Advanced Networking", code: "ICE-6201", creditHours: 3, type: "theory" as const, teacherIdx: 5 },
    { name: "Deep Learning", code: "ICE-6202", creditHours: 3, type: "theory" as const, teacherIdx: 6 },
    { name: "Deep Learning Lab", code: "ICE-6203", creditHours: 1.5, type: "lab" as const, teacherIdx: 6 },
    { name: "Embedded Systems", code: "ICE-6204", creditHours: 3, type: "theory" as const, teacherIdx: 2 },
  ],
  // 3rd Semester (Year 2, Sem 1)
  3: [
    { name: "Fiber Optic Communication", code: "ICE-7101", creditHours: 3, type: "theory" as const, teacherIdx: 7 },
    { name: "Satellite Communication", code: "ICE-7102", creditHours: 3, type: "theory" as const, teacherIdx: 7 },
    { name: "Advanced VLSI", code: "ICE-7103", creditHours: 3, type: "theory" as const, teacherIdx: 0 },
    { name: "VLSI Lab", code: "ICE-7104", creditHours: 1.5, type: "lab" as const, teacherIdx: 0 },
  ],
};

export async function POST() {
  try {
    // Check if already seeded
    const existingTeachers = await getUsers("teacher");
    if (existingTeachers.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Database already seeded",
      });
    }

    const hashedPassword = await hash("password123", 10);

    // 1. Create Admin
    const admin = await createUser({
      email: "admin@ice.ru.ac.bd",
      password: hashedPassword,
      fullName: "System Admin",
      role: "admin",
      department: "Information & Communication Engineering",
      isActive: true,
    });

    // 2. Create Teachers
    const teachers = await Promise.all(
      TEACHERS_DATA.map((t) =>
        createUser({
          email: t.email,
          password: hashedPassword,
          fullName: t.fullName,
          designation: t.designation,
          officeRoom: t.officeRoom,
          bio: `Specializes in ${t.specialization}`,
          role: "teacher",
          department: "Information & Communication Engineering",
          isActive: true,
        })
      )
    );

    // 3. Create Time Slots
    const timeSlots = await Promise.all(
      TIME_SLOTS.map((slot, index) =>
        createTimeSlot({
          ...slot,
          isBreak: false,
          isActive: true,
        })
      )
    );

    // 4. Create Rooms
    const rooms = await Promise.all(
      ROOMS_DATA.map((room) =>
        createRoom({
          ...room,
          isActive: true,
        })
      )
    );

    // Helper to get classroom
    const getClassroom = (index: number) => {
      const classrooms = rooms.filter((r) => r.type === "classroom");
      return classrooms[index % classrooms.length];
    };

    // Helper to get lab
    const getLab = (index: number) => {
      const labs = rooms.filter((r) => r.type === "lab");
      return labs[index % labs.length];
    };

    // 5. Create BSc Courses and Schedules
    const allCourses: any[] = [];
    const scheduleEntries: any[] = [];

    // Track used slots to prevent conflicts
    const usedSlots: Map<string, Set<string>> = new Map(); // key: "day-period", value: Set of "roomId"

    const isSlotAvailable = (day: string, periodIndex: number, roomId: string): boolean => {
      const key = `${day}-${periodIndex}`;
      if (!usedSlots.has(key)) {
        usedSlots.set(key, new Set());
      }
      return !usedSlots.get(key)!.has(roomId);
    };

    const markSlotUsed = (day: string, periodIndex: number, roomId: string) => {
      const key = `${day}-${periodIndex}`;
      if (!usedSlots.has(key)) {
        usedSlots.set(key, new Set());
      }
      usedSlots.get(key)!.add(roomId);
    };

    // Create BSc courses and schedules
    for (const [semesterStr, courses] of Object.entries(BSC_COURSES)) {
      const semester = parseInt(semesterStr);
      const year = Math.ceil(semester / 2); // Year 1 = Sem 1,2; Year 2 = Sem 3,4; etc.

      for (const courseData of courses) {
        const course = await createCourse({
          name: courseData.name,
          code: courseData.code,
          creditHours: courseData.creditHours,
          type: courseData.type,
          year: year,
          semester: semester,
          isActive: true,
        });
        allCourses.push({ ...course, teacherIdx: courseData.teacherIdx });

        // Assign schedule for this course
        const teacher = teachers[courseData.teacherIdx % teachers.length];
        const room = courseData.type === "lab" ? getLab(semester) : getClassroom(semester);

        // Find available slots for this course
        let assigned = false;
        for (const day of DAYS) {
          if (assigned) break;
          for (let periodIdx = 0; periodIdx < timeSlots.length; periodIdx++) {
            if (assigned) break;
            
            // Skip if slot not available
            if (!isSlotAvailable(day, periodIdx, room.id)) continue;
            
            // For lab courses, need 2 consecutive periods
            if (courseData.type === "lab") {
              if (periodIdx + 1 < timeSlots.length && 
                  isSlotAvailable(day, periodIdx + 1, room.id)) {
                // Assign 2 consecutive periods for lab
                markSlotUsed(day, periodIdx, room.id);
                markSlotUsed(day, periodIdx + 1, room.id);
                
                scheduleEntries.push({
                  dayOfWeek: day,
                  courseId: course.id,
                  teacherId: teacher.id,
                  roomId: room.id,
                  timeSlotId: timeSlots[periodIdx].id,
                  courseName: course.name,
                  courseCode: course.code,
                  teacherName: teacher.fullName,
                  roomNumber: room.roomNumber,
                  startTime: timeSlots[periodIdx].startTime,
                  endTime: timeSlots[periodIdx + 1].endTime,
                  year: year,
                  semester: semester,
                  program: "bsc",
                  classType: "lab",
                  isActive: true,
                });
                assigned = true;
              }
            } else {
              // Theory class - single period
              markSlotUsed(day, periodIdx, room.id);
              
              scheduleEntries.push({
                dayOfWeek: day,
                courseId: course.id,
                teacherId: teacher.id,
                roomId: room.id,
                timeSlotId: timeSlots[periodIdx].id,
                courseName: course.name,
                courseCode: course.code,
                teacherName: teacher.fullName,
                roomNumber: room.roomNumber,
                startTime: timeSlots[periodIdx].startTime,
                endTime: timeSlots[periodIdx].endTime,
                year: year,
                semester: semester,
                program: "bsc",
                classType: "theory",
                isActive: true,
              });
              assigned = true;
            }
          }
        }
      }
    }

    // Create MSc courses and schedules
    for (const [semesterStr, courses] of Object.entries(MSC_COURSES)) {
      const semester = parseInt(semesterStr);
      const year = Math.ceil(semester / 2);

      for (const courseData of courses) {
        const course = await createCourse({
          name: courseData.name,
          code: courseData.code,
          creditHours: courseData.creditHours,
          type: courseData.type,
          year: year,
          semester: semester,
          isActive: true,
        });
        allCourses.push({ ...course, teacherIdx: courseData.teacherIdx });

        const teacher = teachers[courseData.teacherIdx % teachers.length];
        const room = courseData.type === "lab" ? getLab(semester + 3) : getClassroom(semester + 3);

        let assigned = false;
        for (const day of DAYS) {
          if (assigned) break;
          for (let periodIdx = 0; periodIdx < timeSlots.length; periodIdx++) {
            if (assigned) break;
            
            if (!isSlotAvailable(day, periodIdx, room.id)) continue;
            
            if (courseData.type === "lab") {
              if (periodIdx + 1 < timeSlots.length && 
                  isSlotAvailable(day, periodIdx + 1, room.id)) {
                markSlotUsed(day, periodIdx, room.id);
                markSlotUsed(day, periodIdx + 1, room.id);
                
                scheduleEntries.push({
                  dayOfWeek: day,
                  courseId: course.id,
                  teacherId: teacher.id,
                  roomId: room.id,
                  timeSlotId: timeSlots[periodIdx].id,
                  courseName: course.name,
                  courseCode: course.code,
                  teacherName: teacher.fullName,
                  roomNumber: room.roomNumber,
                  startTime: timeSlots[periodIdx].startTime,
                  endTime: timeSlots[periodIdx + 1].endTime,
                  year: year,
                  semester: semester,
                  program: "msc",
                  classType: "lab",
                  isActive: true,
                });
                assigned = true;
              }
            } else {
              markSlotUsed(day, periodIdx, room.id);
              
              scheduleEntries.push({
                dayOfWeek: day,
                courseId: course.id,
                teacherId: teacher.id,
                roomId: room.id,
                timeSlotId: timeSlots[periodIdx].id,
                courseName: course.name,
                courseCode: course.code,
                teacherName: teacher.fullName,
                roomNumber: room.roomNumber,
                startTime: timeSlots[periodIdx].startTime,
                endTime: timeSlots[periodIdx].endTime,
                year: year,
                semester: semester,
                program: "msc",
                classType: "theory",
                isActive: true,
              });
              assigned = true;
            }
          }
        }
      }
    }

    // Save all schedules
    for (const entry of scheduleEntries) {
      await createSchedule(entry);
    }

    // 6. Create Notices
    await Promise.all([
      createNotice({
        title: "Welcome to Smart Routine Hub",
        content: "This is the official class routine management system for ICE Department, Rajshahi University. Teachers can cancel or reschedule classes, and students will see real-time updates.",
        category: "general",
        postedBy: admin.id,
        postedByName: admin.fullName,
        isPinned: true,
        isApproved: true,
        isAutoGenerated: false,
      }),
      createNotice({
        title: "Mid-term Examination Schedule",
        content: "Mid-term examinations for all semesters will be held from March 15-25, 2025. Students are advised to check the exam schedule from the academic section.",
        category: "exam",
        postedBy: admin.id,
        postedByName: admin.fullName,
        isPinned: true,
        isApproved: true,
        isAutoGenerated: false,
      }),
      createNotice({
        title: "Departmental Seminar",
        content: "A seminar on 'Future of Communication Technology' will be held on Friday at the Seminar Room. All students are encouraged to attend.",
        category: "event",
        postedBy: teachers[0].id,
        postedByName: teachers[0].fullName,
        isPinned: false,
        isApproved: true,
        isAutoGenerated: false,
      }),
    ]);

    // 7. Create Calendar Events
    await Promise.all([
      createCalendarEvent({
        title: "Spring 2025 Semester Begins",
        date: new Date("2025-01-05"),
        eventType: "class",
        description: "Classes for Spring 2025 semester begin",
      }),
      createCalendarEvent({
        title: "Mid-term Examination",
        date: new Date("2025-03-15"),
        endDate: new Date("2025-03-25"),
        eventType: "exam",
        description: "Mid-term examination",
      }),
      createCalendarEvent({
        title: "Independence Day",
        date: new Date("2025-03-26"),
        eventType: "holiday",
        description: "National Holiday",
      }),
      createCalendarEvent({
        title: "Bengali New Year",
        date: new Date("2025-04-14"),
        eventType: "holiday",
        description: "Pohela Boishakh",
      }),
      createCalendarEvent({
        title: "Final Examination",
        date: new Date("2025-05-15"),
        endDate: new Date("2025-05-30"),
        eventType: "exam",
        description: "Final examination",
      }),
    ]);

    // 8. Site Settings
    await updateSiteSettings({
      departmentName: "Information & Communication Engineering",
      universityName: "Rajshahi University",
      contactEmail: "ice@ru.ac.bd",
      contactPhone: "+880-721-750123",
      address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
      aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research.",
      facebookURL: "https://facebook.com/iceru",
      websiteURL: "https://ice.ru.ac.bd",
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      data: {
        teachers: teachers.length,
        timeSlots: timeSlots.length,
        rooms: rooms.length,
        courses: allCourses.length,
        schedules: scheduleEntries.length,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
