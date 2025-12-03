#!/bin/bash

# Interactive Skill Module Test Tool
# Tests SkillModule canister with a menu-driven interface

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
SKILL_MODULE_CANISTER="skill_module"
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
    # If no explicit error and contains data, assume success
    if echo "$response" | grep -q "id =\|moduleId =\|quizId ="; then
        return 0
    fi
    # If null, might be success (query returning null)
    if echo "$response" | grep -q "null"; then
        return 0
    fi
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

# Function to create module
create_module() {
    print_header "Create Module"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found. Please set up an identity first."
        return 1
    fi
    
    echo ""
    read -p "Enter module title: " title
    if [ -z "$title" ]; then
        print_error "Title is required"
        return 1
    fi
    
    # Escape double quotes in title for Candid
    title_escaped=$(echo "$title" | sed 's/"/\\"/g')
    
    echo ""
    read -p "Enter module description (optional, press Enter to skip): " description
    if [ -n "$description" ]; then
        # Escape double quotes in description for Candid
        description_escaped=$(echo "$description" | sed 's/"/\\"/g')
    fi
    
    echo ""
    echo "Module Status:"
    echo "1) Draft"
    echo "2) Published"
    read -p "Choose status (1 or 2): " status_choice
    
    local status=""
    case "$status_choice" in
        1)
            status="variant { Draft }"
            ;;
        2)
            status="variant { Published }"
            ;;
        *)
            print_error "Invalid choice, defaulting to Draft"
            status="variant { Draft }"
            ;;
    esac
    
    echo ""
    read -p "Enter order (number): " order
    if [ -z "$order" ]; then
        order="0"
    fi
    
    echo ""
    echo "Lessons:"
    echo "Enter number of lessons (0 if none): "
    read -p "> " num_lessons
    
    local lessons_array="vec {}"
    if [ "$num_lessons" -gt 0 ]; then
        lessons_array="vec {"
        for ((i=1; i<=num_lessons; i++)); do
            echo ""
            echo "Lesson $i:"
            read -p "  Enter lesson ID: " lesson_id
            read -p "  Enter lesson order: " lesson_order
            echo "  Enter lesson data (JSON string, e.g., {\"title\":\"Lesson 1\",\"content\":\"Content here\"}): "
            read -p "  > " lesson_data
            
            # Escape double quotes in JSON data for Candid
            lesson_data_escaped=$(echo "$lesson_data" | sed 's/"/\\"/g')
            
            if [ "$i" -gt 1 ]; then
                lessons_array="${lessons_array}; "
            fi
            lessons_array="${lessons_array}record { id = ${lesson_id} : nat; data = \"${lesson_data_escaped}\"; order = ${lesson_order} : nat }"
        done
        lessons_array="${lessons_array} }"
    fi
    
    echo ""
    echo "Quizzes:"
    echo "Enter number of quizzes (0 if none): "
    read -p "> " num_quizzes
    
    local quizzes_array="vec {}"
    if [ "$num_quizzes" -gt 0 ]; then
        quizzes_array="vec {"
        for ((i=1; i<=num_quizzes; i++)); do
            echo ""
            echo "Quiz $i:"
            read -p "  Enter quiz ID: " quiz_id
            read -p "  Enter quiz title: " quiz_title
            read -p "  Enter quiz description (optional, press Enter to skip): " quiz_desc
            read -p "  Enter passing score (0-100): " passing_score
            if [ -z "$passing_score" ]; then
                passing_score="80"
            fi
            
            # Escape double quotes in quiz title and description for Candid
            quiz_title_escaped=$(echo "$quiz_title" | sed 's/"/\\"/g')
            if [ -n "$quiz_desc" ]; then
                quiz_desc_escaped=$(echo "$quiz_desc" | sed 's/"/\\"/g')
            fi
            
            echo "  Enter number of questions: "
            read -p "  > " num_questions
            
            local questions_array="vec {}"
            if [ "$num_questions" -gt 0 ]; then
                questions_array="vec {"
                for ((j=1; j<=num_questions; j++)); do
                    echo ""
                    echo "    Question $j:"
                    read -p "      Enter question ID: " q_id
                    read -p "      Enter question text: " q_text
                    read -p "      Enter number of options: " num_options
                    read -p "      Enter correct answer index (0-based): " correct_idx
                    read -p "      Enter points: " q_points
                    if [ -z "$q_points" ]; then
                        q_points="1"
                    fi
                    
                    # Escape double quotes in question text for Candid
                    q_text_escaped=$(echo "$q_text" | sed 's/"/\\"/g')
                    
                    local options_array="vec {"
                    for ((k=0; k<num_options; k++)); do
                        read -p "      Enter option $k: " option_text
                        # Escape double quotes in option text for Candid
                        option_text_escaped=$(echo "$option_text" | sed 's/"/\\"/g')
                        if [ "$k" -gt 0 ]; then
                            options_array="${options_array}; "
                        fi
                        options_array="${options_array}\"${option_text_escaped}\""
                    done
                    options_array="${options_array} }"
                    
                    if [ "$j" -gt 1 ]; then
                        questions_array="${questions_array}; "
                    fi
                    questions_array="${questions_array}record { id = ${q_id} : nat; questionText = \"${q_text_escaped}\"; options = ${options_array}; correctAnswer = ${correct_idx} : nat; points = ${q_points} : nat }"
                done
                questions_array="${questions_array} }"
            fi
            
            local quiz_desc_opt="null"
            if [ -n "$quiz_desc" ]; then
                quiz_desc_opt="opt \"${quiz_desc_escaped}\""
            fi
            
            if [ "$i" -gt 1 ]; then
                quizzes_array="${quizzes_array}; "
            fi
            quizzes_array="${quizzes_array}record { id = ${quiz_id} : nat; title = \"${quiz_title_escaped}\"; description = ${quiz_desc_opt}; questions = ${questions_array}; passingScore = ${passing_score} : nat; timeLimit = null }"
        done
        quizzes_array="${quizzes_array} }"
    fi
    
    local desc_opt="null"
    if [ -n "$description" ]; then
        desc_opt="opt \"${description_escaped}\""
    fi
    
    local candid_input="record { title = \"${title_escaped}\"; description = ${desc_opt}; lessons = ${lessons_array}; quizzes = ${quizzes_array}; status = ${status}; order = ${order} : nat }"
    
    print_action "Creating module..."
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} create_module "(${candid_input})" 2>&1)
    
    if is_success "$response"; then
        print_success "Module created successfully"
        local module_id=$(extract_numeric_value "$response" "id")
        if [ -n "$module_id" ]; then
            print_info "Module ID: ${module_id}"
        fi
        echo "$response" | head -50
    else
        print_error "Failed to create module"
        echo "$response"
        return 1
    fi
}

