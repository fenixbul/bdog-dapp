import Map "mo:map/Map";
import { phash } "mo:map/Map";
import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Player "types/player";
import Time "mo:base/Time";
import Result "mo:base/Result";
import accessControl "modules/accessControl";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";

shared ({ caller = initializer }) persistent actor class Players() = this {
  // Configuration constants
  let INITIAL_PLAYERS_COUNT = 1;

  private var playersCount : Nat = INITIAL_PLAYERS_COUNT;
  let players = Map.new<Principal, Player.Player>();
  let authorizedPrincipals = Map.new<Principal, ()>();
  
  // Stable storage for X username to Principal mapping
  var xUsernameToPrincipalEntries : [(Text, Principal)] = [];
  
  // Runtime TrieMap rebuilt from stable storage (transient - not persisted)
  private transient var xUsernameToPrincipal = TrieMap.TrieMap<Text, Principal>(Text.equal, Text.hash);
  
  // Save TrieMap to stable storage before upgrade
  system func preupgrade() {
    xUsernameToPrincipalEntries := Iter.toArray(xUsernameToPrincipal.entries());
  };
  
  // Rebuild TrieMap from stable storage after upgrade
  system func postupgrade() {
    xUsernameToPrincipal := TrieMap.TrieMap<Text, Principal>(Text.equal, Text.hash);
    for ((username, principal) in xUsernameToPrincipalEntries.vals()) {
      xUsernameToPrincipal.put(username, principal);
    };
  };

  // Initialize authorized principals (by default the initializer is authorized)
  // Add authorized principals via the "addAuthorizedPrincipal" method
  Map.set(authorizedPrincipals, phash, initializer, ());

  public shared (msg) func create_player(player_id : Principal, refferer_pid : ?Principal) : async Result.Result<Player.Player, Text> {
    // Check if caller is authorized
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to create player");
    };

    // Check if player already exists
    let playerResult = Map.get(players, phash, player_id);
    if (playerResult != null) {
      return #err("Player already exists");
    };

    let player : Player.Player = {
      player_id = player_id;
      created_at = Time.now();
      last_action_at = Time.now();
      refferer_pid = refferer_pid;
      is_x_verified = false;
      x_data = null;
      gamesPlayed = 0;
      gamesWon = 0;
    };
    Map.set(players, phash, player_id, player);
    playersCount += 1;
    return #ok(player);
  };

  // Get player by player id
  public shared query (msg) func get_player_by_principal(player_id : Principal) : async Result.Result<Player.Player, Text> {
    // Check if caller is authorized
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to get player");
    };

    let player = Map.get(players, phash, player_id);
    switch (player) {
      case (null) {
        return #err("Player not found");
      };
      case (?player) {
        return #ok(player);
      };
    };
  };

  // Get player by player id
  public shared query (msg) func get_player_by_id(player_id : Principal) : async Result.Result<Player.Player, Text> {
    // Check if caller is authorized
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to get player by id");
    };

    let player = Map.get(players, phash, player_id);
    switch (player) {
      case (null) { return #err("Player not found") };
      case (?player) { return #ok(player) };
    };
  };

  // Update player last action at (action can be anything, like planting, harvesting, watering, etc.)
  public shared (msg) func update_player_last_action_at(player_id : Principal) : async Result.Result<(), Text> {
    // Check if caller is authorized
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to update player last active at");
    };

    let player = Map.get(players, phash, player_id);

    switch (player) {
      case (null) {
        return #err("Player not found");
      };
      case (?player) {
        Map.set(
          players,
          phash,
          player_id,
          {
            player with last_action_at = Time.now();
          },
        );
        return #ok();
      };
    };
  };

  // Update player X verification data
  public shared (msg) func update_player_x_verification(
    player_id : Principal,
    username : Text,
    avatar : Text,
    created_at : Text,
    verified_at : Int,
  ) : async Result.Result<(), Text> {
    // Check if caller is authorized
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to update player X verification");
    };

    let player = Map.get(players, phash, player_id);

    switch (player) {
      case (null) {
        return #err("Player not found");
      };
      case (?player) {
        // Check if username is already verified - reject in any case
        let existingPrincipal = xUsernameToPrincipal.get(username);
        switch (existingPrincipal) {
          case (?_) {
            return #err("X username already verified by another account");
          };
          case (null) {
            // Username not taken, proceed
          };
        };

        // Add username mapping
        xUsernameToPrincipal.put(username, player_id);

        let x_data : Player.XData = {
          username = username;
          avatar = avatar;
          created_at = created_at;
          verified_at = verified_at;
        };
        Map.set(
          players,
          phash,
          player_id,
          {
            player with
            is_x_verified = true;
            x_data = ?x_data;
          },
        );
        return #ok();
      };
    };
  };

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
