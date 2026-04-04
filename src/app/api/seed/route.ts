import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST() {
  try {
    // Check if already seeded
    const existingTeachers = await db.user.count();
    if (existingTeachers > 0) {
      return NextResponse.json({
        success: false,
        message: "Database already seeded",
      });
    }

    // Hash password for all users
    const hashedPassword = await hash("password123", 10);

    // 1. Create Admin
    const admin = await db.user.create({
      data: {
        email: "admin@ice.ru.ac.bd",
        password: hashedPassword,
        fullName: "System Admin",
        role: "admin",
        department: "Information & Communication Engineering",
      },
    });

    // 2. Create Teachers
    const teachers = await Promise.all([
      db.user.create({
        data: {
          email: "rahman@ru.ac.bd",
          password: hashedPassword,
          fullName: "Dr. Mohammad Rahman",
          designation: "Professor",
          phone: "01712345678",
          officeRoom: "Room 401",
          bio: "Expert in Digital Electronics and VLSI Design with over 20 years of teaching experience.",
          role: "teacher",
          department: "Information & Communication Engineering",
        },
      }),
      db.user.create({
        data: {
          email: "farhana@ru.ac.bd",
          password: hashedPassword,
          fullName: "Dr. Farhana Akter",
          designation: "Associate Professor",
          phone: "01712345679",
          officeRoom: "Room 402",
          bio: "Specializes in Communication Systems and Signal Processing.",
          role: "teacher",
          department: "Information & Communication Engineering",
        },
      }),
      db.user.create({
        data: {
          email: "kamal@ru.ac.bd",
          password: hashedPassword,
          fullName: "Md. Kamal Hossain",
          designation: "Assistant Professor",
          phone: "01712345680",
          officeRoom: "Room 403",
          bio: "Research interests include Embedded Systems and IoT.",
          role: "teacher",
          department: "Information & Communication Engineering",
        },
      }),
      db.user.create({
        data: {
          email: "nafisa@ru.ac.bd",
          password: hashedPassword,
          fullName: "Dr. Nafisa Islam",
          designation: "Associate Professor",
          phone: "01712345681",
          officeRoom: "Room 404",
          bio: "Expert in Mathematics and Algorithm Design.",
          role: "teacher",
          department: "Information & Communication Engineering",
        },
      }),
      db.user.create({
        data: {
          email: "tanvir@ru.ac.bd",
          password: hashedPassword,
          fullName: "Tanvir Ahmed",
          designation: "Lecturer",
          phone: "01712345682",
          officeRoom: "Room 405",
          bio: "Recently joined faculty, specializing in Physics and Basic Electronics.",
          role: "teacher",
          department: "Information & Communication Engineering",
        },
      }),
    ]);

    // 3. Create Time Slots
    const timeSlots = await Promise.all([
      db.timeSlot.create({
        data: { label: "1st Period", startTime: "08:00", endTime: "08:50", slotOrder: 1, isBreak: false },
      }),
      db.timeSlot.create({
        data: { label: "2nd Period", startTime: "09:00", endTime: "09:50", slotOrder: 2, isBreak: false },
      }),
      db.timeSlot.create({
        data: { label: "3rd Period", startTime: "10:00", endTime: "10:50", slotOrder: 3, isBreak: false },
      }),
      db.timeSlot.create({
        data: { label: "4th Period", startTime: "11:00", endTime: "11:50", slotOrder: 4, isBreak: false },
      }),
      db.timeSlot.create({
        data: { label: "5th Period", startTime: "12:00", endTime: "12:50", slotOrder: 5, isBreak: false },
      }),
      db.timeSlot.create({
        data: { label: "Break", startTime: "12:50", endTime: "14:00", slotOrder: 6, isBreak: true },
      }),
      db.timeSlot.create({
        data: { label: "6th Period", startTime: "14:00", endTime: "14:50", slotOrder: 7, isBreak: false },
      }),
      db.timeSlot.create({
        data: { label: "7th Period", startTime: "15:00", endTime: "15:50", slotOrder: 8, isBreak: false },
      }),
      db.timeSlot.create({
        data: { label: "8th Period", startTime: "16:00", endTime: "16:50", slotOrder: 9, isBreak: false },
      }),
    ]);

    // 4. Create Rooms
    const rooms = await Promise.all([
      db.room.create({
        data: { roomNumber: "301", building: "Main Building", type: "classroom", capacity: 60 },
      }),
      db.room.create({
        data: { roomNumber: "302", building: "Main Building", type: "classroom", capacity: 60 },
      }),
      db.room.create({
        data: { roomNumber: "303", building: "Main Building", type: "classroom", capacity: 40 },
      }),
      db.room.create({
        data: { roomNumber: "405", building: "Science Building", type: "classroom", capacity: 50 },
      }),
      db.room.create({
        data: { roomNumber: "Lab 201", building: "ICE Building", type: "lab", capacity: 30 },
      }),
      db.room.create({
        data: { roomNumber: "Lab 202", building: "ICE Building", type: "lab", capacity: 30 },
      }),
      db.room.create({
        data: { roomNumber: "Seminar Room", building: "Main Building", type: "seminar", capacity: 100 },
      }),
    ]);

    // 5. Create Courses (1st Year, 1st Semester)
    const courses = await Promise.all([
      db.course.create({
        data: { name: "Digital Electronics", code: "ICE-1101", creditHours: 3, type: "theory", year: 1, semester: 1 },
      }),
      db.course.create({
        data: { name: "Digital Electronics Lab", code: "ICE-1102", creditHours: 1.5, type: "lab", year: 1, semester: 1 },
      }),
      db.course.create({
        data: { name: "Electrical Circuit Analysis", code: "ICE-1103", creditHours: 3, type: "theory", year: 1, semester: 1 },
      }),
      db.course.create({
        data: { name: "Electrical Circuit Analysis Lab", code: "ICE-1104", creditHours: 1.5, type: "lab", year: 1, semester: 1 },
      }),
      db.course.create({
        data: { name: "Mathematics-I", code: "ICE-1105", creditHours: 3, type: "theory", year: 1, semester: 1 },
      }),
      db.course.create({
        data: { name: "Physics", code: "ICE-1106", creditHours: 3, type: "theory", year: 1, semester: 1 },
      }),
      db.course.create({
        data: { name: "English", code: "ICE-1107", creditHours: 2, type: "theory", year: 1, semester: 1 },
      }),
    ]);

    // 6. Create Sample Schedules
    const scheduleData = [
      // Saturday
      { day: "saturday", courseId: courses[0].id, teacherId: teachers[0].id, roomId: rooms[0].id, timeSlotId: timeSlots[0].id },
      { day: "saturday", courseId: courses[4].id, teacherId: teachers[3].id, roomId: rooms[1].id, timeSlotId: timeSlots[1].id },
      { day: "saturday", courseId: courses[5].id, teacherId: teachers[4].id, roomId: rooms[0].id, timeSlotId: timeSlots[2].id },
      
      // Sunday
      { day: "sunday", courseId: courses[2].id, teacherId: teachers[2].id, roomId: rooms[0].id, timeSlotId: timeSlots[0].id },
      { day: "sunday", courseId: courses[6].id, teacherId: teachers[1].id, roomId: rooms[2].id, timeSlotId: timeSlots[1].id },
      { day: "sunday", courseId: courses[1].id, teacherId: teachers[0].id, roomId: rooms[4].id, timeSlotId: timeSlots[6].id },
      
      // Monday
      { day: "monday", courseId: courses[4].id, teacherId: teachers[3].id, roomId: rooms[1].id, timeSlotId: timeSlots[0].id },
      { day: "monday", courseId: courses[0].id, teacherId: teachers[0].id, roomId: rooms[0].id, timeSlotId: timeSlots[1].id },
      { day: "monday", courseId: courses[2].id, teacherId: teachers[2].id, roomId: rooms[0].id, timeSlotId: timeSlots[2].id },
      
      // Tuesday
      { day: "tuesday", courseId: courses[5].id, teacherId: teachers[4].id, roomId: rooms[1].id, timeSlotId: timeSlots[0].id },
      { day: "tuesday", courseId: courses[6].id, teacherId: teachers[1].id, roomId: rooms[0].id, timeSlotId: timeSlots[1].id },
      { day: "tuesday", courseId: courses[3].id, teacherId: teachers[2].id, roomId: rooms[5].id, timeSlotId: timeSlots[6].id },
      
      // Wednesday
      { day: "wednesday", courseId: courses[0].id, teacherId: teachers[0].id, roomId: rooms[0].id, timeSlotId: timeSlots[0].id },
      { day: "wednesday", courseId: courses[4].id, teacherId: teachers[3].id, roomId: rooms[1].id, timeSlotId: timeSlots[1].id },
      { day: "wednesday", courseId: courses[2].id, teacherId: teachers[2].id, roomId: rooms[2].id, timeSlotId: timeSlots[2].id },
      
      // Thursday
      { day: "thursday", courseId: courses[5].id, teacherId: teachers[4].id, roomId: rooms[0].id, timeSlotId: timeSlots[0].id },
      { day: "thursday", courseId: courses[1].id, teacherId: teachers[0].id, roomId: rooms[4].id, timeSlotId: timeSlots[6].id },
    ];

    for (const sched of scheduleData) {
      const course = courses.find(c => c.id === sched.courseId);
      const teacher = teachers.find(t => t.id === sched.teacherId);
      const room = rooms.find(r => r.id === sched.roomId);
      const timeSlot = timeSlots.find(t => t.id === sched.timeSlotId);

      if (course && teacher && room && timeSlot) {
        await db.schedule.create({
          data: {
            ...sched,
            courseName: course.name,
            courseCode: course.code,
            teacherName: teacher.fullName,
            roomNumber: room.roomNumber,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            year: course.year,
            semester: course.semester,
            section: "A",
            classType: course.type,
          },
        });
      }
    }

    // 7. Create Sample Notices
    await Promise.all([
      db.notice.create({
        data: {
          title: "Mid-term Exam Schedule Published",
          content: "The mid-term examination schedule for Spring 2025 has been published. Please check the academic section for details. All students are advised to collect their admit cards from the department office.",
          category: "exam",
          postedBy: admin.id,
          postedByName: admin.fullName,
          isPinned: true,
          isApproved: true,
        },
      }),
      db.notice.create({
        data: {
          title: "Departmental Seminar on 5G Technology",
          content: "A seminar on 'Next Generation 5G Technology and Its Applications' will be held on March 20, 2025 at the Seminar Room. All students and faculty members are cordially invited to attend.",
          category: "event",
          postedBy: teachers[0].id,
          postedByName: teachers[0].fullName,
          isPinned: true,
          isApproved: true,
        },
      }),
      db.notice.create({
        data: {
          title: "Class Suspended on March 26 (Independence Day)",
          content: "All classes will remain suspended on March 26, 2025, on the occasion of Independence Day. Classes will resume as usual from March 27.",
          category: "general",
          postedBy: admin.id,
          postedByName: admin.fullName,
          isPinned: false,
          isApproved: true,
        },
      }),
    ]);

    // 8. Create Academic Calendar Events
    await Promise.all([
      db.academicCalendar.create({
        data: {
          title: "Spring 2025 Semester Begins",
          date: new Date("2025-01-05"),
          eventType: "class",
          description: "Classes for Spring 2025 semester begin",
        },
      }),
      db.academicCalendar.create({
        data: {
          title: "Mid-term Examination",
          date: new Date("2025-03-10"),
          endDate: new Date("2025-03-20"),
          eventType: "exam",
          description: "Mid-term examination for all courses",
        },
      }),
      db.academicCalendar.create({
        data: {
          title: "Independence Day",
          date: new Date("2025-03-26"),
          eventType: "holiday",
          description: "National Holiday",
        },
      }),
      db.academicCalendar.create({
        data: {
          title: "Bengali New Year",
          date: new Date("2025-04-14"),
          eventType: "holiday",
          description: "Pohela Boishakh",
        },
      }),
      db.academicCalendar.create({
        data: {
          title: "Final Examination",
          date: new Date("2025-05-15"),
          endDate: new Date("2025-05-30"),
          eventType: "exam",
          description: "Final examination for Spring 2025 semester",
        },
      }),
    ]);

    // 9. Create Site Settings
    await db.siteSettings.create({
      data: {
        id: "general",
        departmentName: "Information & Communication Engineering",
        universityName: "Rajshahi University",
        contactEmail: "ice@ru.ac.bd",
        contactPhone: "+880-721-750123",
        address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
        aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research in the fields of information technology and communication systems.",
        facebookURL: "https://facebook.com/iceru",
        websiteURL: "https://ice.ru.ac.bd",
      },
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
