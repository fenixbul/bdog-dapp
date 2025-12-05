import Time "mo:base/Time";
import Principal "mo:base/Principal";

module {
  // ID Types
  public type ModuleId = Nat;
  public type LessonId = Nat;
  public type QuizId = Nat;
  public type QuestionId = Nat;

  // Module Status
  public type ModuleStatus = { #Draft; #Published };

  // Question Type
  public type Question = {
    id : QuestionId;
    questionText : Text;
    options : [Text];
    correctAnswer : Nat; // index into options array
    points : Nat;
  };

  // Quiz Type
  public type Quiz = {
    id : QuizId;
    title : Text;
    description : ?Text;
    questions : [Question];
    passingScore : Nat; // percentage (0-100)
    timeLimit : ?Time.Time; // optional time limit in nanoseconds
  };

  // Question Type Without Answer (for public quiz start)
  public type QuestionWithoutAnswer = {
    id : QuestionId;
    questionText : Text;
    options : [Text];
    points : Nat;
  };

  // Quiz Type Without Answers (for public quiz start)
  public type QuizWithoutAnswers = {
    id : QuizId;
    title : Text;
    description : ?Text;
    questions : [QuestionWithoutAnswer];
    passingScore : Nat; // percentage (0-100)
    timeLimit : ?Time.Time; // optional time limit in nanoseconds
  };

  // Quiz Summary Type (without questions, for get_module)
  public type QuizSummary = {
    id : QuizId;
    title : Text;
    description : ?Text;
    passingScore : Nat; // percentage (0-100)
    timeLimit : ?Time.Time; // optional time limit in nanoseconds
  };

  // Lesson Type
  public type Lesson = {
    id : LessonId;
    data : Text; // JSON string containing title, content, icon/image, etc.
    order : Nat;
  };

  // Module Type
  public type Module = {
    id : ModuleId;
    title : Text;
    description : ?Text;
    createdAt : Time.Time;
    createdBy : Principal;
    lessons : [Lesson];
    quizzes : [QuizSummary]; // Changed from [Quiz] to hide questions
    status : ModuleStatus;
    order : Nat;
  };

  // Module With User State Type (includes completion status)
  public type ModuleWithUserState = {
    moduleData : Module;
    isCompleted : Bool;
    completedAt : ?Time.Time;
  };

  // Answer Submission Type
  public type AnswerSubmission = {
    questionId : QuestionId;
    answer : Nat; // index into options array
  };

  // Quiz Attempt Type
  public type QuizAttempt = {
    moduleId : ModuleId;
    quizId : QuizId;
    userId : Principal;
    quizStartedAt : Time.Time;
    completedAt : ?Time.Time;
    score : ?Nat; // percentage score (0-100)
    answers : [AnswerSubmission];
    correctAnswers : [Bool]; // per-question correctness
  };

  // Quiz Feedback Type
  public type QuizFeedback = {
    isCorrect : Bool; // whether passing score was met
    score : Nat; // percentage score (0-100)
    totalScore : Nat; // total points earned
    correctAnswers : [Bool]; // per-question correctness
  };

  // Quiz Start Response Type (quiz data with attempt start time and time limit)
  public type QuizStartResponse = {
    quiz : QuizWithoutAnswers;
    quizStartedAt : Time.Time;
    timeLimit : ?Time.Time;
  };

  // Quiz Configuration Type
  public type QuizConfig = {
    defaultTimeLimit : ?Time.Time; // optional default time limit in nanoseconds
    defaultPassingScore : Nat; // percentage (0-100)
    defaultAttemptDelaySeconds : Nat; // delay in seconds between attempts
  };

  // Module Input Type (for creation)
  public type ModuleInput = {
    title : Text;
    description : ?Text;
    lessons : [Lesson];
    quizzes : [Quiz];
    status : ModuleStatus;
    order : Nat;
  };

  // Error Types
  public type Error = {
    #ModuleNotFound;
    #QuizNotFound;
    #AttemptNotFound;
    #AttemptInProgress;
    #AttemptCompleted;
    #DelayNotMet;
    #Unauthorized;
    #InvalidState;
    #InvalidAnswer;
  };
};

