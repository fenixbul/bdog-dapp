#!/bin/bash

# Interactive Game Manager Test Tool
# Tests Players and Lobbies canisters with a menu-driven interface

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
PLAYERS_CANISTER="players"
LOBBIES_CANISTER="lobbies"
NETWORK="local"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_action() {
    echo -e "${PURPLE}🎯 $1${NC}"
}

print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check if result is successful
is_success() {
    local response="$1"
    # Check for common success patterns in Candid responses
    if echo "$response" | grep -q "ok\|Ok\|#ok\|variant.*ok"; then
        return 0
    fi
    # Check for error patterns
    if echo "$response" | grep -q "err\|Err\|#err\|variant.*err"; then
        return 1
    fi
    # If no explicit error, assume success
    return 0
}

# Function to extract numeric values from candid responses
extract_numeric_value() {
    local response="$1"
    local field="$2"
    local value=$(echo "$response" | grep -o "${field} = [0-9]*" | cut -d' ' -f3)
    echo "${value:-0}"  # Default to 0 if not found
}

# Function to extract text values from candid responses
extract_value() {
    local response="$1"
    local field="$2"
    echo "$response" | grep -o "${field} = [^,)]*" | cut -d' ' -f3- | sed 's/"//g'
}

# Function to extract principal from candid responses
extract_principal() {
    local response="$1"
    local field="$2"
    echo "$response" | grep -o "${field} = [a-z0-9-]*" | cut -d' ' -f3
}

# Function to get current user principal
get_user_principal() {
    dfx identity get-principal 2>/dev/null
}

# Function to check DFX environment
check_dfx_environment() {
    print_info "Checking DFX environment..."
    if ! command -v dfx &> /dev/null; then
        print_error "DFX is not installed or not in PATH"
        exit 1
    fi
    
    if ! dfx ping ${NETWORK} &> /dev/null; then
        print_error "Cannot connect to ${NETWORK} network. Is dfx running?"
        print_info "Start local replica with: dfx start"
        exit 1
    fi
    
    print_success "DFX environment ready (network: ${NETWORK})"
}

# Function to display current identity
show_current_identity() {
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_warning "No identity found"
        return
    fi
    local identity=$(dfx identity whoami 2>/dev/null || echo "default")
    print_info "Current identity: ${identity}"
    print_info "Principal: ${principal}"
}

# Function to change identity
change_identity() {
    print_header "Change Identity"
    print_info "Available identities:"
    dfx identity list
    
    echo ""
    read -p "Enter identity name (or 'default'): " identity_name
    if [ -z "$identity_name" ]; then
        identity_name="default"
    fi
    
    print_action "Switching to identity: ${identity_name}"
    if dfx identity use "${identity_name}" 2>/dev/null; then
        print_success "Switched to identity: ${identity_name}"
        show_current_identity
    else
        print_error "Failed to switch identity"
        return 1
    fi
}

# Function to create player
create_player() {
    print_header "Create Player"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found. Please set up an identity first."
        return 1
    fi
    
    print_info "Creating player for principal: ${principal}"
    
    echo ""
    read -p "Enter referrer principal (optional, press Enter to skip): " referrer_pid
    
    local referrer_arg=""
    if [ -n "$referrer_pid" ]; then
        referrer_arg="(opt principal \"${referrer_pid}\")"
    else
        referrer_arg="null"
    fi
    
    print_action "Calling create_player..."
    local response=$(dfx canister --network ${NETWORK} call ${PLAYERS_CANISTER} create_player "(principal \"${principal}\", ${referrer_arg})" 2>&1)
    
    if is_success "$response"; then
        print_success "Player created successfully"
        echo "$response" | head -20
    else
        print_error "Failed to create player"
        echo "$response"
        return 1
    fi
}

# Function to get player by ID
get_player_by_id() {
    print_header "Get Player by ID"
    
    echo ""
    read -p "Enter player principal ID: " player_id
    
    if [ -z "$player_id" ]; then
        print_error "Player ID is required"
        return 1
    fi
    
    print_action "Fetching player: ${player_id}"
    local response=$(dfx canister --network ${NETWORK} call ${PLAYERS_CANISTER} get_player_by_id "(principal \"${player_id}\")" 2>&1)
    
    if is_success "$response"; then
        print_success "Player found"
        echo "$response"
    else
        print_error "Failed to get player"
        echo "$response"
        return 1
    fi
}

# Function to get current player
get_current_player() {
    print_header "Get Current Player"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    print_action "Fetching current player: ${principal}"
    local response=$(dfx canister --network ${NETWORK} call ${PLAYERS_CANISTER} get_player 2>&1)
    
    if is_success "$response"; then
        print_success "Player found"
        echo "$response"
    else
        print_error "Failed to get player"
        echo "$response"
        return 1
    fi
}