# Function to get module by ID
get_module() {
    print_header "Get Module by ID"
    
    echo ""
    read -p "Enter module ID: " module_id
    
    if [ -z "$module_id" ]; then
        print_error "Module ID is required"
        return 1
    fi
    
    print_action "Fetching module: ${module_id}"
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} get_module "(${module_id} : nat)" 2>&1)
    
    if echo "$response" | grep -q "null"; then
        print_warning "Module not found"
        echo "$response"
        return 1
    fi
    
    print_success "Module found"
    echo "$response" | head -100
}

# Function to start quiz
start_quiz() {
    print_header "Start Quiz"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    echo ""
    read -p "Enter module ID: " module_id
    read -p "Enter quiz ID: " quiz_id
    
    if [ -z "$module_id" ] || [ -z "$quiz_id" ]; then
        print_error "Module ID and Quiz ID are required"
        return 1
    fi
    
    print_action "Starting quiz attempt..."
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} start_quiz "(${module_id} : nat, ${quiz_id} : nat)" 2>&1)
    
    if is_success "$response"; then
        print_success "Quiz started successfully"
        echo "$response" | head -30
    else
        print_error "Failed to start quiz"
        echo "$response"
        return 1
    fi
}

# Function to answer quiz
answer_quiz() {
    print_header "Answer Quiz"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    echo ""
    read -p "Enter module ID: " module_id
    read -p "Enter quiz ID: " quiz_id
    
    if [ -z "$module_id" ] || [ -z "$quiz_id" ]; then
        print_error "Module ID and Quiz ID are required"
        return 1
    fi
    
    echo ""
    echo "Enter number of answers: "
    read -p "> " num_answers
    
    if [ -z "$num_answers" ] || [ "$num_answers" -eq 0 ]; then
        print_error "At least one answer is required"
        return 1
    fi
    
    local answers_array="vec {"
    for ((i=1; i<=num_answers; i++)); do
        echo ""
        echo "Answer $i:"
        read -p "  Enter question ID: " q_id
        read -p "  Enter answer index (0-based): " answer_idx
        
        if [ "$i" -gt 1 ]; then
            answers_array="${answers_array}; "
        fi
        answers_array="${answers_array}record { questionId = ${q_id} : nat; answer = ${answer_idx} : nat }"
    done
    answers_array="${answers_array} }"
    
    print_action "Submitting quiz answers..."
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} answer_quiz "(${module_id} : nat, ${quiz_id} : nat, ${answers_array})" 2>&1)
    
    if is_success "$response"; then
        print_success "Quiz answered successfully"
        local score=$(extract_numeric_value "$response" "score")
        if [ -n "$score" ]; then
            print_info "Score: ${score}%"
        fi
        echo "$response" | head -50
    else
        print_error "Failed to submit answers"
        echo "$response"
        return 1
    fi
}

