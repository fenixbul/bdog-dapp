import Principal "mo:base/Principal";
import Result "mo:base/Result";

module {
  /// Unified request for reward eligibility check
  public type EligibilityRequest = {
    userId : Principal;
    rewardType : Text; // e.g., "UserVerified", "ModulePassed", etc.
  };

  /// Unified response for reward eligibility
  public type EligibilityResponse = {
    eligible : Bool;
    reason : ?Text; // Optional reason if not eligible
  };

  /// Unified actor interface that all verification canisters must implement
  public type VerificationActor = actor {
    checkRewardEligibility : shared query (EligibilityRequest) -> async Result.Result<EligibilityResponse, Text>;
  };
};




