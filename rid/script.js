/**
 * SmartStudy - Study Notes & Quiz Application
 * A complete study management system with authentication, notes CRUD, and quiz functionality
 */

// Application state management
const AppState = {
    currentUser: null,
    currentView: 'notes',
    notes: [],
    currentNoteId: null,
    quiz: {
        questions: [],
        currentQuestion: 0,
        score: 0,
        answers: [],
        isActive: false
    }
};



if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('sw.js')
      .then((reg) => console.log('✅ Service Worker registered:', reg.scope))
      .catch((err) => console.error('❌ Service Worker registration failed:', err));
  }
  



// Quiz questions data
const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "What is the most effective study technique for long-term retention?",
        options: [
            "Cramming the night before",
            "Spaced repetition over time",
            "Reading notes once",
            "Highlighting everything"
        ],
        correct: 1
    },
    {
        id: 2,
        question: "Which environment is best for focused studying?",
        options: [
            "Noisy coffee shop",
            "Bed with TV on",
            "Quiet, well-lit space",
            "While listening to music"
        ],
        correct: 2
    },
    {
        id: 3,
        question: "How long should study sessions typically last for optimal focus?",
        options: [
            "6-8 hours continuously",
            "25-50 minutes with breaks",
            "2-3 hours without breaks",
            "10-15 minutes only"
        ],
        correct: 1
    },
    {
        id: 4,
        question: "What is the Feynman Technique?",
        options: [
            "Speed reading method",
            "Memory palace technique",
            "Explaining concepts in simple terms",
            "Group study method"
        ],
        correct: 2
    },
    {
        id: 5,
        question: "When is the best time to review study material?",
        options: [
            "Only during exams",
            "Once a month",
            "Regularly with increasing intervals",
            "Never review, just move forward"
        ],
        correct: 2
    }
];

/**
 * Utility Functions
 */

// Show alert messages to user
function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    const alertMessage = document.getElementById('alertMessage');
    
    alertMessage.textContent = message;
    alert.className = `alert ${type}`;
    alert.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        alert.classList.add('hidden');
    }, 3000);
}

// Generate unique ID for notes
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date for display
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Local Storage Management
 */

// Save data to localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showAlert('Error saving data', 'error');
        return false;
    }
}

// Load data from localStorage
function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

// Remove data from localStorage
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

/**
 * Authentication Functions
 */

// Register new user
function registerUser(name, email, password) {
    const users = loadFromStorage('smartstudy_users', []);
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
        showAlert('User with this email already exists', 'error');
        return false;
    }
    
    // Create new user
    const newUser = {
        id: generateId(),
        name,
        email,
        password, // In a real app, this would be hashed
        createdAt: Date.now()
    };
    
    users.push(newUser);
    saveToStorage('smartstudy_users', users);
    
    showAlert('Account created successfully!', 'success');
    return true;
}

// Login user
function loginUser(email, password) {
    const users = loadFromStorage('smartstudy_users', []);
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        AppState.currentUser = user;
        saveToStorage('smartstudy_current_user', user);
        showDashboard();
        showAlert(`Welcome back, ${user.name}!`, 'success');
        return true;
    } else {
        showAlert('Invalid email or password', 'error');
        return false;
    }
}

// Logout user
function logoutUser() {
    AppState.currentUser = null;
    removeFromStorage('smartstudy_current_user');
    showAuthSection();
    showAlert('Logged out successfully', 'success');
}

// Check if user is logged in
function checkAuthStatus() {
    const user = loadFromStorage('smartstudy_current_user');
    if (user) {
        AppState.currentUser = user;
        showDashboard();
        return true;
    }
    return false;
}

/**
 * Notes Management Functions
 */

// Load user's notes
function loadUserNotes() {
    if (!AppState.currentUser) return [];
    
    const allNotes = loadFromStorage('smartstudy_notes', {});
    AppState.notes = allNotes[AppState.currentUser.id] || [];
    return AppState.notes;
}

// Save user's notes
function saveUserNotes() {
    if (!AppState.currentUser) return false;
    
    const allNotes = loadFromStorage('smartstudy_notes', {});
    allNotes[AppState.currentUser.id] = AppState.notes;
    return saveToStorage('smartstudy_notes', allNotes);
}

