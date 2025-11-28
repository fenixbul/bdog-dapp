import Principal "mo:base/Principal";

module {
  public type PlayerId = Principal;
  public type RoomId = Nat32;

  public type PlayerRole = { #Player1; #Player2 };

  public type GameStatus = { #WaitingForPlayers; #InProgress; #Finished };

  public type Error = {
    #NotYourTurn;
    #GameFinished;
    #Unauthorized;
    #RoomFull;
    #RoomNotFound;
    #AlreadyInRoom;
    #InvalidState;
  };

};
