import Time "mo:base/Time";
import shared_types "shared_types";
import Principal "mo:base/Principal";

module {
  public type RoomStatus = { #WaitingForPlayers; #InGame; #Finished };

  public type PlayerSlot = {
    principal : shared_types.PlayerId;
    joinedAt : Time.Time;
  };

  public type RoomId = Nat;

  public type Room = {
    id : RoomId;
    owner : shared_types.PlayerId;

    player1 : ?PlayerSlot;
    player2 : ?PlayerSlot;

    // If null or empty, everyone can join. 
    // If set, only principals in this list can join.
    allowedPlayers : ?[Principal];
    status : RoomStatus;

    createdAt : Time.Time;
  };
};
