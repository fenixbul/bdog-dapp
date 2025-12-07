import shared_types "shared_types";

module {
  public type XData = {
    username : Text;
    avatar : Text; // profile image URL
    created_at : Text; // account creation date
    verified_at : Int; // verification timestamp
  };

  public type Player = {
    player_id : shared_types.PlayerId;
    created_at : Int;
    last_action_at : Int; // Last time player trigger an action

    refferer_pid : ?Principal; // If player is referred by another player, this is the player's principal

    is_x_verified : Bool;
    x_data : ?XData; // X verification data

    gamesPlayed : Nat;
    gamesWon : Nat;
  };
};
