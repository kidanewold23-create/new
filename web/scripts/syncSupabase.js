import { dbStore, supabase } from "../db/store.js";

async function pushAllToSupabase() {
  console.log("🚀 Syncing and Pushing All Data Directly to Supabase Database...");

  try {
    // 1. Courses
    const courses = await dbStore.getCourses();
    console.log(`Pushing ${courses.length} courses to Supabase...`);
    for (const course of courses) {
      await supabase.from("courses").upsert([{
        id: course.id,
        title: course.title,
        category: course.category,
        price: course.price,
        duration: course.duration || "6 Weeks",
        description: course.description,
        tg_channel: course.tg_channel || "",
        tg_group: course.tg_group || "",
        status: course.status || "ON",
        enrolled_students: course.enrolled_students || 0
      }], { onConflict: "id" });
    }

    // 2. Categories
    const categories = await dbStore.getCategories();
    console.log(`Pushing ${categories.length} categories to Supabase...`);
    for (const cat of categories) {
      await supabase.from("categories").upsert([{
        id: cat.id,
        name: cat.name,
        status: cat.status || "ON"
      }], { onConflict: "id" });
    }

    // 3. Students
    const students = await dbStore.getStudents();
    console.log(`Pushing ${students.length} students to Supabase...`);
    for (const stu of students) {
      await supabase.from("students").upsert([{
        id: stu.id,
        name: stu.name,
        phone: stu.phone,
        email: stu.email || "",
        joined_date: stu.joined_date || new Date().toLocaleDateString()
      }], { onConflict: "id" });
    }

    // 4. Maintenance
    const maintenance = await dbStore.getMaintenance();
    console.log("Pushing maintenance config to Supabase...");
    await supabase.from("maintenance").upsert([{
      id: 1,
      status: maintenance.status || "OFF",
      title: maintenance.title || "Scheduled Maintenance",
      message: maintenance.message || "System upgrading."
    }], { onConflict: "id" });

    // 5. Landing Config
    const landingConfig = await dbStore.getLandingConfig();
    console.log("Pushing landing CMS config to Supabase...");
    await supabase.from("landing_config").upsert([{
      id: 1,
      config: landingConfig
    }], { onConflict: "id" });

    // 6. Quizzes
    for (const course of courses) {
      const quizzes = await dbStore.getQuizzesByCourse(course.id);
      if (quizzes && quizzes.length > 0) {
        console.log(`Pushing ${quizzes.length} quizzes for course ${course.title} to Supabase...`);
        for (const quiz of quizzes) {
          await supabase.from("course_quizzes").upsert([{
            id: quiz.id,
            course_id: quiz.course_id,
            title: quiz.title,
            description: quiz.description || "",
            time_limit_mins: quiz.time_limit_mins || 15,
            passing_score: quiz.passing_score || 70,
            status: quiz.status || "active"
          }], { onConflict: "id" });

          if (quiz.questions && quiz.questions.length > 0) {
            for (const q of quiz.questions) {
              await supabase.from("quiz_questions").upsert([{
                id: q.id,
                quiz_id: quiz.id,
                course_id: quiz.course_id,
                question_text: q.question_text,
                question_type: q.question_type || "multiple_choice",
                options: q.options || [],
                correct_answer: q.correct_answer,
                explanation: q.explanation || "",
                points: q.points || 10,
                sort_order: q.sort_order || 1
              }], { onConflict: "id" });
            }
          }
        }
      }
    }

    console.log("✅ All data, tables, courses, quizzes, and configurations successfully pushed to Supabase!");
  } catch (err) {
    console.error("❌ Error pushing to Supabase:", err);
  }
}

pushAllToSupabase();
