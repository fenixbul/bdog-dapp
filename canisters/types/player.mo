import shared_types "shared_types";

module {
  public type Player = {
    player_id : shared_types.PlayerId;
    created_at : Int;
    last_action_at : Int; // Last time player trigger an action

    refferer_pid : ?Principal; // If player is referred by another player, this is the player's principal

    twitter_username : ?Text;
    is_twitter_verified : Bool;

    gamesPlayed : Nat;
    gamesWon : Nat;
  };
};
