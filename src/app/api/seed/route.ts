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

    // 2. Create Teachers (More teachers for testing)
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
      createUser({
        email: "rahim@ru.ac.bd",
        password: hashedPassword,
        fullName: "Dr. Abdur Rahim",
        designation: "Professor",
        phone: "01712345683",
        officeRoom: "Room 406",
        bio: "Expert in Computer Networks and Cybersecurity.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "sabrina@ru.ac.bd",
        password: hashedPassword,
        fullName: "Dr. Sabrina Khan",
        designation: "Associate Professor",
        phone: "01712345684",
        officeRoom: "Room 407",
        bio: "Specializes in Artificial Intelligence and Machine Learning.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "jamil@ru.ac.bd",
        password: hashedPassword,
        fullName: "Md. Jamil Hossain",
        designation: "Assistant Professor",
        phone: "01712345685",
        officeRoom: "Room 408",
        bio: "Research focus on Wireless Communication and 5G Technology.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "rumana@ru.ac.bd",
        password: hashedPassword,
        fullName: "Dr. Rumana Begum",
        designation: "Professor",
        phone: "01712345686",
        officeRoom: "Room 409",
        bio: "Expert in Database Systems and Software Engineering.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "asif@ru.ac.bd",
        password: hashedPassword,
        fullName: "Asif Mahmud",
        designation: "Lecturer",
        phone: "01712345687",
        officeRoom: "Room 410",
        bio: "Specializes in Web Technologies and Cloud Computing.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "fatema@ru.ac.bd",
        password: hashedPassword,
        fullName: "Dr. Fatema Khatun",
        designation: "Associate Professor",
        phone: "01712345688",
        officeRoom: "Room 411",
        bio: "Expert in Control Systems and Robotics.",
        role: "teacher",
        department: "Information & Communication Engineering",
        isActive: true,
      }),
      createUser({
        email: "hasan@ru.ac.bd",
        password: hashedPassword,
        fullName: "Dr. Hasan Mahmud",
        designation: "Professor",
        phone: "01712345689",
        officeRoom: "Room 412",
        bio: "Specializes in Image Processing and Computer Vision.",
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
      createTimeSlot({ label: "Lunch Break", startTime: "12:50", endTime: "14:00", slotOrder: 6, isBreak: true, isActive: true }),
      createTimeSlot({ label: "6th Period", startTime: "14:00", endTime: "14:50", slotOrder: 7, isBreak: false, isActive: true }),
      createTimeSlot({ label: "7th Period", startTime: "15:00", endTime: "15:50", slotOrder: 8, isBreak: false, isActive: true }),
      createTimeSlot({ label: "8th Period", startTime: "16:00", endTime: "16:50", slotOrder: 9, isBreak: false, isActive: true }),
    ]);

    // 4. Create Rooms (More rooms)
    const rooms = await Promise.all([
      createRoom({ roomNumber: "301", building: "Main Building", type: "classroom", capacity: 60, isActive: true }),
      createRoom({ roomNumber: "302", building: "Main Building", type: "classroom", capacity: 60, isActive: true }),
      createRoom({ roomNumber: "303", building: "Main Building", type: "classroom", capacity: 40, isActive: true }),
      createRoom({ roomNumber: "304", building: "Main Building", type: "classroom", capacity: 50, isActive: true }),
      createRoom({ roomNumber: "305", building: "Main Building", type: "classroom", capacity: 55, isActive: true }),
      createRoom({ roomNumber: "401", building: "Science Building", type: "classroom", capacity: 50, isActive: true }),
      createRoom({ roomNumber: "402", building: "Science Building", type: "classroom", capacity: 50, isActive: true }),
      createRoom({ roomNumber: "403", building: "Science Building", type: "classroom", capacity: 45, isActive: true }),
      createRoom({ roomNumber: "Lab 101", building: "ICE Building", type: "lab", capacity: 30, isActive: true }),
      createRoom({ roomNumber: "Lab 102", building: "ICE Building", type: "lab", capacity: 30, isActive: true }),
      createRoom({ roomNumber: "Lab 201", building: "ICE Building", type: "lab", capacity: 30, isActive: true }),
      createRoom({ roomNumber: "Lab 202", building: "ICE Building", type: "lab", capacity: 30, isActive: true }),
      createRoom({ roomNumber: "Computer Lab 1", building: "ICE Building", type: "lab", capacity: 40, isActive: true }),
      createRoom({ roomNumber: "Computer Lab 2", building: "ICE Building", type: "lab", capacity: 40, isActive: true }),
      createRoom({ roomNumber: "Seminar Room", building: "Main Building", type: "seminar", capacity: 100, isActive: true }),
    ]);

    // 5. Create Courses for all years and semesters (BSC)
    const coursesBSC = await Promise.all([
      // 1st Year 1st Semester
      createCourse({ name: "Digital Electronics", code: "ICE-1101", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Digital Electronics Lab", code: "ICE-1102", creditHours: 1.5, type: "lab", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Electrical Circuit Analysis", code: "ICE-1103", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Electrical Circuit Lab", code: "ICE-1104", creditHours: 1.5, type: "lab", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Mathematics-I", code: "ICE-1105", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Physics-I", code: "ICE-1106", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "English", code: "ICE-1107", creditHours: 2, type: "theory", year: 1, semester: 1, isActive: true }),
      // 1st Year 2nd Semester
      createCourse({ name: "Analog Electronics", code: "ICE-1201", creditHours: 3, type: "theory", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Analog Electronics Lab", code: "ICE-1202", creditHours: 1.5, type: "lab", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Signals and Systems", code: "ICE-1203", creditHours: 3, type: "theory", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Mathematics-II", code: "ICE-1204", creditHours: 3, type: "theory", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Physics-II", code: "ICE-1205", creditHours: 3, type: "theory", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Programming Fundamentals", code: "ICE-1206", creditHours: 3, type: "theory", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Programming Lab", code: "ICE-1207", creditHours: 1.5, type: "lab", year: 1, semester: 2, isActive: true }),
      // 2nd Year 1st Semester
      createCourse({ name: "Data Structures", code: "ICE-2101", creditHours: 3, type: "theory", year: 2, semester: 1, isActive: true }),
      createCourse({ name: "Data Structures Lab", code: "ICE-2102", creditHours: 1.5, type: "lab", year: 2, semester: 1, isActive: true }),
      createCourse({ name: "Microprocessors", code: "ICE-2103", creditHours: 3, type: "theory", year: 2, semester: 1, isActive: true }),
      createCourse({ name: "Microprocessors Lab", code: "ICE-2104", creditHours: 1.5, type: "lab", year: 2, semester: 1, isActive: true }),
      createCourse({ name: "Electromagnetic Fields", code: "ICE-2105", creditHours: 3, type: "theory", year: 2, semester: 1, isActive: true }),
      createCourse({ name: "Mathematics-III", code: "ICE-2106", creditHours: 3, type: "theory", year: 2, semester: 1, isActive: true }),
      // 2nd Year 2nd Semester
      createCourse({ name: "Computer Networks", code: "ICE-2201", creditHours: 3, type: "theory", year: 2, semester: 2, isActive: true }),
      createCourse({ name: "Networks Lab", code: "ICE-2202", creditHours: 1.5, type: "lab", year: 2, semester: 2, isActive: true }),
      createCourse({ name: "Database Systems", code: "ICE-2203", creditHours: 3, type: "theory", year: 2, semester: 2, isActive: true }),
      createCourse({ name: "Database Lab", code: "ICE-2204", creditHours: 1.5, type: "lab", year: 2, semester: 2, isActive: true }),
      createCourse({ name: "Communication Systems", code: "ICE-2205", creditHours: 3, type: "theory", year: 2, semester: 2, isActive: true }),
      createCourse({ name: "Communication Lab", code: "ICE-2206", creditHours: 1.5, type: "lab", year: 2, semester: 2, isActive: true }),
      // 3rd Year 1st Semester
      createCourse({ name: "Operating Systems", code: "ICE-3101", creditHours: 3, type: "theory", year: 3, semester: 1, isActive: true }),
      createCourse({ name: "OS Lab", code: "ICE-3102", creditHours: 1.5, type: "lab", year: 3, semester: 1, isActive: true }),
      createCourse({ name: "Digital Signal Processing", code: "ICE-3103", creditHours: 3, type: "theory", year: 3, semester: 1, isActive: true }),
      createCourse({ name: "DSP Lab", code: "ICE-3104", creditHours: 1.5, type: "lab", year: 3, semester: 1, isActive: true }),
      createCourse({ name: "Algorithms", code: "ICE-3105", creditHours: 3, type: "theory", year: 3, semester: 1, isActive: true }),
      createCourse({ name: "VLSI Design", code: "ICE-3106", creditHours: 3, type: "theory", year: 3, semester: 1, isActive: true }),
      // 3rd Year 2nd Semester
      createCourse({ name: "Software Engineering", code: "ICE-3201", creditHours: 3, type: "theory", year: 3, semester: 2, isActive: true }),
      createCourse({ name: "Software Eng Lab", code: "ICE-3202", creditHours: 1.5, type: "lab", year: 3, semester: 2, isActive: true }),
      createCourse({ name: "Control Systems", code: "ICE-3203", creditHours: 3, type: "theory", year: 3, semester: 2, isActive: true }),
      createCourse({ name: "Control Lab", code: "ICE-3204", creditHours: 1.5, type: "lab", year: 3, semester: 2, isActive: true }),
      createCourse({ name: "Wireless Communication", code: "ICE-3205", creditHours: 3, type: "theory", year: 3, semester: 2, isActive: true }),
      createCourse({ name: "Antenna Theory", code: "ICE-3206", creditHours: 3, type: "theory", year: 3, semester: 2, isActive: true }),
      // 4th Year 1st Semester
      createCourse({ name: "Artificial Intelligence", code: "ICE-4101", creditHours: 3, type: "theory", year: 4, semester: 1, isActive: true }),
      createCourse({ name: "AI Lab", code: "ICE-4102", creditHours: 1.5, type: "lab", year: 4, semester: 1, isActive: true }),
      createCourse({ name: "Image Processing", code: "ICE-4103", creditHours: 3, type: "theory", year: 4, semester: 1, isActive: true }),
      createCourse({ name: "Image Proc Lab", code: "ICE-4104", creditHours: 1.5, type: "lab", year: 4, semester: 1, isActive: true }),
      createCourse({ name: "Cybersecurity", code: "ICE-4105", creditHours: 3, type: "theory", year: 4, semester: 1, isActive: true }),
      createCourse({ name: "IoT Systems", code: "ICE-4106", creditHours: 3, type: "theory", year: 4, semester: 1, isActive: true }),
      // 4th Year 2nd Semester
      createCourse({ name: "Machine Learning", code: "ICE-4201", creditHours: 3, type: "theory", year: 4, semester: 2, isActive: true }),
      createCourse({ name: "ML Lab", code: "ICE-4202", creditHours: 1.5, type: "lab", year: 4, semester: 2, isActive: true }),
      createCourse({ name: "Cloud Computing", code: "ICE-4203", creditHours: 3, type: "theory", year: 4, semester: 2, isActive: true }),
      createCourse({ name: "Project Work", code: "ICE-4204", creditHours: 4, type: "theory", year: 4, semester: 2, isActive: true }),
      createCourse({ name: "Mobile Computing", code: "ICE-4205", creditHours: 3, type: "theory", year: 4, semester: 2, isActive: true }),
    ]);

    // 6. Create Courses for MSC
    const coursesMSC = await Promise.all([
      // MSC 1st Year 1st Semester
      createCourse({ name: "Advanced Digital Communication", code: "ICE-6101", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Advanced Signal Processing", code: "ICE-6102", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Research Methodology", code: "ICE-6103", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Advanced Electronics", code: "ICE-6104", creditHours: 3, type: "theory", year: 1, semester: 1, isActive: true }),
      createCourse({ name: "Advanced Electronics Lab", code: "ICE-6105", creditHours: 1.5, type: "lab", year: 1, semester: 1, isActive: true }),
      // MSC 1st Year 2nd Semester
      createCourse({ name: "Advanced Networking", code: "ICE-6201", creditHours: 3, type: "theory", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Deep Learning", code: "ICE-6202", creditHours: 3, type: "theory", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Deep Learning Lab", code: "ICE-6203", creditHours: 1.5, type: "lab", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Embedded Systems", code: "ICE-6204", creditHours: 3, type: "theory", year: 1, semester: 2, isActive: true }),
      createCourse({ name: "Embedded Lab", code: "ICE-6205", creditHours: 1.5, type: "lab", year: 1, semester: 2, isActive: true }),
      // MSC 2nd Year 1st Semester
      createCourse({ name: "Fiber Optic Communication", code: "ICE-7101", creditHours: 3, type: "theory", year: 2, semester: 1, isActive: true }),
      createCourse({ name: "Satellite Communication", code: "ICE-7102", creditHours: 3, type: "theory", year: 2, semester: 1, isActive: true }),
      createCourse({ name: "Advanced VLSI", code: "ICE-7103", creditHours: 3, type: "theory", year: 2, semester: 1, isActive: true }),
      createCourse({ name: "VLSI Lab", code: "ICE-7104", creditHours: 1.5, type: "lab", year: 2, semester: 1, isActive: true }),
      // MSC 2nd Year 2nd Semester
      createCourse({ name: "Thesis Research", code: "ICE-7201", creditHours: 6, type: "theory", year: 2, semester: 2, isActive: true }),
      createCourse({ name: "Advanced IoT", code: "ICE-7202", creditHours: 3, type: "theory", year: 2, semester: 2, isActive: true }),
    ]);

    const allCourses = [...coursesBSC, ...coursesMSC];

    // Days of the week (including Friday and Saturday)
    const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

    // 7. Create Comprehensive Schedules with Friday and Saturday
    const scheduleData: any[] = [];

    // Helper function to get random elements
    const getTeacher = (index: number) => teachers[index % teachers.length];
    const getRoom = (index: number, isLab: boolean) => {
      if (isLab) return rooms[8 + (index % 6)]; // Labs are from index 8
      return rooms[index % 8]; // Classrooms are from index 0-7
    };
    const getTimeSlot = (index: number) => timeSlots[index % 6]; // Periods 1-6 (skip break)

    // Generate schedules for BSC - All 4 years, both semesters
    for (let year = 1; year <= 4; year++) {
      for (let semester = 1; semester <= 2; semester++) {
        const yearCourses = coursesBSC.filter(c => c.year === year && c.semester === semester);
        
        // For each day of the week (including Friday and Saturday)
        days.forEach((day, dayIndex) => {
          // Assign 3-4 classes per day
          const classesPerDay = 3 + Math.floor(Math.random() * 2);
          
          for (let i = 0; i < classesPerDay; i++) {
            const courseIndex = (dayIndex * classesPerDay + i) % yearCourses.length;
            const course = yearCourses[courseIndex];
            
            if (course) {
              const teacherIndex = (year * 10 + semester * 5 + dayIndex + i) % teachers.length;
              const slotIndex = i; // Spread across different time slots
              
              scheduleData.push({
                dayOfWeek: day,
                courseId: course.id,
                teacherId: teachers[teacherIndex].id,
                roomId: getRoom(dayIndex + i, course.type === "lab").id,
                timeSlotId: timeSlots[slotIndex].id,
                year: year,
                semester: semester,
                program: "bsc"
              });
            }
          }
        });
      }
    }

    // Generate schedules for MSC - Both years, both semesters
    for (let year = 1; year <= 2; year++) {
      for (let semester = 1; semester <= 2; semester++) {
        const yearCourses = coursesMSC.filter(c => c.year === year && c.semester === semester);
        
        // For each day (including Friday and Saturday)
        days.forEach((day, dayIndex) => {
          // Assign 2-3 classes per day for MSC
          const classesPerDay = 2 + Math.floor(Math.random() * 2);
          
          for (let i = 0; i < classesPerDay; i++) {
            const courseIndex = (dayIndex * classesPerDay + i) % yearCourses.length;
            const course = yearCourses[courseIndex];
            
            if (course) {
              const teacherIndex = (year * 10 + semester * 5 + dayIndex + i + 5) % teachers.length;
              const slotIndex = (i + 2) % 6; // Different time slots
              
              scheduleData.push({
                dayOfWeek: day,
                courseId: course.id,
                teacherId: teachers[teacherIndex].id,
                roomId: getRoom(dayIndex + i + 7, course.type === "lab").id,
                timeSlotId: timeSlots[slotIndex].id,
                year: year,
                semester: semester,
                program: "msc"
              });
            }
          }
        });
      }
    }

    // Create all schedules
    for (const sched of scheduleData) {
      const course = allCourses.find(c => c.id === sched.courseId);
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

    // 8. Create Sample Notices
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
      createNotice({
        title: "Lab Class Rescheduled",
        content: "The Digital Electronics Lab scheduled for Friday has been rescheduled to Saturday due to equipment maintenance. All students of 1st year are requested to note the change.",
        category: "schedule_change",
        postedBy: teachers[0].id,
        postedByName: teachers[0].fullName,
        isPinned: false,
        isApproved: true,
        isAutoGenerated: false,
        affectedYear: 1,
        affectedSemester: 1,
        affectedProgram: "bsc",
      }),
      createNotice({
        title: "Guest Lecture on IoT",
        content: "A guest lecture on 'Internet of Things: Future Trends and Career Opportunities' will be delivered by industry experts on April 5, 2025. All ICE students are encouraged to attend.",
        category: "event",
        postedBy: teachers[2].id,
        postedByName: teachers[2].fullName,
        isPinned: false,
        isApproved: true,
        isAutoGenerated: false,
      }),
      createNotice({
        title: "Assignment Submission Deadline Extended",
        content: "The deadline for submission of the Signal Processing assignment has been extended to April 10, 2025. Students who have already submitted may revise their work if desired.",
        category: "academic",
        postedBy: teachers[1].id,
        postedByName: teachers[1].fullName,
        isPinned: false,
        isApproved: true,
        isAutoGenerated: false,
      }),
    ]);

    // 9. Create Academic Calendar Events
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
      createCalendarEvent({
        title: "Summer Vacation",
        date: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        eventType: "holiday",
        description: "Summer vacation",
      }),
      createCalendarEvent({
        title: "Fall Semester Begins",
        date: new Date("2025-07-01"),
        eventType: "class",
        description: "Fall 2025 semester begins",
      }),
    ]);

    // 10. Create Site Settings
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
      message: "Database seeded successfully with comprehensive data!",
      data: {
        teachers: teachers.length,
        timeSlots: timeSlots.length,
        rooms: rooms.length,
        coursesBSC: coursesBSC.length,
        coursesMSC: coursesMSC.length,
        totalCourses: allCourses.length,
        schedules: scheduleData.length,
        days: days.length,
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