# Function to get quiz attempt
get_quiz_attempt() {
    print_header "Get Quiz Attempt"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    echo ""
    read -p "Enter module ID: " module_id
    read -p "Enter quiz ID: " quiz_id
    
    if [ -z "$module_id" ] || [ -z "$quiz_id" ]; then
        print_error "Module ID and Quiz ID are required"
        return 1
    fi
    
    print_action "Fetching quiz attempt..."
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} get_quiz_attempt "(${module_id} : nat, ${quiz_id} : nat)" 2>&1)
    
    if echo "$response" | grep -q "null"; then
        print_warning "Quiz attempt not found"
        echo "$response"
        return 1
    fi
    
    print_success "Quiz attempt found"
    local score=$(extract_numeric_value "$response" "score")
    if [ -n "$score" ]; then
        print_info "Score: ${score}%"
    fi
    echo "$response" | head -50
}

# Function to get quiz config
get_quiz_config() {
    print_header "Get Quiz Configuration"
    
    print_action "Fetching quiz configuration..."
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} get_quiz_config 2>&1)
    
    print_success "Quiz configuration:"
    echo "$response" | head -20
}

# Function to update quiz config
update_quiz_config() {
    print_header "Update Quiz Configuration"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    echo ""
    read -p "Enter default passing score (0-100, default 80): " passing_score
    if [ -z "$passing_score" ]; then
        passing_score="80"
    fi
    
    echo ""
    read -p "Enter default attempt delay in seconds (default 3600): " delay_seconds
    if [ -z "$delay_seconds" ]; then
        delay_seconds="3600"
    fi
    
    echo ""
    read -p "Enter time limit in seconds (optional, press Enter for no limit): " time_limit
    
    local time_limit_opt="null"
    if [ -n "$time_limit" ]; then
        # Convert seconds to nanoseconds
        local time_limit_nanos=$((time_limit * 1000000000))
        time_limit_opt="opt ${time_limit_nanos} : int"
    fi
    
    local candid_input="record { defaultTimeLimit = ${time_limit_opt}; defaultPassingScore = ${passing_score} : nat; defaultAttemptDelaySeconds = ${delay_seconds} : nat }"
    
    print_action "Updating quiz configuration..."
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} update_quiz_config "(${candid_input})" 2>&1)
    
    if is_success "$response"; then
        print_success "Quiz configuration updated successfully"
        echo "$response"
    else
        print_error "Failed to update quiz configuration"
        echo "$response"
        return 1
    fi
}

