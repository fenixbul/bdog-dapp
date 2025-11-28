import shared_types "shared_types";
import Time "mo:base/Time";

module {
  public type PlayerScores = {
    player1 : Nat;      // total score
    player2 : Nat;
  };

  public type TurnState = {
    id : Nat;                       // turnId
    activePlayer : shared_types.PlayerRole;
    roundScore : Nat;
    turnStartedAt : Time.Time;
    turnExpiresAt : Time.Time;     // 30s window
  };

  public type GameState = {
    status : shared_types.GameStatus;
    p1 : shared_types.PlayerId;
    p2 : shared_types.PlayerId;
    scores : PlayerScores;

    turn : ?TurnState;
    lastRoll : ?Nat;               // 1..6
    winner : ?shared_types.PlayerRole;

    createdAt : Time.Time;
  };

  public type GameView = {
    state : GameState;
    me : ?shared_types.PlayerRole;
    remainingTurnMillis : ?Nat;
  };
};
