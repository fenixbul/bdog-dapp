import { ActorBaseService } from "./ActorBaseService";
import { idlFactory } from "@/lib/canisters/skill_module";
import type { _SERVICE as SkillModuleServiceType } from "@/lib/canisters/skill_module/skill_module.did";
import type {
  Module,
  ModuleId,
  ModuleInput,
  ModuleWithUserState,
  Quiz,
  QuizId,
  QuizAttempt,
  QuizConfig,
  QuizFeedback,
  AnswerSubmission,
  QuizStartResponse,
  Result_4,
} from "@/lib/canisters/skill_module/skill_module.did";
import type { Principal } from "@dfinity/principal";

/**
 * Service for interacting with the SkillModule canister.
 * Provides methods for managing modules, quizzes, and quiz attempts.
 */
export class SkillModuleService extends ActorBaseService<SkillModuleServiceType> {
  protected canisterName = "skill_module";
  protected idlFactory = idlFactory;

  /**
   * Get a module by ID with user completion state.
   * @param moduleId - The ID of the module to retrieve
   * @returns The module with user state if found, null otherwise
   */
  async getModule(moduleId: ModuleId): Promise<ModuleWithUserState | null> {
    try {
      const actor = await this.getActor();
      const result = await actor.get_module(moduleId);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error getting module ${moduleId}:`, errorMessage);
      throw new Error(`Failed to get module: ${errorMessage}`);
    }
  }

  /**
   * Mark a module as completed for the current user.
   * @param moduleId - The ID of the module to mark as completed
   */
  async markModuleCompleted(moduleId: ModuleId): Promise<void> {
    return this.callCanister(
      async () => {
        const actor = await this.getActor();
        const result = await actor.mark_module_completed(moduleId);
        if ('err' in result) {
          throw new Error(result.err);
        }
      },
      "mark module completed"
    );
  }

  /**
   * Create a new module.
   * @param moduleInput - The module data to create
   * @returns The created module
   */
  async createModule(moduleInput: ModuleInput): Promise<Module> {
    return this.callCanister(
      async () => {
        const actor = await this.getActor();
        return actor.create_module(moduleInput);
      },
      "create module"
    );
  }

  /**
   * Start a quiz attempt.
   * @param moduleId - The ID of the module containing the quiz
   * @param quizId - The ID of the quiz to start
   * @returns The quiz start response containing quiz and quizStartedAt timestamp
   */
  async startQuiz(moduleId: ModuleId, quizId: QuizId): Promise<QuizStartResponse> {
    return this.callCanister(
      async () => {
        const actor = await this.getActor();
        return actor.start_quiz(moduleId, quizId);
      },
      "start quiz"
    );
  }

  /**
   * Submit answers for a quiz.
   * @param moduleId - The ID of the module containing the quiz
   * @param quizId - The ID of the quiz
   * @param answers - Array of answer submissions
   * @returns Result containing quiz feedback with score and correctness information, or error
   */
  async answerQuiz(
    moduleId: ModuleId,
    quizId: QuizId,
    answers: Array<AnswerSubmission>
  ): Promise<Result_4> {
    const actor = await this.getActor();
    return actor.answer_quiz(moduleId, quizId, answers);
  }

  /**
   * Get a quiz attempt by module and quiz ID.
   * @param moduleId - The ID of the module containing the quiz
   * @param quizId - The ID of the quiz
   * @returns The quiz attempt if found, null otherwise
   */
  async getQuizAttempt(
    moduleId: ModuleId,
    quizId: QuizId
  ): Promise<QuizAttempt | null> {
    try {
      const actor = await this.getActor();
      const result = await actor.get_quiz_attempt(moduleId, quizId);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `Error getting quiz attempt for module ${moduleId}, quiz ${quizId}:`,
        errorMessage
      );
      throw new Error(`Failed to get quiz attempt: ${errorMessage}`);
    }
  }

  /**
   * Get the quiz configuration.
   * @returns The quiz configuration
   */
  async getQuizConfig(): Promise<QuizConfig> {
    try {
      const actor = await this.getActor();
      return await actor.get_quiz_config();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error getting quiz config:", errorMessage);
      throw new Error(`Failed to get quiz config: ${errorMessage}`);
    }
  }

  /**
   * Update the quiz configuration.
   * @param config - The new quiz configuration
   */
  async updateQuizConfig(config: QuizConfig): Promise<void> {
    await this.callCanister(
      async () => {
        const actor = await this.getActor();
        return actor.update_quiz_config(config);
      },
      "update quiz config"
    );
  }

  /**
   * Get all authorized principals.
   * @returns Array of authorized principals
   */
  async getAuthorizedPrincipals(): Promise<Array<Principal>> {
    return this.callCanister(
      async () => {
        const actor = await this.getActor();
        return actor.getAuthorizedPrincipals();
      },
      "get authorized principals"
    );
  }

  /**
   * Add an authorized principal.
   * @param principal - The principal to authorize
   */
  async addAuthorizedPrincipal(principal: Principal): Promise<void> {
    await this.callCanister(
      async () => {
        const actor = await this.getActor();
        return actor.addAuthorizedPrincipal(principal);
      },
      "add authorized principal"
    );
  }

  /**
   * Remove an authorized principal.
   * @param principal - The principal to remove authorization from
   */
  async removeAuthorizedPrincipal(principal: Principal): Promise<void> {
    await this.callCanister(
      async () => {
        const actor = await this.getActor();
        return actor.removeAuthorizedPrincipal(principal);
      },
      "remove authorized principal"
    );
  }
}

