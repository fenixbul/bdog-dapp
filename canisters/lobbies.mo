import Map "mo:map/Map";
import { phash } "mo:map/Map";
import { nhash } "mo:map/Map";
import Result "mo:base/Result";
import accessControl "modules/accessControl";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Lobby "types/lobby";
import shared_types "types/shared_types";

shared ({ caller = initializer }) persistent actor class Lobbies() = this {
  let authorizedPrincipals = Map.new<Principal, ()>();

  // Initialize authorized principals (by default the initializer is authorized)
  // Add authorized principals via the "addAuthorizedPrincipal" method
  Map.set(authorizedPrincipals, phash, initializer, ());

  // Room storage
  private var nextRoomId : Nat = 1;
  let rooms = Map.new<Lobby.RoomId, Lobby.Room>(); // Quick lookup by ID
  private transient var activeRooms = Buffer.Buffer<Lobby.Room>(0); // For pagination
  private var archivedRooms = Map.new<Lobby.RoomId, Lobby.Room>(); // Finished rooms
  
  // Track which player is in which room (Principal -> RoomId) - joined players
  let playerToRoom = Map.new<Principal, Lobby.RoomId>();
  
  // Track invitations by user (Principal -> [RoomId])
  let invitationsByUser = Map.new<Principal, [Lobby.RoomId]>();

  // Create empty room and auto-assign caller as Player1
  // Optionally invite player2 on creation
  public shared (msg) func create_room(player2 : ?Principal) : async Result.Result<Lobby.Room, shared_types.Error> {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return #err(#Unauthorized);
    };

    // Check if caller is already in a room
    let callerRoom = Map.get(playerToRoom, phash, msg.caller);
    switch (callerRoom) {
      case (?_) {
        return #err(#AlreadyInRoom);
      };
      case (null) {};
    };

    // If player2 is provided, validate and check if they're already in a room
    switch (player2) {
      case (?p2) {
        // Reject anonymous player2
        if (Principal.isAnonymous(p2)) {
          return #err(#Unauthorized);
        };
        
        // Prevent self-invite
        if (p2 == msg.caller) {
          return #err(#InvalidState);
        };
      };
      case (null) {};
    };

    // Generate room ID and increment (with overflow check)
    if (nextRoomId == 0) {
      return #err(#InvalidState);
    };
    let roomId : Lobby.RoomId = nextRoomId;
    nextRoomId += 1;

    // Create PlayerSlot for Player1
    let player1Slot : Lobby.PlayerSlot = {
      principal = msg.caller;
      joinedAt = Time.now();
    };

    // Create the room
    let room : Lobby.Room = {
      id = roomId;
      owner = msg.caller;
      player1 = ?player1Slot;
      player2 = null;
      allowedPlayers = null;
      status = #WaitingForPlayers;
      createdAt = Time.now();
    };

    // Store the room
    Map.set(rooms, nhash, roomId, room);
    activeRooms.add(room);
    
    // Track that caller is now in this room (joined)
    Map.set(playerToRoom, phash, msg.caller, roomId);

    // Track player2 invitation if provided (not joined yet, just invited)
    switch (player2) {
      case (?p2) {
        // Add to invitations
        let existingInvitations = Map.get(invitationsByUser, phash, p2);
        let updatedInvitations = switch (existingInvitations) {
          case (?invites) {
            // Add roomId to existing list
            let newList = Buffer.Buffer<Lobby.RoomId>(invites.size() + 1);
            for (invite in invites.vals()) {
              newList.add(invite);
            };
            newList.add(roomId);
            Buffer.toArray(newList);
          };
          case (null) {
            [roomId];
          };
        };
        Map.set(invitationsByUser, phash, p2, updatedInvitations);
      };
      case (null) {};
    };

    return #ok(room);
  };

  // Join an existing room
  public shared (msg) func join_room(roomId : Lobby.RoomId) : async Result.Result<Lobby.Room, shared_types.Error> {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return #err(#Unauthorized);
    };

    // Check if caller is already in a room
    let callerRoom = Map.get(playerToRoom, phash, msg.caller);
    switch (callerRoom) {
      case (?_) {
        return #err(#AlreadyInRoom);
      };
      case (null) {};
    };

    // Check if room exists
    let roomOpt = Map.get(rooms, nhash, roomId);
    switch (roomOpt) {
      case (null) {
        return #err(#RoomNotFound);
      };
      case (?room) {
        // CRITICAL: Check if caller is already a player in this specific room
        let isPlayer1 = switch (room.player1) {
          case (?slot) { slot.principal == msg.caller };
          case (null) { false };
        };
        let isPlayer2 = switch (room.player2) {
          case (?slot) { slot.principal == msg.caller };
          case (null) { false };
        };
        if (isPlayer1 or isPlayer2) {
          return #err(#AlreadyInRoom);
        };

        // Check if room is in a valid state to join
        if (room.status != #WaitingForPlayers) {
          return #err(#InvalidState);
        };

        // Check if room is full
        if (room.player1 != null and room.player2 != null) {
          return #err(#RoomFull);
        };

        // Check if room has allowedPlayers restriction
        switch (room.allowedPlayers) {
          case (?allowed) {
            // Check if caller is in the allowed list
            var isAllowed = false;
            for (principal in allowed.vals()) {
              if (principal == msg.caller) {
                isAllowed := true;
              };
            };
            if (not isAllowed) {
              return #err(#Unauthorized);
            };
          };
          case (null) {
            // No restrictions, proceed
          };
        };

        // Create PlayerSlot for the joining player
        let playerSlot : Lobby.PlayerSlot = {
          principal = msg.caller;
          joinedAt = Time.now();
        };

        // Determine which slot to fill (player1 or player2)
        let updatedRoom : Lobby.Room = switch (room.player1, room.player2) {
          case (null, _) {
            // Fill player1 slot
            {
              room with player1 = ?playerSlot;
            };
          };
          case (?_, null) {
            // Fill player2 slot
            {
              room with player2 = ?playerSlot;
            };
          };
          case (?_, ?_) {
            // Should not reach here due to earlier check, but handle for safety
            return #err(#RoomFull);
          };
        };

        // Update the room in Map
        Map.set(rooms, nhash, roomId, updatedRoom);
        
        // Update the room in Buffer
        var i = 0;
        while (i < activeRooms.size()) {
          if (activeRooms.get(i).id == roomId) {
            activeRooms.put(i, updatedRoom);
          };
          i += 1;
        };
        
        // Remove from invitations (always check and clean up, even if not invited)
        // This ensures consistency and removes any stale invitation data
        let existingInvitations = Map.get(invitationsByUser, phash, msg.caller);
        switch (existingInvitations) {
          case (?invites) {
            // Remove this roomId from invitations
            let filtered = Buffer.Buffer<Lobby.RoomId>(0);
            for (invite in invites.vals()) {
              if (invite != roomId) {
                filtered.add(invite);
              };
            };
            let updatedInvites = Buffer.toArray(filtered);
            if (updatedInvites.size() > 0) {
              Map.set(invitationsByUser, phash, msg.caller, updatedInvites);
            } else {
              Map.delete(invitationsByUser, phash, msg.caller);
            };
          };
          case (null) {
            // No invitations to clean up
          };
        };
        
        // Track that caller is now in this room (joined)
        Map.set(playerToRoom, phash, msg.caller, roomId);

        return #ok(updatedRoom);
      };
    };
  };

  // Update room - invite or remove invited player (only if WaitingForPlayers)
  public shared (msg) func update_room(roomId : Lobby.RoomId, action : { #invite : Principal; #remove : Principal }) : async Result.Result<Lobby.Room, shared_types.Error> {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return #err(#Unauthorized);
    };

    // Check if room exists
    let roomOpt = Map.get(rooms, nhash, roomId);
    switch (roomOpt) {
      case (null) {
        return #err(#RoomNotFound);
      };
      case (?room) {
        // Check if caller is room owner or authorized
        let isOwner = room.owner == msg.caller;
        let isAuthorized = accessControl.isAuthorized(msg.caller, authorizedPrincipals);
        if (not isOwner and not isAuthorized) {
          return #err(#Unauthorized);
        };

        // Check if room is in WaitingForPlayers status
        if (room.status != #WaitingForPlayers) {
          return #err(#InvalidState);
        };

        // Handle invite or remove action
        switch (action) {
          case (#invite(player)) {
            // Reject anonymous player
            if (Principal.isAnonymous(player)) {
              return #err(#Unauthorized);
            };

            // Prevent self-invite
            if (player == msg.caller) {
              return #err(#InvalidState);
            };

            // Check if player is already in the room (player1 or player2)
            let isPlayer1 = switch (room.player1) {
              case (?slot) { slot.principal == player };
              case (null) { false };
            };
            let isPlayer2 = switch (room.player2) {
              case (?slot) { slot.principal == player };
              case (null) { false };
            };
            if (isPlayer1 or isPlayer2) {
              return #err(#AlreadyInRoom);
            };

            // Check if player is already in another room
            let playerRoom = Map.get(playerToRoom, phash, player);
            switch (playerRoom) {
              case (?_) {
                return #err(#AlreadyInRoom);
              };
              case (null) {};
            };

            // Check if already invited
            let existingInvitations = Map.get(invitationsByUser, phash, player);
            switch (existingInvitations) {
              case (?invites) {
                // Check if already invited to this room
                for (invite in invites.vals()) {
                  if (invite == roomId) {
                    return #err(#AlreadyInRoom);
                  };
                };
              };
              case (null) {};
            };

            // Add to invitations
            let updatedInvitations = switch (existingInvitations) {
              case (?invites) {
                let newList = Buffer.Buffer<Lobby.RoomId>(invites.size() + 1);
                for (invite in invites.vals()) {
                  newList.add(invite);
                };
                newList.add(roomId);
                Buffer.toArray(newList);
              };
              case (null) {
                [roomId];
              };
            };
            Map.set(invitationsByUser, phash, player, updatedInvitations);

            // Update allowedPlayers list
            let updatedAllowedPlayers = switch (room.allowedPlayers) {
              case (?allowed) {
                // Check if player already in allowed list
                var alreadyAllowed = false;
                for (p in allowed.vals()) {
                  if (p == player) {
                    alreadyAllowed := true;
                  };
                };
                if (alreadyAllowed) {
                  room.allowedPlayers;
                } else {
                  // Add player to allowed list
                  let newList = Buffer.Buffer<Principal>(allowed.size() + 1);
                  for (p in allowed.vals()) {
                    newList.add(p);
                  };
                  newList.add(player);
                  ?Buffer.toArray(newList);
                };
              };
              case (null) {
                // Create new allowed list with this player
                ?[player];
              };
            };

            // Update room
            let updatedRoom = {
              room with allowedPlayers = updatedAllowedPlayers;
            };
            Map.set(rooms, nhash, roomId, updatedRoom);
            
            // Update room in Buffer
            var i = 0;
            while (i < activeRooms.size()) {
              if (activeRooms.get(i).id == roomId) {
                activeRooms.put(i, updatedRoom);
              };
              i += 1;
            };

            return #ok(updatedRoom);
          };
          case (#remove(player)) {
            // Check if player is actually in the room (can't remove joined players)
            let isPlayer1 = switch (room.player1) {
              case (?slot) { slot.principal == player };
              case (null) { false };
            };
            let isPlayer2 = switch (room.player2) {
              case (?slot) { slot.principal == player };
              case (null) { false };
            };
            if (isPlayer1 or isPlayer2) {
              return #err(#InvalidState);
            };

            // Remove from invitations
            let existingInvitations = Map.get(invitationsByUser, phash, player);
            switch (existingInvitations) {
              case (?invites) {
                let filtered = Buffer.Buffer<Lobby.RoomId>(0);
                var found = false;
                for (invite in invites.vals()) {
                  if (invite == roomId) {
                    found := true;
                  } else {
                    filtered.add(invite);
                  };
                };
                if (found) {
                  let updatedInvites = Buffer.toArray(filtered);
                  if (updatedInvites.size() > 0) {
                    Map.set(invitationsByUser, phash, player, updatedInvites);
                  } else {
                    Map.delete(invitationsByUser, phash, player);
                  };
                } else {
                  // Player not invited, nothing to remove
                  return #err(#InvalidState);
                };
              };
              case (null) {
                // Player not invited, nothing to remove
                return #err(#InvalidState);
              };
            };

            // Update allowedPlayers list
            let updatedAllowedPlayers = switch (room.allowedPlayers) {
              case (?allowed) {
                let filtered = Buffer.Buffer<Principal>(0);
                var found = false;
                for (p in allowed.vals()) {
                  if (p == player) {
                    found := true;
                  } else {
                    filtered.add(p);
                  };
                };
                if (found) {
                  let updated = Buffer.toArray(filtered);
                  if (updated.size() > 0) {
                    ?updated;
                  } else {
                    null; // No allowed players left, remove restriction
                  };
                } else {
                  room.allowedPlayers; // Player not in list, no change
                };
              };
              case (null) {
                null; // No allowed players list, nothing to remove
              };
            };

            // Update room
            let updatedRoom = {
              room with allowedPlayers = updatedAllowedPlayers;
            };
            Map.set(rooms, nhash, roomId, updatedRoom);
            
            // Update room in Buffer
            var i = 0;
            while (i < activeRooms.size()) {
              if (activeRooms.get(i).id == roomId) {
                activeRooms.put(i, updatedRoom);
              };
              i += 1;
            };

            return #ok(updatedRoom);
          };
        };
      };
    };
  };

  // Remove room (only if WaitingForPlayers and caller is owner)
  public shared (msg) func remove_room(roomId : Lobby.RoomId) : async Result.Result<(), shared_types.Error> {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return #err(#Unauthorized);
    };

    // Check if room exists
    let roomOpt = Map.get(rooms, nhash, roomId);
    switch (roomOpt) {
      case (null) {
        return #err(#RoomNotFound);
      };
      case (?room) {
        // Check if caller is room owner
        if (room.owner != msg.caller) {
          return #err(#Unauthorized);
        };

        // Check if room is in WaitingForPlayers status
        if (room.status != #WaitingForPlayers) {
          return #err(#InvalidState);
        };

        // Remove from rooms Map
        Map.delete(rooms, nhash, roomId);

        // Remove from activeRooms Buffer
        var i = 0;
        while (i < activeRooms.size()) {
          if (activeRooms.get(i).id == roomId) {
            ignore activeRooms.remove(i);
          } else {
            i += 1;
          };
        };

        // Remove from playerToRoom tracking
        switch (room.player1) {
          case (?slot) {
            Map.delete(playerToRoom, phash, slot.principal);
          };
          case (null) {};
        };
        switch (room.player2) {
          case (?slot) {
            Map.delete(playerToRoom, phash, slot.principal);
          };
          case (null) {};
        };

        // Remove from invitations tracking
        switch (room.player1) {
          case (?slot) {
            let invites = Map.get(invitationsByUser, phash, slot.principal);
            switch (invites) {
              case (?inviteList) {
                let filtered = Buffer.Buffer<Lobby.RoomId>(0);
                for (invite in inviteList.vals()) {
                  if (invite != roomId) {
                    filtered.add(invite);
                  };
                };
                let updated = Buffer.toArray(filtered);
                if (updated.size() > 0) {
                  Map.set(invitationsByUser, phash, slot.principal, updated);
                } else {
                  Map.delete(invitationsByUser, phash, slot.principal);
                };
              };
              case (null) {};
            };
          };
          case (null) {};
        };
        switch (room.player2) {
          case (?slot) {
            let invites = Map.get(invitationsByUser, phash, slot.principal);
            switch (invites) {
              case (?inviteList) {
                let filtered = Buffer.Buffer<Lobby.RoomId>(0);
                for (invite in inviteList.vals()) {
                  if (invite != roomId) {
                    filtered.add(invite);
                  };
                };
                let updated = Buffer.toArray(filtered);
                if (updated.size() > 0) {
                  Map.set(invitationsByUser, phash, slot.principal, updated);
                } else {
                  Map.delete(invitationsByUser, phash, slot.principal);
                };
              };
              case (null) {};
            };
          };
          case (null) {};
        };

        // Also clean up any other players who might have been invited
        // (check allowedPlayers if it exists)
        switch (room.allowedPlayers) {
          case (?allowed) {
            for (player in allowed.vals()) {
              // Skip if player is already player1 or player2 (handled above)
              let isPlayer1 = switch (room.player1) {
                case (?slot) { slot.principal == player };
                case (null) { false };
              };
              let isPlayer2 = switch (room.player2) {
                case (?slot) { slot.principal == player };
                case (null) { false };
              };
              if (not isPlayer1 and not isPlayer2) {
                // Remove invitation for this player
                let invites = Map.get(invitationsByUser, phash, player);
                switch (invites) {
                  case (?inviteList) {
                    let filtered = Buffer.Buffer<Lobby.RoomId>(0);
                    for (invite in inviteList.vals()) {
                      if (invite != roomId) {
                        filtered.add(invite);
                      };
                    };
                    let updated = Buffer.toArray(filtered);
                    if (updated.size() > 0) {
                      Map.set(invitationsByUser, phash, player, updated);
                    } else {
                      Map.delete(invitationsByUser, phash, player);
                    };
                  };
                  case (null) {};
                };
              };
            };
          };
          case (null) {};
        };

        return #ok(());
      };
    };
  };

  // Archive finished rooms (moves from activeRooms to archivedRooms)
  // TODO: Call this function from recurring timer
  private func archiveFinishedRooms() : () {
    // Iterate backwards to avoid skipping elements when removing
    var i = activeRooms.size();
    while (i > 0) {
      i -= 1;
      let room = activeRooms.get(i);
      if (room.status == #Finished) {
        // Move to archived
        Map.set(archivedRooms, nhash, room.id, room);
        Map.delete(rooms, nhash, room.id);
        
        // Remove from activeRooms Buffer (discard returned value)
        ignore activeRooms.remove(i);
        
        // Remove from playerToRoom tracking (joined players)
        switch (room.player1) {
          case (?slot) {
            Map.delete(playerToRoom, phash, slot.principal);
          };
          case (null) {};
        };
        switch (room.player2) {
          case (?slot) {
            Map.delete(playerToRoom, phash, slot.principal);
          };
          case (null) {};
        };
        
        // Remove from invitations tracking
        switch (room.player1) {
          case (?slot) {
            let invites = Map.get(invitationsByUser, phash, slot.principal);
            switch (invites) {
              case (?inviteList) {
                let filtered = Buffer.Buffer<Lobby.RoomId>(0);
                for (invite in inviteList.vals()) {
                  if (invite != room.id) {
                    filtered.add(invite);
                  };
                };
                let updated = Buffer.toArray(filtered);
                if (updated.size() > 0) {
                  Map.set(invitationsByUser, phash, slot.principal, updated);
                } else {
                  Map.delete(invitationsByUser, phash, slot.principal);
                };
              };
              case (null) {};
            };
          };
          case (null) {};
        };
        switch (room.player2) {
          case (?slot) {
            let invites = Map.get(invitationsByUser, phash, slot.principal);
            switch (invites) {
              case (?inviteList) {
                let filtered = Buffer.Buffer<Lobby.RoomId>(0);
                for (invite in inviteList.vals()) {
                  if (invite != room.id) {
                    filtered.add(invite);
                  };
                };
                let updated = Buffer.toArray(filtered);
                if (updated.size() > 0) {
                  Map.set(invitationsByUser, phash, slot.principal, updated);
                } else {
                  Map.delete(invitationsByUser, phash, slot.principal);
                };
              };
              case (null) {};
            };
          };
          case (null) {};
        };
      };
    };
  };

  // Get joined room for caller if exists
  public shared query (msg) func getJoinedRoom() : async ?Lobby.Room {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return null;
    };

    // Get joined room ID
    let joinedRoomId = Map.get(playerToRoom, phash, msg.caller);
    switch (joinedRoomId) {
      case (?roomId) {
        // Get room from active rooms
        return Map.get(rooms, nhash, roomId);
      };
      case (null) {
        return null;
      };
    };
  };

  // Get array of room IDs where caller is invited
  public shared query (msg) func getInvitations() : async [Lobby.RoomId] {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return [];
    };

    // Get invitations
    let invitations = Map.get(invitationsByUser, phash, msg.caller);
    switch (invitations) {
      case (?inviteList) {
        // Filter out stale invitations (rooms that don't exist anymore)
        var validInvites = Buffer.Buffer<Lobby.RoomId>(0);
        for (roomId in inviteList.vals()) {
          // Check if room still exists in active rooms
          let roomOpt = Map.get(rooms, nhash, roomId);
          switch (roomOpt) {
            case (?_) {
              // Room exists, add to valid invitations
              validInvites.add(roomId);
            };
            case (null) {
              // Room was archived or doesn't exist - skip (stale invitation)
            };
          };
        };
        return Buffer.toArray(validInvites);
      };
      case (null) {
        return [];
      };
    };
  };

  // Get room by ID
  public shared query func getRoom(roomId : Lobby.RoomId) : async ?Lobby.Room {
    // Try active rooms first
    let activeRoom = Map.get(rooms, nhash, roomId);
    switch (activeRoom) {
      case (?room) {
        return ?room;
      };
      case (null) {
        // Try archived rooms
        return Map.get(archivedRooms, nhash, roomId);
      };
    };
  };

  // Get all active rooms with pagination (newest first)
  public shared query func getRooms(page : Nat, limit : Nat) : async [Lobby.Room] {
    // Validate pagination
    if (limit == 0 or limit > 100) {
      return [];
    };

    let total = activeRooms.size();
    // Safe division: calculate indices with overflow protection
    let pageLimit = (page + 1) * limit;
    let startIndex = if (total > pageLimit and pageLimit <= total) total - pageLimit else 0;
    let endLimit = page * limit;
    let endIndex = if (total > endLimit and endLimit <= total) total - endLimit else 0;
    
    if (startIndex >= endIndex or endIndex > total) {
      return [];
    };

    var result = Buffer.Buffer<Lobby.Room>(0);
    var i = endIndex;
    while (i > startIndex) {
      i -= 1;
      result.add(activeRooms.get(i));
    };
    return Buffer.toArray(result);
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
