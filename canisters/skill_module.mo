import Time "mo:base/Time";
import Principal "mo:base/Principal";
import TrieMap "mo:base/TrieMap";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Map "mo:map/Map";
import { phash } "mo:map/Map";
import Blob "mo:base/Blob";
import accessControl "modules/accessControl";
import SkillModuleTypes "types/skill_module";

shared ({ caller = initializer }) persistent actor class SkillModule() = this {
  // Access control
  let authorizedPrincipals = Map.new<Principal, ()>();
  Map.set(authorizedPrincipals, phash, initializer, ());

  // Stable storage for persistence
  private var moduleStorage : [(SkillModuleTypes.ModuleId, SkillModuleTypes.Module)] = [];
  private var quizStorage : [(SkillModuleTypes.ModuleId, [SkillModuleTypes.Quiz])] = []; // Store full Quiz data separately
  private var attemptStorage : [((Principal, SkillModuleTypes.ModuleId, SkillModuleTypes.QuizId), SkillModuleTypes.QuizAttempt)] = [];

  // Hash and equal functions for Nat (ModuleId)
  func nEqual(a : SkillModuleTypes.ModuleId, b : SkillModuleTypes.ModuleId) : Bool {
    a == b;
  };
  func nHash(n : SkillModuleTypes.ModuleId) : Nat32 {
    Nat32.fromNat(n);
  };

  // Helper functions for tuple key equality and hashing
  func attemptKeyEqual(a : (Principal, SkillModuleTypes.ModuleId, SkillModuleTypes.QuizId), b : (Principal, SkillModuleTypes.ModuleId, SkillModuleTypes.QuizId)) : Bool {
    let (principalA, moduleIdA, quizIdA) = a;
    let (principalB, moduleIdB, quizIdB) = b;
    principalA == principalB and moduleIdA == moduleIdB and quizIdA == quizIdB;
  };

  func attemptKeyHash(key : (Principal, SkillModuleTypes.ModuleId, SkillModuleTypes.QuizId)) : Nat32 {
    let (principal, moduleId, quizId) = key;
    // Convert Principal to Blob and hash it
    let principalBlob = Principal.toBlob(principal);
    let principalHash = Blob.hash(principalBlob);
    let moduleHash = Nat32.fromNat(moduleId);
    let quizHash = Nat32.fromNat(quizId);
    // Combine hashes using XOR
    principalHash ^ moduleHash ^ quizHash;
  };

  // Transient working maps
  private transient var modules = TrieMap.TrieMap<SkillModuleTypes.ModuleId, SkillModuleTypes.Module>(nEqual, nHash);
  private transient var lessonBuffers = TrieMap.TrieMap<SkillModuleTypes.ModuleId, Buffer.Buffer<SkillModuleTypes.Lesson>>(nEqual, nHash);
  private transient var quizBuffers = TrieMap.TrieMap<SkillModuleTypes.ModuleId, Buffer.Buffer<SkillModuleTypes.Quiz>>(nEqual, nHash);
  private transient var quizAttempts = TrieMap.TrieMap<(Principal, SkillModuleTypes.ModuleId, SkillModuleTypes.QuizId), SkillModuleTypes.QuizAttempt>(attemptKeyEqual, attemptKeyHash);

  // Module ID counter
  private var nextModuleId : SkillModuleTypes.ModuleId = 1;

  // Quiz configuration with defaults
  private var quizConfig : SkillModuleTypes.QuizConfig = {
    defaultTimeLimit = null;
    defaultPassingScore = 80; // 80% passing score
    defaultAttemptDelaySeconds = 3600; // 1 hour delay
  };

  // --- Save data before upgrade ---
  system func preupgrade() {
    // Convert Buffers to Arrays in modules before saving
    var updatedModules = Buffer.Buffer<(SkillModuleTypes.ModuleId, SkillModuleTypes.Module)>(modules.size());
    for ((moduleId, modData) in modules.entries()) {
      // Get current buffers
      let lessonsBuffer = switch (lessonBuffers.get(moduleId)) {
        case (?buf) { buf };
        case (null) { Buffer.Buffer<SkillModuleTypes.Lesson>(0) };
      };
      let quizzesBuffer = switch (quizBuffers.get(moduleId)) {
        case (?buf) { buf };
        case (null) { Buffer.Buffer<SkillModuleTypes.Quiz>(0) };
      };

      // Convert Quiz to QuizSummary for storage (Module type now uses QuizSummary)
      let quizzesSummary = Buffer.Buffer<SkillModuleTypes.QuizSummary>(quizzesBuffer.size());
      for (quiz in quizzesBuffer.vals()) {
        quizzesSummary.add({
          id = quiz.id;
          title = quiz.title;
          description = quiz.description;
          passingScore = quiz.passingScore;
          timeLimit = quiz.timeLimit;
        });
      };

      // Create updated module with arrays (quizzes as QuizSummary)
      let updatedModule : SkillModuleTypes.Module = {
        modData with
        lessons = Buffer.toArray(lessonsBuffer);
        quizzes = Buffer.toArray(quizzesSummary);
      };
      updatedModules.add((moduleId, updatedModule));
      
      // Store full Quiz data separately
      quizStorage := Array.append(quizStorage, [(moduleId, Buffer.toArray(quizzesBuffer))]);
    };
    moduleStorage := Buffer.toArray(updatedModules);
    attemptStorage := Iter.toArray(quizAttempts.entries());
  };

  // --- Restore after upgrade ---
  system func postupgrade() {
    modules := TrieMap.TrieMap<SkillModuleTypes.ModuleId, SkillModuleTypes.Module>(nEqual, nHash);
    lessonBuffers := TrieMap.TrieMap<SkillModuleTypes.ModuleId, Buffer.Buffer<SkillModuleTypes.Lesson>>(nEqual, nHash);
    quizBuffers := TrieMap.TrieMap<SkillModuleTypes.ModuleId, Buffer.Buffer<SkillModuleTypes.Quiz>>(nEqual, nHash);
    quizAttempts := TrieMap.TrieMap<(Principal, SkillModuleTypes.ModuleId, SkillModuleTypes.QuizId), SkillModuleTypes.QuizAttempt>(attemptKeyEqual, attemptKeyHash);

    // Restore modules and recreate buffers
    for ((moduleId, modData) in moduleStorage.vals()) {
      modules.put(moduleId, modData);

      // Recreate lesson buffer
      let lessonsBuffer = Buffer.Buffer<SkillModuleTypes.Lesson>(modData.lessons.size());
      for (lesson in modData.lessons.vals()) {
        lessonsBuffer.add(lesson);
      };
      lessonBuffers.put(moduleId, lessonsBuffer);

      // Recreate quiz buffer from separate quiz storage
      var quizzesFound = false;
      for ((storedModuleId, storedQuizzes) in quizStorage.vals()) {
        if (storedModuleId == moduleId) {
          let quizzesBuffer = Buffer.Buffer<SkillModuleTypes.Quiz>(storedQuizzes.size());
          for (quiz in storedQuizzes.vals()) {
            quizzesBuffer.add(quiz);
          };
          quizBuffers.put(moduleId, quizzesBuffer);
          quizzesFound := true;
        };
      };
      
      // If no quiz storage found (backward compatibility), create empty buffer
      if (not quizzesFound) {
        quizBuffers.put(moduleId, Buffer.Buffer<SkillModuleTypes.Quiz>(0));
      };

      // Update nextModuleId if needed
      if (moduleId >= nextModuleId) {
        nextModuleId := moduleId + 1;
      };
    };

    // Restore quiz attempts
    for ((key, attempt) in attemptStorage.vals()) {
      quizAttempts.put(key, attempt);
    };
  };

  // Create a new module (authorized only)
  public shared (msg) func create_module(input : SkillModuleTypes.ModuleInput) : async Result.Result<SkillModuleTypes.Module, Text> {
    // Check if caller is authorized
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to create modules");
    };

    // Validate at least one lesson or quiz exists
    if (input.lessons.size() == 0 and input.quizzes.size() == 0) {
      return #err("Module must contain at least one lesson or quiz");
    };

    // Generate module ID
    let moduleId = nextModuleId;
    nextModuleId += 1;

    // Convert Quiz to QuizSummary for Module storage
    let quizzesSummary = Buffer.Buffer<SkillModuleTypes.QuizSummary>(input.quizzes.size());
    for (quiz in input.quizzes.vals()) {
      quizzesSummary.add({
        id = quiz.id;
        title = quiz.title;
        description = quiz.description;
        passingScore = quiz.passingScore;
        timeLimit = quiz.timeLimit;
      });
    };

    // Create the module
    let newModule : SkillModuleTypes.Module = {
      id = moduleId;
      title = input.title;
      description = input.description;
      createdAt = Time.now();
      createdBy = msg.caller;
      lessons = input.lessons;
      quizzes = Buffer.toArray(quizzesSummary);
      status = input.status;
      order = input.order;
    };

    // Store module
    modules.put(moduleId, newModule);

    // Create and store buffers
    let lessonsBuffer = Buffer.Buffer<SkillModuleTypes.Lesson>(input.lessons.size());
    for (lesson in input.lessons.vals()) {
      lessonsBuffer.add(lesson);
    };
    lessonBuffers.put(moduleId, lessonsBuffer);

    let quizzesBuffer = Buffer.Buffer<SkillModuleTypes.Quiz>(input.quizzes.size());
    for (quiz in input.quizzes.vals()) {
      quizzesBuffer.add(quiz);
    };
    quizBuffers.put(moduleId, quizzesBuffer);

    return #ok(newModule);
  };

  // Get module by ID (public query)
  public shared query func get_module(moduleId : SkillModuleTypes.ModuleId) : async ?SkillModuleTypes.Module {
    let moduleOpt = modules.get(moduleId);
    switch (moduleOpt) {
      case (?modData) {
        // Get current buffers and convert to arrays
        let lessonsBuffer = switch (lessonBuffers.get(moduleId)) {
          case (?buf) { buf };
          case (null) { Buffer.Buffer<SkillModuleTypes.Lesson>(0) };
        };
        let quizzesBuffer = switch (quizBuffers.get(moduleId)) {
          case (?buf) { buf };
          case (null) { Buffer.Buffer<SkillModuleTypes.Quiz>(0) };
        };

        // Convert Quiz to QuizSummary (remove questions)
        let quizzesSummary = Buffer.Buffer<SkillModuleTypes.QuizSummary>(quizzesBuffer.size());
        for (quiz in quizzesBuffer.vals()) {
          quizzesSummary.add({
            id = quiz.id;
            title = quiz.title;
            description = quiz.description;
            passingScore = quiz.passingScore;
            timeLimit = quiz.timeLimit;
          });
        };

        // Return module with arrays from buffers (quizzes without questions)
        ?{
          modData with
          lessons = Buffer.toArray(lessonsBuffer);
          quizzes = Buffer.toArray(quizzesSummary);
        };
      };
      case (null) { null };
    };
  };

  // Start a quiz attempt (msg.caller)
  public shared (msg) func start_quiz(moduleId : SkillModuleTypes.ModuleId, quizId : SkillModuleTypes.QuizId) : async Result.Result<SkillModuleTypes.Quiz, Text> {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return #err("Unauthorized");
    };

    // Check if module exists
    let moduleOpt = modules.get(moduleId);
    switch (moduleOpt) {
      case (null) {
        return #err("Module not found");
      };
      case (?modData) {
        // Check if quiz exists in module
        let quizzesBuffer = switch (quizBuffers.get(moduleId)) {
          case (?buf) { buf };
          case (null) { return #err("Quiz not found") };
        };

        // Find the quiz and check for existing attempt
        var quizToReturn : ?SkillModuleTypes.Quiz = null;
        for (quiz in quizzesBuffer.vals()) {
          if (quiz.id == quizId) {
            quizToReturn := ?quiz;
          };
        };

        if (quizToReturn == null) {
          return #err("Quiz not found");
        };

        // Check for existing attempt
        let attemptKey = (msg.caller, moduleId, quizId);
        let existingAttempt = quizAttempts.get(attemptKey);

        switch (existingAttempt) {
          case (?attempt) {
            // Check if attempt is completed
            switch (attempt.completedAt) {
              case (null) {
                // Attempt in progress
                return #err("Attempt in progress");
              };
              case (?completedAt) {
                // Check delay
                let currentTime = Time.now();
                let delayNanoseconds = quizConfig.defaultAttemptDelaySeconds * 1_000_000_000;
                let nextAllowedTime = completedAt + delayNanoseconds;

                if (currentTime < nextAllowedTime) {
                  let remainingSecondsInt = (nextAllowedTime - currentTime) / 1_000_000_000;
                  let remainingSeconds = if (remainingSecondsInt >= 0) {
                    Int.abs(remainingSecondsInt);
                  } else {
                    0;
                  };
                  return #err("Delay not met. Please wait " # Nat.toText(remainingSeconds) # " seconds");
                };
              };
            };
          };
          case (null) {};
        };

        // Create new attempt for tracking
        let newAttempt : SkillModuleTypes.QuizAttempt = {
          moduleId = moduleId;
          quizId = quizId;
          userId = msg.caller;
          quizStartedAt = Time.now();
          completedAt = null;
          score = null;
          answers = [];
          correctAnswers = [];
        };

        quizAttempts.put(attemptKey, newAttempt);

        // Return the quiz with questions
        switch (quizToReturn) {
          case (?quiz) { return #ok(quiz); };
          case (null) { return #err("Quiz not found"); };
        };
      };
    };
  };

  // Answer quiz questions (batch submission)
  public shared (msg) func answer_quiz(moduleId : SkillModuleTypes.ModuleId, quizId : SkillModuleTypes.QuizId, answers : [SkillModuleTypes.AnswerSubmission]) : async Result.Result<SkillModuleTypes.QuizFeedback, Text> {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return #err("Unauthorized");
    };

    // Get attempt
    let attemptKey = (msg.caller, moduleId, quizId);
    let attemptOpt = quizAttempts.get(attemptKey);

    switch (attemptOpt) {
      case (null) {
        return #err("Attempt not found");
      };
      case (?attempt) {
        // Check if already completed
        switch (attempt.completedAt) {
          case (?_) {
            return #err("Attempt already completed");
          };
          case (null) {};
        };

        // Get quiz to validate answers
        let moduleOpt = modules.get(moduleId);
        switch (moduleOpt) {
          case (null) {
            return #err("Module not found");
          };
          case (?modData) {
            let quizzesBuffer = switch (quizBuffers.get(moduleId)) {
              case (?buf) { buf };
              case (null) { return #err("Quiz not found") };
            };

            // Find the quiz
            var quizOpt : ?SkillModuleTypes.Quiz = null;
            for (quiz in quizzesBuffer.vals()) {
              if (quiz.id == quizId) {
                quizOpt := ?quiz;
              };
            };

            switch (quizOpt) {
              case (null) {
                return #err("Quiz not found");
              };
              case (?quiz) {
                // Validate all questions answered
                if (answers.size() != quiz.questions.size()) {
                  return #err("Invalid answer count. Expected " # Nat.toText(quiz.questions.size()) # " answers");
                };

                // Calculate score
                var totalPoints = 0;
                var earnedPoints = 0;
                var correctAnswersBuffer = Buffer.Buffer<Bool>(quiz.questions.size());

                // Process each question
                for (question in quiz.questions.vals()) {
                  totalPoints += question.points;

                  // Find answer for this question
                  var foundAnswer = false;
                  var isCorrect = false;
                  for (answer in answers.vals()) {
                    if (answer.questionId == question.id) {
                      foundAnswer := true;
                      if (answer.answer == question.correctAnswer) {
                        earnedPoints += question.points;
                        isCorrect := true;
                      };
                    };
                  };

                  if (not foundAnswer) {
                    return #err("Missing answer for question " # Nat.toText(question.id));
                  };

                  correctAnswersBuffer.add(isCorrect);
                };

                // Calculate percentage score
                let percentageScore = if (totalPoints == 0) {
                  0;
                } else {
                  (earnedPoints * 100) / totalPoints;
                };

                // Check if passing score met
                let isPassing = percentageScore >= quiz.passingScore;

                // Update attempt
                let updatedAttempt : SkillModuleTypes.QuizAttempt = {
                  attempt with
                  completedAt = ?Time.now();
                  score = ?percentageScore;
                  answers = answers;
                  correctAnswers = Buffer.toArray(correctAnswersBuffer);
                };

                quizAttempts.put(attemptKey, updatedAttempt);

                // Return feedback
                let feedback : SkillModuleTypes.QuizFeedback = {
                  isCorrect = isPassing;
                  score = percentageScore;
                  totalScore = earnedPoints;
                  correctAnswers = Buffer.toArray(correctAnswersBuffer);
                };

                return #ok(feedback);
              };
            };
          };
        };
      };
    };
  };

  // Get quiz attempt for caller
  public shared query (msg) func get_quiz_attempt(moduleId : SkillModuleTypes.ModuleId, quizId : SkillModuleTypes.QuizId) : async ?SkillModuleTypes.QuizAttempt {
    if (Principal.isAnonymous(msg.caller)) {
      return null;
    };

    let attemptKey = (msg.caller, moduleId, quizId);
    quizAttempts.get(attemptKey);
  };

  // Get quiz configuration (public query)
  public shared query func get_quiz_config() : async SkillModuleTypes.QuizConfig {
    quizConfig;
  };

  // Update quiz configuration (authorized only)
  public shared (msg) func update_quiz_config(config : SkillModuleTypes.QuizConfig) : async Result.Result<(), Text> {
    // Check if caller is authorized
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to update quiz configuration");
    };

    quizConfig := config;
    return #ok(());
  };

  // Add authorized principal
  public shared (msg) func addAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    // Check if the caller has permission to add authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to add authorized principals");
    };

    // Add the principal
    Map.set(authorizedPrincipals, phash, pid, ());
    return #ok(());
  };

  // Remove authorized principal
  public shared (msg) func removeAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    // Check if the caller has permission to remove authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to remove authorized principals");
    };

    // Remove the principal
    Map.delete(authorizedPrincipals, phash, pid);
    return #ok(());
  };

  // Get authorized principals
  public shared (msg) func getAuthorizedPrincipals() : async Result.Result<[Principal], Text> {
    // Check if the caller has permission to get authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to get authorized principals");
    };

    // Get authorized principals
    return #ok(Iter.toArray(Map.keys(authorizedPrincipals)));
  };
};

