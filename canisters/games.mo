import Map "mo:map/Map";
import { phash } "mo:map/Map";
import Result "mo:base/Result";
import accessControl "modules/accessControl";
import Iter "mo:base/Iter";

shared ({ caller = initializer }) persistent actor class Games() = this {
  let authorizedPrincipals = Map.new<Principal, ()>();

  // Initialize authorized principals (by default the initializer is authorized)
  // Add authorized principals via the "addAuthorizedPrincipal" method
  Map.set(authorizedPrincipals, phash, initializer, ());

  // TODO: ...

  // Add authorized principals method
  public shared (msg) func addAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    // Check if the caller has permission to add authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to add authorized principals");
    };

    // Add the principal
    Map.set(authorizedPrincipals, phash, pid, ());
    return #ok();
  };

  // Remove authorized principals method
  public shared (msg) func removeAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    // Check if the caller has permission to remove authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to remove authorized principals");
    };

    // Remove the principal
    Map.delete(authorizedPrincipals, phash, pid);
    return #ok();
  };

  // Get authorized principals method
  public shared (msg) func getAuthorizedPrincipals() : async Result.Result<[Principal], Text> {
    // Check if the caller has permission to get authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to get authorized principals");
    };

    // Get authorized principals
    return #ok(Iter.toArray(Map.keys(authorizedPrincipals)));
  };
};