# Function to add authorized principal
add_authorized_principal() {
    print_header "Add Authorized Principal"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    echo ""
    read -p "Enter principal ID to authorize: " auth_principal
    
    if [ -z "$auth_principal" ]; then
        print_error "Principal ID is required"
        return 1
    fi
    
    print_action "Adding authorized principal: ${auth_principal}"
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} addAuthorizedPrincipal "(principal \"${auth_principal}\")" 2>&1)
    
    if is_success "$response"; then
        print_success "Authorized principal added successfully"
        echo "$response"
    else
        print_error "Failed to add authorized principal"
        echo "$response"
        return 1
    fi
}

# Function to remove authorized principal
remove_authorized_principal() {
    print_header "Remove Authorized Principal"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    echo ""
    read -p "Enter principal ID to remove: " auth_principal
    
    if [ -z "$auth_principal" ]; then
        print_error "Principal ID is required"
        return 1
    fi
    
    print_action "Removing authorized principal: ${auth_principal}"
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} removeAuthorizedPrincipal "(principal \"${auth_principal}\")" 2>&1)
    
    if is_success "$response"; then
        print_success "Authorized principal removed successfully"
        echo "$response"
    else
        print_error "Failed to remove authorized principal"
        echo "$response"
        return 1
    fi
}

# Function to get authorized principals
get_authorized_principals() {
    print_header "Get Authorized Principals"
    
    local principal=$(get_user_principal)
    if [ -z "$principal" ]; then
        print_error "No principal found"
        return 1
    fi
    
    print_action "Fetching authorized principals..."
    local response=$(dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} getAuthorizedPrincipals 2>&1)
    
    if is_success "$response"; then
        print_success "Authorized principals:"
        echo "$response" | head -50
    else
        print_error "Failed to get authorized principals"
        echo "$response"
        return 1
    fi
}

# Main menu
show_menu() {
    clear
    print_header "Interactive Skill Module Test Tool"
    show_current_identity
    echo ""
    echo "Module Operations:"
    echo "  1) Create module"
    echo "  2) Get module by ID"
    echo ""
    echo "Quiz Operations:"
    echo "  3) Start quiz"
    echo "  4) Answer quiz"
    echo "  5) Get quiz attempt"
    echo ""
    echo "Configuration:"
    echo "  6) Get quiz config"
    echo "  7) Update quiz config"
    echo ""
    echo "Access Control:"
    echo "  8) Add authorized principal"
    echo "  9) Remove authorized principal"
    echo "  10) Get authorized principals"
    echo ""
    echo "Identity:"
    echo "  11) Show current identity"
    echo "  12) Change identity"
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
                create_module
                read -p "Press Enter to continue..."
                ;;
            2)
                get_module
                read -p "Press Enter to continue..."
                ;;
            3)
                start_quiz
                read -p "Press Enter to continue..."
                ;;
            4)
                answer_quiz
                read -p "Press Enter to continue..."
                ;;
            5)
                get_quiz_attempt
                read -p "Press Enter to continue..."
                ;;
            6)
                get_quiz_config
                read -p "Press Enter to continue..."
                ;;
            7)
                update_quiz_config
                read -p "Press Enter to continue..."
                ;;
            8)
                add_authorized_principal
                read -p "Press Enter to continue..."
                ;;
            9)
                remove_authorized_principal
                read -p "Press Enter to continue..."
                ;;
            10)
                get_authorized_principals
                read -p "Press Enter to continue..."
                ;;
            11)
                show_current_identity
                read -p "Press Enter to continue..."
                ;;
            12)
                change_identity
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

