import TrieMap "mo:base/TrieMap";
import Map "mo:map/Map";
import { phash } "mo:map/Map";
import Result "mo:base/Result";
import accessControl "../modules/accessControl";
import Iter "mo:base/Iter";
import Nat32 "mo:base/Nat32";
import Game "../types/game";
import shared_types "../types/shared_types";

shared ({ caller = initializer }) persistent actor class Games() = this {
  let authorizedPrincipals = Map.new<Principal, ()>();

  // Initialize authorized principals (by default the initializer is authorized)
  // Add authorized principals via the "addAuthorizedPrincipal" method
  Map.set(authorizedPrincipals, phash, initializer, ());

  // Stable storage for games (keyed by roomId)
  private var gameStorage : [(shared_types.RoomId, Game.Game)] = [];

  // Hash and equal functions for Nat32 (RoomId)
  func n32equal(a : shared_types.RoomId, b : shared_types.RoomId) : Bool {
    a == b;
  };
  func n32hash(n : shared_types.RoomId) : Nat32 {
    n;
  };

  // Game storage (keyed by roomId)
  private transient var games = TrieMap.TrieMap<shared_types.RoomId, Game.Game>(n32equal, n32hash);

  // Reconstruct TrieMap from stable storage on upgrade
  system func postupgrade() {
    games := TrieMap.TrieMap<shared_types.RoomId, Game.Game>(n32equal, n32hash);
    for ((roomId, game) in gameStorage.vals()) {
      games.put(roomId, game);
    };
  };

  // Store map entries for stability before upgrade
  system func preupgrade() {
    gameStorage := Iter.toArray(games.entries());
  };

  // Create a new game for a room (authorized only)
  public shared (msg) func create_game(game : Game.Game) : async Result.Result<Game.Game, Text> {
    // Check if caller is authorized
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to create games");
    };

    // Check if game with this roomId already exists
    let existingGame = games.get(game.roomId);
    switch (existingGame) {
      case (?_) {
        return #err("Game already exists for this roomId");
      };
      case (null) {
        // Validate game data
        // Ensure game.id matches roomId (1:1 relationship)
        if (game.id != Nat32.toNat(game.roomId)) {
          return #err("Game id must match roomId");
        };

        // Store the game
        games.put(game.roomId, game);
        return #ok(game);
      };
    };
  };

  // Get game by roomId
  public shared query func get_game_by_id(roomId : shared_types.RoomId) : async ?Game.Game {
    games.get(roomId);
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