# Function to create room
create_room() {
    print_header "Create Room"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    echo ""
    read -p "Invite player2? Enter principal ID (or press Enter to skip): " player2_id
    
    local player2_arg=""
    if [ -n "$player2_id" ]; then
        player2_arg="(opt principal \"${player2_id}\")"
    else
        player2_arg="null"
    fi
    
    print_action "Creating room..."
    local response=$(dfx canister --network ${NETWORK} call ${LOBBIES_CANISTER} create_room "(${player2_arg})" 2>&1)
    
    if is_success "$response"; then
        print_success "Room created successfully"
        # Extract room ID
        local room_id=$(echo "$response" | grep -o "id = [0-9]*" | cut -d' ' -f3)
        if [ -n "$room_id" ]; then
            print_info "Room ID: ${room_id}"
        fi
        echo "$response" | head -30
    else
        print_error "Failed to create room"
        echo "$response"
        return 1
    fi
}

# Function to join room
join_room() {
    print_header "Join Room"
    
    echo ""
    read -p "Enter room ID: " room_id
    
    if [ -z "$room_id" ]; then
        print_error "Room ID is required"
        return 1
    fi
    
    print_action "Joining room ${room_id}..."
    local response=$(dfx canister --network ${NETWORK} call ${LOBBIES_CANISTER} join_room "(${room_id} : nat)" 2>&1)
    
    if is_success "$response"; then
        print_success "Joined room successfully"
        echo "$response" | head -30
    else
        print_error "Failed to join room"
        echo "$response"
        return 1
    fi
}

# Function to update allowed players
update_allowed_player() {
    print_header "Update Allowed Players"
    
    echo ""
    read -p "Enter room ID: " room_id
    
    if [ -z "$room_id" ]; then
        print_error "Room ID is required"
        return 1
    fi
    
    echo ""
    read -p "Enter player principal ID: " player_id
    
    if [ -z "$player_id" ]; then
        print_error "Player ID is required"
        return 1
    fi
    
    echo ""
    echo "1) Add player"
    echo "2) Remove player"
    read -p "Choose action (1 or 2): " action_choice
    
    local add_flag="false"
    case "$action_choice" in
        1)
            add_flag="true"
            print_action "Adding player ${player_id} to room ${room_id}..."
            ;;
        2)
            add_flag="false"
            print_action "Removing player ${player_id} from room ${room_id}..."
            ;;
        *)
            print_error "Invalid choice"
            return 1
            ;;
    esac
    
    local response=$(dfx canister --network ${NETWORK} call ${LOBBIES_CANISTER} updateAllowedPlayer "(${room_id} : nat, principal \"${player_id}\", ${add_flag})" 2>&1)
    
    if is_success "$response"; then
        print_success "Room updated successfully"
        echo "$response" | head -30
    else
        print_error "Failed to update room"
        echo "$response"
        return 1
    fi
}

# Function to delete room
delete_room() {
    print_header "Delete Room"
    
    echo ""
    read -p "Enter room ID to delete: " room_id
    
    if [ -z "$room_id" ]; then
        print_error "Room ID is required"
        return 1
    fi
    
    print_warning "This will delete room ${room_id}. Are you sure?"
    read -p "Type 'yes' to confirm: " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Deletion cancelled"
        return 0
    fi
    
    print_action "Deleting room ${room_id}..."
    local response=$(dfx canister --network ${NETWORK} call ${LOBBIES_CANISTER} deleteRoom "(${room_id} : nat)" 2>&1)
    
    if is_success "$response"; then
        print_success "Room deleted successfully"
        echo "$response"
    else
        print_error "Failed to delete room"
        echo "$response"
        return 1
    fi
}

# Main menu
show_menu() {
    clear
    print_header "Interactive Game Manager Test Tool"
    show_current_identity
    echo ""
    echo "Players Canister Operations:"
    echo "  1) Get current player principal"
    echo "  2) Change identity"
    echo "  3) Create player"
    echo "  4) Get player by ID"
    echo "  5) Get current player"
    echo ""
    echo "Lobbies Canister Operations:"
    echo "  6) Create room"
    echo "  7) Join room"
    echo "  8) Update allowed players"
    echo "  9) Delete room"
    echo ""
    echo "  0) Exit"
    echo ""
}

# Main loop
main() {
    check_dfx_environment
    echo ""
    
    while true; do
        show_menu
        read -p "Select an option: " choice
        
        case "$choice" in
            1)
                get_user_principal
                read -p "Press Enter to continue..."
                ;;
            2)
                change_identity
                read -p "Press Enter to continue..."
                ;;
            3)
                create_player
                read -p "Press Enter to continue..."
                ;;
            4)
                get_player_by_id
                read -p "Press Enter to continue..."
                ;;
            5)
                get_current_player
                read -p "Press Enter to continue..."
                ;;
            6)
                create_room
                read -p "Press Enter to continue..."
                ;;
            7)
                join_room
                read -p "Press Enter to continue..."
                ;;
            8)
                update_allowed_player
                read -p "Press Enter to continue..."
                ;;
            9)
                delete_room
                read -p "Press Enter to continue..."
                ;;
            0)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                sleep 1
                ;;
        esac
    done
}

# Run main function
main

