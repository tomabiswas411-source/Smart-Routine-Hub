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

    // Hash password for all users
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
    const teachers = await Promise.all([
      createUser({
        email: "rahman@ru.ac.bd",
        password: hashedPassword,
        fullName: "Dr. Mohammad Rahman",
        designation: "Professor",
        phone: "01712345678",
        officeRoom: "Room 401",
        bio: "Expert in Digital Electronics and VLSI Design with over 20 years of teaching experience.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "farhana@ru.ac.bd",
        password: hashedPassword,
        fullName: "Dr. Farhana Akter",
        designation: "Associate Professor",
        phone: "01712345679",
        officeRoom: "Room 402",
        bio: "Specializes in Communication Systems and Signal Processing.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "kamal@ru.ac.bd",
        password: hashedPassword,
        fullName: "Md. Kamal Hossain",
        designation: "Assistant Professor",
        phone: "01712345680",
        officeRoom: "Room 403",
        bio: "Research interests include Embedded Systems and IoT.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "nafisa@ru.ac.bd",
        password: hashedPassword,
        fullName: "Dr. Nafisa Islam",
        designation: "Associate Professor",
        phone: "01712345681",
        officeRoom: "Room 404",
        bio: "Expert in Mathematics and Algorithm Design.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "tanvir@ru.ac.bd",
        password: hashedPassword,
        fullName: "Tanvir Ahmed",
        designation: "Lecturer",
        phone: "01712345682",
        officeRoom: "Room 405",
        bio: "Recently joined faculty, specializing in Physics and Basic Electronics.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
    ]);

    // 3. Create Time Slots
    const timeSlots = await Promise.all([
      createTimeSlot({ label: "1st Period", startTime: "08:00", endTime: "08:50", slotOrder: 1, isBreak: false, isActive: true }),
      createTimeSlot({ label: "2nd Period", startTime: "09:00", endTime: "09:50", slotOrder: 2, isBreak: false, isActive: true }),
      createTimeSlot({ label: "3rd Period", startTime: "10:00", endTime: "10:50", slotOrder: 3, isBreak: false, isActive: true }),
      createTimeSlot({ label: "4th Period", startTime: "11:00", endTime: "11:50", slotOrder: 4, isBreak: false, isActive: true }),
      createTimeSlot({ label: "5th Period", startTime: "12:00", endTime: "12:50", slotOrder: 5, isBreak: false, isActive: true }),
      createTimeSlot({ label: "Break", startTime: "12:50", endTime: "14:00", slotOrder: 6, isBreak: true, isActive: true }),
      createTimeSlot({ label: "6th Period", startTime: "14:00", endTime: "14:50", slotOrder: 7, isBreak: false, isActive: true }),
      createTimeSlot({ label: "7th Period", startTime: "15:00", endTime: "15:50", slotOrder: 8, isBreak: false, isActive: true }),
      createTimeSlot({ label: "8th Period", startTime: "16:00", endTime: "16:50", slotOrder: 9, isBreak: false, isActive: true }),
    ]);

    // 4. Create Rooms
    const rooms = await Promise.all([
      createRoom({ roomNumber: "301", building: "Main Building", type: "classroom", capacity: 60, isActive: true }),
      createRoom({ roomNumber: "302", building: "Main Building", type: "classroom", capacity: 60, isActive: true }),
      createRoom({ roomNumber: "303", building: "Main Building", type: "classroom", capacity: 40, isActive: true }),
      createRoom({ roomNumber: "405", building: "Science Building", type: "classroom", capacity: 50, isActive: true }),
      createRoom({ roomNumber: "Lab 201", building: "ICE Building", type: "lab", capacity: 30, isActive: true }),
      createRoom({ roomNumber: "Lab 202", building: "ICE Building", type: "lab", capacity: 30, isActive: true }),
      createRoom({ roomNumber: "Seminar Room", building: "Main Building", type: "seminar", capacity: 100, isActive: true }),
    ]);

    // 5. Create Courses (1st Year, 1st Semester)
    const courses = await Promise.all([
      createCourse({ name: "Digital Electronics", code: "ICE-1101", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Digital Electronics Lab", code: "ICE-1102", creditHours: 1.5, type: "lab", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Electrical Circuit Analysis", code: "ICE-1103", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Electrical Circuit Analysis Lab", code: "ICE-1104", creditHours: 1.5, type: "lab", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Mathematics-I", code: "ICE-1105", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Physics", code: "ICE-1106", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "English", code: "ICE-1107", creditHours: 2, type: "theory", year: 1, semester: 1, isActive: true }),
    ]);

    // 6. Create Sample Schedules with program (BSC/MSC)
    // Using dayOfWeek field consistently
    const scheduleData = [
      // Sunday - BSC 1st Year
      { dayOfWeek: "sunday", courseId: courses[0].id, teacherId: teachers[0].id, roomId: rooms[0].id, timeSlotId: timeSlots[0].id, year: 1, semester: 1, program: "bsc" },
      { dayOfWeek: "sunday", courseId: courses[4].id, teacherId: teachers[3].id, roomId: rooms[1].id, timeSlotId: timeSlots[1].id, year: 1, semester: 1, program: "bsc" },
      { dayOfWeek: "sunday", courseId: courses[5].id, teacherId: teachers[4].id, roomId: rooms[0].id, timeSlotId: timeSlots[2].id, year: 1, semester: 1, program: "bsc" },
      
      // Monday - BSC 1st Year
      { dayOfWeek: "monday", courseId: courses[2].id, teacherId: teachers[2].id, roomId: rooms[0].id, timeSlotId: timeSlots[0].id, year: 1, semester: 1, program: "bsc" },
      { dayOfWeek: "monday", courseId: courses[6].id, teacherId: teachers[1].id, roomId: rooms[2].id, timeSlotId: timeSlots[1].id, year: 1, semester: 1, program: "bsc" },
      { dayOfWeek: "monday", courseId: courses[1].id, teacherId: teachers[0].id, roomId: rooms[4].id, timeSlotId: timeSlots[6].id, year: 1, semester: 1, program: "bsc" },
      
      // Tuesday - BSC 1st Year
      { dayOfWeek: "tuesday", courseId: courses[4].id, teacherId: teachers[3].id, roomId: rooms[1].id, timeSlotId: timeSlots[0].id, year: 1, semester: 1, program: "bsc" },
      { dayOfWeek: "tuesday", courseId: courses[0].id, teacherId: teachers[0].id, roomId: rooms[0].id, timeSlotId: timeSlots[1].id, year: 1, semester: 1, program: "bsc" },
      { dayOfWeek: "tuesday", courseId: courses[2].id, teacherId: teachers[2].id, roomId: rooms[0].id, timeSlotId: timeSlots[2].id, year: 1, semester: 1, program: "bsc" },
      
      // Wednesday - BSC 2nd Year  
      { dayOfWeek: "wednesday", courseId: courses[5].id, teacherId: teachers[4].id, roomId: rooms[1].id, timeSlotId: timeSlots[0].id, year: 2, semester: 3, program: "bsc" },
      { dayOfWeek: "wednesday", courseId: courses[6].id, teacherId: teachers[1].id, roomId: rooms[0].id, timeSlotId: timeSlots[1].id, year: 2, semester: 3, program: "bsc" },
      { dayOfWeek: "wednesday", courseId: courses[3].id, teacherId: teachers[2].id, roomId: rooms[5].id, timeSlotId: timeSlots[6].id, year: 2, semester: 3, program: "bsc" },
      
      // Thursday - BSC 2nd Year
      { dayOfWeek: "thursday", courseId: courses[0].id, teacherId: teachers[0].id, roomId: rooms[0].id, timeSlotId: timeSlots[0].id, year: 2, semester: 3, program: "bsc" },
      { dayOfWeek: "thursday", courseId: courses[4].id, teacherId: teachers[3].id, roomId: rooms[1].id, timeSlotId: timeSlots[1].id, year: 2, semester: 3, program: "bsc" },
      { dayOfWeek: "thursday", courseId: courses[2].id, teacherId: teachers[2].id, roomId: rooms[2].id, timeSlotId: timeSlots[2].id, year: 2, semester: 3, program: "bsc" },
      
      // Sunday - MSC 1st Year
      { dayOfWeek: "sunday", courseId: courses[5].id, teacherId: teachers[4].id, roomId: rooms[0].id, timeSlotId: timeSlots[0].id, year: 1, semester: 1, program: "msc" },
      { dayOfWeek: "sunday", courseId: courses[1].id, teacherId: teachers[0].id, roomId: rooms[4].id, timeSlotId: timeSlots[6].id, year: 1, semester: 1, program: "msc" },
      { dayOfWeek: "sunday", courseId: courses[0].id, teacherId: teachers[3].id, roomId: rooms[1].id, timeSlotId: timeSlots[1].id, year: 1, semester: 1, program: "msc" },
      
      // Monday - MSC 2nd Year
      { dayOfWeek: "monday", courseId: courses[0].id, teacherId: teachers[0].id, roomId: rooms[0].id, timeSlotId: timeSlots[3].id, year: 1, semester: 2, program: "msc" },
      { dayOfWeek: "monday", courseId: courses[2].id, teacherId: teachers[2].id, roomId: rooms[1].id, timeSlotId: timeSlots[4].id, year: 1, semester: 2, program: "msc" },
      
      // Tuesday - MSC 2nd Year
      { dayOfWeek: "tuesday", courseId: courses[4].id, teacherId: teachers[3].id, roomId: rooms[0].id, timeSlotId: timeSlots[3].id, year: 1, semester: 2, program: "msc" },
      { dayOfWeek: "tuesday", courseId: courses[5].id, teacherId: teachers[4].id, roomId: rooms[1].id, timeSlotId: timeSlots[4].id, year: 1, semester: 2, program: "msc" },
    ];

    for (const sched of scheduleData) {
      const course = courses.find(c => c.id === sched.courseId);
      const teacher = teachers.find(t => t.id === sched.teacherId);
      const room = rooms.find(r => r.id === sched.roomId);
      const timeSlot = timeSlots.find(t => t.id === sched.timeSlotId);

      if (course && teacher && room && timeSlot) {
        await createSchedule({
          ...sched,
          courseName: course.name,
          courseCode: course.code,
          teacherName: teacher.fullName,
          roomNumber: room.roomNumber,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          year: sched.year || course.year,
          semester: sched.semester || course.semester,
          program: sched.program || "bsc",
          classType: course.type,
          isActive: true,
        });
      }
    }

    // 7. Create Sample Notices
    await Promise.all([
      createNotice({
        title: "Mid-term Exam Schedule Published",
        content: "The mid-term examination schedule for Spring 2025 has been published. Please check the academic section for details. All students are advised to collect their admit cards from the department office.",
        category: "exam",
        postedBy: admin.id,
        postedByName: admin.fullName,
        isPinned: true,
        isApproved: true,
        isAutoGenerated: false,
      }),
      createNotice({
        title: "Departmental Seminar on 5G Technology",
        content: "A seminar on 'Next Generation 5G Technology and Its Applications' will be held on March 20, 2025 at the Seminar Room. All students and faculty members are cordially invited to attend.",
        category: "event",
        postedBy: teachers[0].id,
        postedByName: teachers[0].fullName,
        isPinned: true,
        isApproved: true,
        isAutoGenerated: false,
      }),
      createNotice({
        title: "Class Suspended on March 26 (Independence Day)",
        content: "All classes will remain suspended on March 26, 2025, on the occasion of Independence Day. Classes will resume as usual from March 27.",
        category: "general",
        postedBy: admin.id,
        postedByName: admin.fullName,
        isPinned: false,
        isApproved: true,
        isAutoGenerated: false,
      }),
    ]);

    // 8. Create Academic Calendar Events
    await Promise.all([
      createCalendarEvent({
        title: "Spring 2025 Semester Begins",
        date: new Date("2025-01-05"),
        eventType: "class",
        description: "Classes for Spring 2025 semester begin",
      }),
      createCalendarEvent({
        title: "Mid-term Examination",
        date: new Date("2025-03-10"),
        endDate: new Date("2025-03-20"),
        eventType: "exam",
        description: "Mid-term examination for all courses",
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
        description: "Final examination for Spring 2025 semester",
      }),
    ]);

    // 9. Create Site Settings
    await updateSiteSettings({
      departmentName: "Information & Communication Engineering",
      universityName: "Rajshahi University",
      contactEmail: "ice@ru.ac.bd",
      contactPhone: "+880-721-750123",
      address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
      aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research in the fields of information technology and communication systems.",
      facebookURL: "https://facebook.com/iceru",
      websiteURL: "https://ice.ru.ac.bd",
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        teachers: teachers.length,
        timeSlots: timeSlots.length,
        rooms: rooms.length,
        courses: courses.length,
        schedules: scheduleData.length,
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
