import { dbStore } from "./db/store.js";

async function runTests() {
  console.log("🧪 Starting Course Quizzes & Database System Verification...\n");

  // 1. Fetch quizzes for SMMA Course
  const courseId = "course-smma-accelerator";
  const quizzes = await dbStore.getQuizzesByCourse(courseId);
  console.log(`✅ Step 1: Fetched ${quizzes.length} quiz(zes) for ${courseId}:`);
  quizzes.forEach(q => console.log(`   - [${q.id}] ${q.title} (${q.questions ? q.questions.length : 0} questions, Pass: ${q.passing_score}%)`));

  // 2. Create a new test quiz
  const newQuizData = {
    title: "Module 3: Capstone SMMA Audit Quiz",
    description: "Final evaluation quiz testing client outreach, proposals, and team scaling.",
    time_limit_mins: 25,
    passing_score: 80,
    status: "active",
    questions: [
      {
        question_text: "What is the recommended retainer price for high-ticket Ethiopian SMMA clients?",
        question_type: "multiple_choice",
        options: ["1,000 ETB", "10,000 ETB", "500 ETB", "Free"],
        correct_answer: "10,000 ETB",
        explanation: "High-ticket retainers start at 10,000 ETB for full service agency execution.",
        points: 10
      }
    ]
  };

  const createdQuiz = await dbStore.createQuiz(courseId, newQuizData);
  console.log(`\n✅ Step 2: Created New Quiz: [${createdQuiz.id}] "${createdQuiz.title}"`);

  // 3. Submit quiz test result
  const submission = await dbStore.submitQuizResult({
    quiz_id: createdQuiz.id,
    course_id: courseId,
    student_id: "#STD-TEST-001",
    student_name: "Verification Student",
    score: 100,
    total_questions: 1,
    passed: true
  });
  console.log(`\n✅ Step 3: Submitted Quiz Result: Student ${submission.student_name} scored ${submission.score}% (Passed: ${submission.passed})`);

  // 4. Fetch Submissions
  const submissions = await dbStore.getQuizSubmissions(courseId);
  console.log(`\n✅ Step 4: Total Submissions for ${courseId}: ${submissions.length}`);

  // 5. Cleanup Test Quiz
  await dbStore.deleteQuiz(createdQuiz.id);
  console.log(`\n✅ Step 5: Deleted test quiz [${createdQuiz.id}] successfully!`);

  console.log("\n🎉 ALL QUIZ SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!");
}

runTests().catch(err => {
  console.error("❌ Verification Failed:", err);
  process.exit(1);
});