// Add new note
function addNote(title, content) {
    const note = {
        id: generateId(),
        title: title.trim(),
        content: content.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    AppState.notes.unshift(note);
    saveUserNotes();
    renderNotes();
    showAlert('Note added successfully!', 'success');
    return note;
}

// Update existing note
function updateNote(id, title, content) {
    const noteIndex = AppState.notes.findIndex(note => note.id === id);
    if (noteIndex === -1) {
        showAlert('Note not found', 'error');
        return false;
    }
    
    AppState.notes[noteIndex] = {
        ...AppState.notes[noteIndex],
        title: title.trim(),
        content: content.trim(),
        updatedAt: Date.now()
    };
    
    saveUserNotes();
    renderNotes();
    showAlert('Note updated successfully!', 'success');
    return true;
}

// Delete note
function deleteNote(id) {
    const noteIndex = AppState.notes.findIndex(note => note.id === id);
    if (noteIndex === -1) {
        showAlert('Note not found', 'error');
        return false;
    }
    
    if (confirm('Are you sure you want to delete this note?')) {
        AppState.notes.splice(noteIndex, 1);
        saveUserNotes();
        renderNotes();
        showAlert('Note deleted successfully!', 'success');
        return true;
    }
    return false;
}

// Get note by ID
function getNoteById(id) {
    return AppState.notes.find(note => note.id === id);
}

/**
 * Quiz Management Functions
 */

// Initialize quiz
function initializeQuiz() {
    AppState.quiz = {
        questions: [...QUIZ_QUESTIONS],
        currentQuestion: 0,
        score: 0,
        answers: [],
        isActive: false
    };
}

// Start quiz
function startQuiz() {
    initializeQuiz();
    AppState.quiz.isActive = true;
    showQuizQuestion();
}

// Submit quiz answer
function submitQuizAnswer(selectedOption) {
    const currentQ = AppState.quiz.questions[AppState.quiz.currentQuestion];
    const isCorrect = selectedOption === currentQ.correct;
    
    AppState.quiz.answers.push({
        questionId: currentQ.id,
        selected: selectedOption,
        correct: currentQ.correct,
        isCorrect
    });
    
    if (isCorrect) {
        AppState.quiz.score++;
    }
    
    // Show correct answer
    showQuizFeedback(selectedOption, currentQ.correct);
    
    // Enable next button
    document.getElementById('nextQuestionBtn').disabled = false;
}

// Move to next question or show results
function nextQuestion() {
    AppState.quiz.currentQuestion++;
    
    if (AppState.quiz.currentQuestion >= AppState.quiz.questions.length) {
        showQuizResults();
    } else {
        showQuizQuestion();
    }
}

// Calculate quiz score message
function getScoreMessage(score, total) {
    const percentage = (score / total) * 100;
    
    if (percentage >= 90) return "Excellent! You're a study master! 🌟";
    if (percentage >= 80) return "Great job! You know your stuff! 👏";
    if (percentage >= 70) return "Good work! Keep studying! 📚";
    if (percentage >= 60) return "Not bad! Room for improvement! 💪";
    return "Keep studying and try again! 📖";
}

/**
 * UI Rendering Functions
 */

// Show authentication section
function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

// Show dashboard
function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // Update user name
    document.getElementById('userName').textContent = `Welcome, ${AppState.currentUser.name}!`;
    
    // Load and show notes by default
    loadUserNotes();
    showNotesSection();
}

// Show notes section
function showNotesSection() {
    AppState.currentView = 'notes';
    document.getElementById('notes-section').classList.remove('hidden');
    document.getElementById('quiz-section').classList.add('hidden');
    
    // Update navigation
    document.getElementById('notesTab').classList.add('active');
    document.getElementById('quizTab').classList.remove('active');
    
    renderNotes();
}

// Show quiz section
function showQuizSection() {
    AppState.currentView = 'quiz';
    document.getElementById('notes-section').classList.add('hidden');
    document.getElementById('quiz-section').classList.remove('hidden');
    
    // Update navigation
    document.getElementById('notesTab').classList.remove('active');
    document.getElementById('quizTab').classList.add('active');
    
    resetQuizDisplay();
}

