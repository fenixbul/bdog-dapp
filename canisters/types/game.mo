import Time "mo:base/Time";
import shared_types "shared_types";

module {
  // Who is who in this game
  public type PlayerRole = { #Player1; #Player2 };

  // Scores for each player
  public type PlayerScores = {
    player1 : Nat;   // total score P1
    player2 : Nat;   // total score P2
  };

  // Live turn state (current turn only)
  public type TurnState = {
    id : Nat;                        // increments each new turn
    activePlayer : PlayerRole;       // whose turn
    roundScore : Nat;                // current turn’s accumulated score
    startedAt : Time.Time;           // when this turn started
    expiresAt : Time.Time;           // startedAt + 30s
  };

  // Archived turn snapshot (history)
  public type TurnSnapshot = {
    id : Nat;
    activePlayer : PlayerRole;
    roundScore : Nat;                // final round score for that turn
    startedAt : Time.Time;
    endedAt : Time.Time;
    lastRoll : ?Nat;                 // last dice roll in that turn (if any)
    timedOut : Bool;                 // true if this turn ended by timeout=hold
  };

  public type GameId = Nat;          // or reuse RoomId if 1:1

  public type Game = {
    id : GameId;
    roomId : shared_types.RoomId;

    player1 : shared_types.PlayerId;
    player2 : shared_types.PlayerId;

    status : shared_types.GameStatus;

    scores : PlayerScores;

    // current turn
    turn : ?TurnState;

    // last dice roll for HUD (across game, not per turn)
    lastRoll : ?Nat;

    // winner (once finished)
    winner : ?PlayerRole;

    // timestamps
    createdAt : Time.Time;

    // history (can be trimmed / capped)
    turnHistory : [TurnSnapshot];
  };
};