// Render notes list
function renderNotes() {
    const notesList = document.getElementById('notesList');
    
    if (AppState.notes.length === 0) {
        notesList.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <h3>No notes yet</h3>
                <p>Click "Add Note" to create your first study note!</p>
            </div>
        `;
        return;
    }
    
    notesList.innerHTML = AppState.notes.map(note => `
        <div class="note-card">
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? '...' : ''}</p>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
                ${formatDate(note.updatedAt)}
            </div>
            <div class="note-actions">
                <button class="btn btn-primary btn-small" onclick="editNote('${note.id}')">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteNote('${note.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Show note form for adding/editing
function showNoteForm(noteId = null) {
    const form = document.getElementById('noteForm');
    const formTitle = document.getElementById('formTitle');
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    const saveBtn = document.getElementById('saveNoteBtn');
    
    AppState.currentNoteId = noteId;
    
    if (noteId) {
        const note = getNoteById(noteId);
        if (note) {
            formTitle.textContent = 'Edit Note';
            titleInput.value = note.title;
            contentInput.value = note.content;
            saveBtn.textContent = 'Update Note';
        }
    } else {
        formTitle.textContent = 'Add New Note';
        titleInput.value = '';
        contentInput.value = '';
        saveBtn.textContent = 'Save Note';
    }
    
    form.classList.remove('hidden');
    titleInput.focus();
}

// Hide note form
function hideNoteForm() {
    document.getElementById('noteForm').classList.add('hidden');
    AppState.currentNoteId = null;
}

// Edit note
function editNote(id) {
    showNoteForm(id);
}

// Reset quiz display
function resetQuizDisplay() {
    document.getElementById('quizStart').classList.remove('hidden');
    document.getElementById('quizQuestions').classList.add('hidden');
    document.getElementById('quizResults').classList.add('hidden');
}

// Show quiz question
function showQuizQuestion() {
    const currentQ = AppState.quiz.questions[AppState.quiz.currentQuestion];
    const questionNumber = AppState.quiz.currentQuestion + 1;
    const totalQuestions = AppState.quiz.questions.length;
    
    // Update progress
    document.getElementById('questionNumber').textContent = `Question ${questionNumber} of ${totalQuestions}`;
    document.getElementById('progressFill').style.width = `${(questionNumber / totalQuestions) * 100}%`;
    
    // Render question
    document.getElementById('questionContainer').innerHTML = `
        <h3>${escapeHtml(currentQ.question)}</h3>
        <div class="quiz-options">
            ${currentQ.options.map((option, index) => `
                <div class="quiz-option" onclick="selectQuizOption(${index})">
                    ${escapeHtml(option)}
                </div>
            `).join('')}
        </div>
    `;
    
    // Show questions section
    document.getElementById('quizStart').classList.add('hidden');
    document.getElementById('quizQuestions').classList.remove('hidden');
    document.getElementById('quizResults').classList.add('hidden');
    
    // Reset next button
    document.getElementById('nextQuestionBtn').disabled = true;
    document.getElementById('nextQuestionBtn').textContent = 
        questionNumber === totalQuestions ? 'Show Results' : 'Next Question';
}

// Select quiz option
function selectQuizOption(optionIndex) {
    // Remove previous selections
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Mark selected option
    document.querySelectorAll('.quiz-option')[optionIndex].classList.add('selected');
    
    // Submit answer
    submitQuizAnswer(optionIndex);
}

// Show quiz feedback
function showQuizFeedback(selected, correct) {
    const options = document.querySelectorAll('.quiz-option');
    
    options.forEach((option, index) => {
        if (index === correct) {
            option.classList.add('correct');
        } else if (index === selected && selected !== correct) {
            option.classList.add('incorrect');
        }
        // Disable further clicking
        option.style.pointerEvents = 'none';
    });
}

// Show quiz results
function showQuizResults() {
    const score = AppState.quiz.score;
    const total = AppState.quiz.questions.length;
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('scoreMessage').textContent = getScoreMessage(score, total);
    
    // Show results section
    document.getElementById('quizQuestions').classList.add('hidden');
    document.getElementById('quizResults').classList.remove('hidden');
    
    AppState.quiz.isActive = false;
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Event Listeners Setup
 */

function setupEventListeners() {
    // Authentication form toggles
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });
    
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        loginUser(email, password);
    });
    
    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (registerUser(name, email, password)) {
            // Auto-login after successful registration
            setTimeout(() => {
                loginUser(email, password);
            }, 1000);
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    
    // Navigation tabs
    document.getElementById('notesTab').addEventListener('click', showNotesSection);
    document.getElementById('quizTab').addEventListener('click', showQuizSection);
    
    // Notes functionality
    document.getElementById('addNoteBtn').addEventListener('click', () => showNoteForm());
    document.getElementById('cancelNoteBtn').addEventListener('click', hideNoteForm);
    
    // Note form submission
    document.getElementById('noteFormElement').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        
        if (AppState.currentNoteId) {
            updateNote(AppState.currentNoteId, title, content);
        } else {
            addNote(title, content);
        }
        
        hideNoteForm();
    });
    
    // Quiz functionality
    document.getElementById('startQuizBtn').addEventListener('click', startQuiz);
    document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
    document.getElementById('retakeQuizBtn').addEventListener('click', startQuiz);
    
    // Alert close button
    document.getElementById('closeAlert').addEventListener('click', () => {
        document.getElementById('alert').classList.add('hidden');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key to close forms/alerts
        if (e.key === 'Escape') {
            hideNoteForm();
            document.getElementById('alert').classList.add('hidden');
        }
        
        // Ctrl/Cmd + N to add new note (when in notes section)
        if ((e.ctrlKey || e.metaKey) && e.key === 'n' && AppState.currentView === 'notes') {
            e.preventDefault();
            showNoteForm();
        }
    });
}

/**
 * Application Initialization
 */

function initializeApp() {
    console.log('🚀 SmartStudy App Initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    if (!checkAuthStatus()) {
        showAuthSection();
    }
    
    console.log('✅ SmartStudy App Ready!');
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export functions for global access (for onclick handlers)
window.editNote = editNote;
window.deleteNote = deleteNote;
window.selectQuizOption = selectQuizOption;
