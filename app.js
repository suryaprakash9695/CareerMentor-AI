/* 
   CareerMentor AI - Core Logic & Engine Controllers
*/

// Initialize AOS
document.addEventListener('DOMContentLoaded', () => {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });
    initApp();
});

// App Global State
const state = {
    theme: localStorage.getItem('careermentor_theme') || 'dark',
    apiKey: localStorage.getItem('groq_api_key') || '',
    mockMode: localStorage.getItem('settings-mock-mode') !== 'false',
    assessment: JSON.parse(localStorage.getItem('user_assessment_data')) || null,
    results: JSON.parse(localStorage.getItem('user_assessment_results')) || null,
    activeView: 'dashboard-home',
    selectedSkills: new Set(),
    selectedInterests: new Set(),
    todoTasks: JSON.parse(localStorage.getItem('productivity_tasks')) || [],
    placementDeadline: localStorage.getItem('placement_deadline_date') || '',
    mockInterview: {
        active: false,
        timerInterval: null,
        timeElapsed: 0,
        currentQuestionIndex: 0,
        questions: [],
        responses: [],
        score: 0,
        history: []
    },
    chatHistory: [
        { role: 'assistant', content: "Welcome! I'm your private AI Career Coach, powered by Groq. Ask me anything about placement strategies, project advice, resume updates, or domain choices." }
    ]
};

// ================= DATA BANKS =================

const SKILLS_LIST = [
    "C", "C++", "Java", "Python", "JavaScript", "React", "Angular", "Vue", "Node.js", "Express", 
    "MongoDB", "MySQL", "Spring Boot", "AI", "Machine Learning", "Data Science", "Cyber Security", 
    "Cloud Computing", "DevOps", "UI/UX Design", "Android Development", "Blockchain", "TypeScript", 
    "Git", "Docker", "Kubernetes", "AWS"
];

const INTERESTS_LIST = [
    "Programming", "Problem Solving", "Research", "Designing", "Entrepreneurship", 
    "Public Speaking", "Management", "Analytics", "Teaching"
];

// Career Database containing pre-compiled metrics for mock generators & comparison charts
const CAREER_DB = {
    "Software Engineer": {
        skills: ["C++", "Java", "Python", "Data Structures", "Git", "SQL"],
        growth: "High", demand: "85%", difficulty: "Medium", salary: { fresher: "6-8 LPA", mid: "12-18 LPA", senior: "25-40 LPA" },
        growthVal: 8, demandVal: 8.5, diffVal: 6, curveVal: 6.5, outlook: "Increasing demand in SaaS, Web3 and automated systems."
    },
    "Full Stack Developer": {
        skills: ["JavaScript", "React", "Node.js", "Express", "MySQL", "Git", "DevOps"],
        growth: "Very High", demand: "92%", difficulty: "Medium", salary: { fresher: "5-7 LPA", mid: "11-16 LPA", senior: "22-35 LPA" },
        growthVal: 9.2, demandVal: 9, diffVal: 6.5, curveVal: 7.5, outlook: "High startups demand for rapid product builders."
    },
    "Frontend Developer": {
        skills: ["JavaScript", "React", "Vue", "UI/UX Design", "Git"],
        growth: "High", demand: "80%", difficulty: "Low", salary: { fresher: "4-6 LPA", mid: "9-14 LPA", senior: "18-28 LPA" },
        growthVal: 7.8, demandVal: 8, diffVal: 5, curveVal: 5.5, outlook: "Focusing heavily on responsive design and interactive animations."
    },
    "Backend Developer": {
        skills: ["Java", "Node.js", "Express", "MongoDB", "MySQL", "Spring Boot", "Docker"],
        growth: "High", demand: "88%", difficulty: "Medium", salary: { fresher: "5-8 LPA", mid: "11-17 LPA", senior: "22-36 LPA" },
        growthVal: 8.5, demandVal: 8.8, diffVal: 7, curveVal: 7, outlook: "Transitioning toward microservices, serverless APIs and low-latency storage."
    },
    "Java Developer": {
        skills: ["Java", "Spring Boot", "MySQL", "Git", "Docker"],
        growth: "Medium", demand: "75%", difficulty: "Medium", salary: { fresher: "4.5-7 LPA", mid: "10-15 LPA", senior: "20-30 LPA" },
        growthVal: 7, demandVal: 7.5, diffVal: 6, curveVal: 6, outlook: "Stable enterprise backend positions and cloud migrations."
    },
    "Python Developer": {
        skills: ["Python", "MySQL", "Git", "Machine Learning", "Data Science"],
        growth: "High", demand: "82%", difficulty: "Medium", salary: { fresher: "5-7.5 LPA", mid: "10.5-16 LPA", senior: "21-32 LPA" },
        growthVal: 8, demandVal: 8.2, diffVal: 5.5, curveVal: 6, outlook: "High growth fueled by automation scripting and analytics workflows."
    },
    "AI Engineer": {
        skills: ["Python", "AI", "Machine Learning", "Data Science", "Cloud Computing"],
        growth: "Exponential", demand: "98%", difficulty: "High", salary: { fresher: "8-12 LPA", mid: "18-28 LPA", senior: "38-60 LPA" },
        growthVal: 9.9, demandVal: 9.8, diffVal: 9, curveVal: 9, outlook: "Leading the global tech disruption. Focus on LLMs, agentic workflows, and computer vision."
    },
    "Data Scientist": {
        skills: ["Python", "Data Science", "Machine Learning", "MySQL", "Analytics"],
        growth: "Very High", demand: "90%", difficulty: "High", salary: { fresher: "7-10 LPA", mid: "15-22 LPA", senior: "30-48 LPA" },
        growthVal: 9, demandVal: 9, diffVal: 8, curveVal: 8.5, outlook: "Essential across corporate metrics, marketing engines, and forecast models."
    },
    "Cyber Security Analyst": {
        skills: ["Python", "Cyber Security", "Cloud Computing", "DevOps"],
        growth: "Very High", demand: "87%", difficulty: "High", salary: { fresher: "5.5-8 LPA", mid: "12-18 LPA", senior: "24-38 LPA" },
        growthVal: 8.8, demandVal: 8.7, diffVal: 8.5, curveVal: 8, outlook: "Critical infrastructure demands are scaling rapidly due to cloud adoption."
    },
    "DevOps Engineer": {
        skills: ["Cloud Computing", "DevOps", "Git", "Docker", "Kubernetes", "AWS"],
        growth: "Very High", demand: "94%", difficulty: "High", salary: { fresher: "6-9 LPA", mid: "13-20 LPA", senior: "26-42 LPA" },
        growthVal: 9.4, demandVal: 9.4, diffVal: 8, curveVal: 8.5, outlook: "Automating cloud pipelines. High preference for Kubernetes and GitOps practitioners."
    },
    "Cloud Engineer": {
        skills: ["Cloud Computing", "AWS", "Git", "Docker", "Kubernetes"],
        growth: "High", demand: "86%", difficulty: "Medium", salary: { fresher: "5.5-8 LPA", mid: "12-17 LPA", senior: "24-38 LPA" },
        growthVal: 8.6, demandVal: 8.6, diffVal: 7, curveVal: 7.5, outlook: "Every corporate business shifting from local servers to AWS/Azure/GCP."
    },
    "Product Manager": {
        skills: ["UI/UX Design", "Management", "Analytics", "Public Speaking"],
        growth: "High", demand: "78%", difficulty: "Medium", salary: { fresher: "7-11 LPA", mid: "16-24 LPA", senior: "32-50 LPA" },
        growthVal: 8.2, demandVal: 7.8, diffVal: 7.5, curveVal: 7, outlook: "Coordination roles blending engineering knowledge, UX trends, and financial roadmaps."
    },
    "UI/UX Designer": {
        skills: ["UI/UX Design", "Designing", "React", "Frontend Developer"],
        growth: "High", demand: "82%", difficulty: "Low", salary: { fresher: "4-6.5 LPA", mid: "9.5-15 LPA", senior: "19-30 LPA" },
        growthVal: 8, demandVal: 8.2, diffVal: 5, curveVal: 6, outlook: "Increasing focus on user psychology, interactive prototypes, and accessible layouts."
    },
    "Entrepreneur": {
        skills: ["Management", "Public Speaking", "Designing", "Problem Solving", "Entrepreneurship"],
        growth: "Variable", demand: "N/A", difficulty: "Extremely High", salary: { fresher: "Equity/Funding", mid: "Varies", senior: "High Upside" },
        growthVal: 7.5, demandVal: 6, diffVal: 9.5, curveVal: 9.5, outlook: "Driven by venture interest, incubation programs, and global digital markets."
    }
};

// DSA Prep Questions
const DSA_QUESTIONS = [
    { topic: "Arrays", title: "Two Sum", difficulty: "Easy", path: "Use a Hash Map to find matches in O(N) time.", complexity: "Time: O(N), Space: O(N)" },
    { topic: "Arrays", title: "Maximum Subarray (Kadane's)", difficulty: "Medium", path: "Keep a local running sum and capture global max as you iterate.", complexity: "Time: O(N), Space: O(1)" },
    { topic: "Strings", title: "Valid Palindrome", difficulty: "Easy", path: "Use two pointers moving from ends towards the middle.", complexity: "Time: O(N), Space: O(1)" },
    { topic: "Strings", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", path: "Use a sliding window with a Set to track characters.", complexity: "Time: O(N), Space: O(min(M, N))" },
    { topic: "Linked Lists", title: "Reverse a Linked List", difficulty: "Easy", path: "Iteratively update current node next pointers using prev and temp.", complexity: "Time: O(N), Space: O(1)" },
    { topic: "Linked Lists", title: "Merge Two Sorted Lists", difficulty: "Easy", path: "Use a dummy head node and iteratively append smaller elements.", complexity: "Time: O(N + M), Space: O(1)" },
    { topic: "Trees", title: "Invert Binary Tree", difficulty: "Easy", path: "Recursively swap left and right children for all nodes.", complexity: "Time: O(N), Space: O(H)" },
    { topic: "Trees", title: "Lowest Common Ancestor", difficulty: "Medium", path: "Traverse tree recursively, checking values against target nodes.", complexity: "Time: O(N), Space: O(H)" },
    { topic: "Graphs", title: "Clone Graph", difficulty: "Medium", path: "Use BFS/DFS with a hash map mapping old nodes to new nodes.", complexity: "Time: O(V + E), Space: O(V)" },
    { topic: "Dynamic Programming", title: "Climbing Stairs", difficulty: "Easy", path: "Recognize that ways(n) = ways(n-1) + ways(n-2), similar to Fibonacci.", complexity: "Time: O(N), Space: O(1)" }
];

// Standard Mock Recruiter Interview Q&A Pool
const INTERVIEW_QA_POOL = {
    "Technical": [
        { q: "What is the virtual DOM in React and how does it work?", a: "React constructs an in-memory database cache of the actual page components. When props or state change, a diffing algorithm calculates changes and updates only the necessary DOM parts.", diff: "Medium" },
        { q: "Explain the difference between SQL and NoSQL databases.", a: "SQL systems are relational, schema-enforced, and scale vertically (great for transactional operations). NoSQL databases are document or key-value based, schema-less, and scale horizontally.", diff: "Easy" }
    ],
    "HR": [
        { q: "Where do you see yourself in 5 years?", a: "Explain how you intend to master your technical domain (like frontend or AI), transition into senior development/architecture roles, and contribute to scaling system performance.", diff: "Easy" },
        { q: "Why should we hire you over other candidates?", a: "Focus on your unique combination of academic foundations, practical project builds, and soft skills like active listening and structural troubleshooting.", diff: "Easy" }
    ],
    "Behavioral": [
        { q: "Tell me about a time you resolved a conflict within a group project.", a: "Use the STAR method: Situation (project goal), Task (conflict detail), Action (facilitating communication, looking at objective facts), Result (delivering on time).", diff: "Medium" }
    ],
    "Situational": [
        { q: "What would you do if a production system goes down but the lead architect is unavailable?", a: "Isolate the issue, check error logs, rollback recent deployments if applicable, notify key stakeholders of progress, and document the root cause.", diff: "Hard" }
    ],
    "Scenario-Based": [
        { q: "If you are asked to design a notification service that scales to 10M users, how would you start?", a: "Introduce a message broker (RabbitMQ/Kafka) to buffer events asynchronously, distribute worker nodes to process triggers, and use memory caches for profile settings.", diff: "Hard" }
    ]
};

// ================= CORE APP CONTROLLERS =================

function initApp() {
    setupTheme();
    setupModals();
    setupNavigation();
    setupForms();
    setupProductivity();
    setupMockInterview();
    setupResumeAnalyzer();
    setupResumeBuilder();
    setupDSA();
    setupCharts();
    setupAICoach();

    // Setup Typewriter Effect on Landing
    typeHeadline();

    // Set counter animation triggers
    initLandingCounters();

    // Check if assessment cached
    if (state.assessment) {
        loadAssessmentFromState();
    }
}

// Typing Effect for Landing Hero
function typeHeadline() {
    const textEl = document.getElementById('typed-headline');
    const words = ["AI Career Guidance.", "Personalized Roadmaps.", "Interview Preparation.", "Resume Insights."];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentWord = words[wordIndex];
        if (isDeleting) {
            textEl.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            textEl.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 50 : 100;
        if (!isDeleting && charIndex === currentWord.length) {
            typeSpeed = 1500; // wait at end of word
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }
    type();
}

// Counters animation on landing page
function initLandingCounters() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-val'));
                let current = 0;
                const increment = Math.ceil(target / 50);
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        el.textContent = target + "+";
                        clearInterval(timer);
                    } else {
                        el.textContent = current + "+";
                    }
                }, 30);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
}

// Theme system
function setupTheme() {
    const applyTheme = (themeName) => {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('careermentor_theme', themeName);
        state.theme = themeName;
        
        // update icons
        const iconClass = themeName === 'dark' ? 'fa-moon' : 'fa-sun';
        document.querySelectorAll('.theme-toggle i').forEach(icon => {
            icon.className = `fa-solid ${iconClass}`;
        });
    };

    // load default
    applyTheme(state.theme);

    document.getElementById('landing-theme-toggle').addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
        showToast("Theme switched successfully!", "info");
    });
    document.getElementById('dashboard-theme-toggle').addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
        showToast("Theme switched successfully!", "info");
    });
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-circle-exclamation';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Settings modal handles API config
function setupModals() {
    const modal = document.getElementById('settings-modal');
    const openLanding = document.getElementById('landing-settings-toggle');
    const openDash = document.getElementById('dashboard-settings-toggle');
    const closeBtn = document.getElementById('btn-modal-close');
    const saveBtn = document.getElementById('btn-api-save');
    const testBtn = document.getElementById('btn-api-test');
    
    const keyInput = document.getElementById('settings-api-key');
    const mockCheck = document.getElementById('settings-mock-mode');

    // Load saved settings
    keyInput.value = state.apiKey;
    mockCheck.checked = state.mockMode;

    const toggleModal = (show) => {
        modal.classList.toggle('active', show);
    };

    openLanding.addEventListener('click', () => toggleModal(true));
    openDash.addEventListener('click', () => toggleModal(true));
    closeBtn.addEventListener('click', () => toggleModal(false));
    
    saveBtn.addEventListener('click', () => {
        state.apiKey = keyInput.value.trim();
        state.mockMode = mockCheck.checked;
        localStorage.setItem('groq_api_key', state.apiKey);
        localStorage.setItem('settings-mock-mode', state.mockMode);
        
        showToast("Configuration saved successfully!", "success");
        toggleModal(false);
    });

    testBtn.addEventListener('click', async () => {
        const testKey = keyInput.value.trim();
        if (!testKey) {
            showToast("Please enter an API Key first", "warning");
            return;
        }
        testBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting...`;
        testBtn.disabled = true;

        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${testKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gemma2-9b-it',
                    messages: [{ role: 'user', content: 'Ping' }],
                    max_tokens: 5
                })
            });
            if (res.ok) {
                showToast("Connection Successful! Groq API is ready.", "success");
            } else {
                throw new Error("Invalid Response status code");
            }
        } catch (e) {
            showToast("Connection failed. Check API key and network connection.", "error");
        } finally {
            testBtn.innerHTML = `<i class="fa-solid fa-plug"></i> Test Connection`;
            testBtn.disabled = false;
        }
    });
}

// Navigation / View Switching
function setupNavigation() {
    const landing = document.getElementById('landing-page');
    const dashboard = document.getElementById('dashboard-page');
    
    const enterBtn = document.getElementById('btn-enter-dashboard');
    const leaveBtn = document.getElementById('btn-leave-dashboard');
    
    const heroStart = document.getElementById('hero-start-assessment');
    const heroExplore = document.getElementById('hero-explore-features');

    const switchView = (viewName) => {
        // Toggle view container
        document.querySelectorAll('.dashboard-module').forEach(mod => {
            mod.classList.remove('active');
        });
        
        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.add('active');
            state.activeView = viewName;
            
            // Highlight sidebar item
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-view') === viewName) {
                    item.classList.add('active');
                }
            });

            // Update View Headers
            updateViewHeaderTitles(viewName);

            // Trigger specific module loads/updates
            if (viewName === 'comparison') updateComparisonCharts();
            if (viewName === 'salary') updateSalaryInsights();
            if (viewName === 'trends') renderTrendsModule();
            if (viewName === 'certifications') renderCertsModule();
        }

        // Close sidebar on mobile
        document.querySelector('.sidebar').classList.remove('active');
    };

    // Go to Dashboard
    const loadDashboard = (targetView = 'dashboard-home') => {
        landing.style.display = 'none';
        dashboard.style.display = 'flex';
        dashboard.classList.add('active');
        switchView(targetView);
    };

    // Go back to Landing
    const loadLanding = () => {
        dashboard.style.display = 'none';
        dashboard.classList.remove('active');
        landing.style.display = 'flex';
    };

    enterBtn.addEventListener('click', () => loadDashboard('dashboard-home'));
    leaveBtn.addEventListener('click', loadLanding);
    heroStart.addEventListener('click', () => loadDashboard('assessment'));
    heroExplore.addEventListener('click', () => {
        document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' });
    });

    // Handle Quick Links on Dashboard Overview
    document.querySelectorAll('[data-go-to]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.getAttribute('data-go-to'));
        });
    });

    // Handle sidebar selections
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(item.getAttribute('data-view'));
        });
    });

    // Mobile sidebar toggle handlers
    document.getElementById('sidebar-open-btn').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.add('active');
    });
    document.getElementById('sidebar-close-btn').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.remove('active');
    });

    // Add Landing Feature Card Redirects
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const targetMod = card.getAttribute('data-module');
            loadDashboard(targetMod);
        });
    });

    // Global listener to export PDF report
    document.getElementById('btn-generate-report').addEventListener('click', exportCareerReportPDF);
}

function updateViewHeaderTitles(viewName) {
    const titleEl = document.getElementById('current-view-title');
    const descEl = document.getElementById('current-view-desc');
    
    const descriptions = {
        'dashboard-home': { title: "Overview Dashboard", desc: "Monitor your professional advancement and explore options." },
        'assessment': { title: "Career Assessment", desc: "Build your academic profile, select skills, and outline objectives." },
        'recommendations': { title: "Career Recommendations", desc: "AI-suggested professional roles fitted to your potential." },
        'skill-gap': { title: "Skill Gap Analysis", desc: "Circular benchmarks comparing your competence against industry standards." },
        'roadmap': { title: "Learning Roadmap", desc: "Interactive timelines categorized by skill phase goals." },
        'projects': { title: "Project Suggestions", desc: "Practical building concepts from beginner to advanced tiers." },
        'resume-analyzer': { title: "Resume Analyzer", desc: "Examine structure, grammar, and scan for optimal ATS keyword matching." },
        'resume-builder': { title: "Resume Builder", desc: "Assemble, edit, preview, and download standard print-ready resumes." },
        'interview-prep': { title: "Interview Prep Hub", desc: "Study technical, HR, scenario, and behavioral question sets." },
        'mock-interview': { title: "Mock Recruiter Simulation", desc: "Simulate interviews with text inputs, evaluation metrics, and score insights." },
        'dsa-prep': { title: "DSA Prep Center", desc: "Review structural algorithms, logic explanations, and complexities." },
        'comparison': { title: "Career Comparison", desc: "Chart.js representations comparing career pathways side-by-side." },
        'salary': { title: "Salary Insights", desc: "Global and local payment trends and target hiring benchmarks." },
        'trends': { title: "Industry Trends", desc: "Upcoming technologies, emerging job scales, and reports." },
        'certifications': { title: "Certification Recommender", desc: "Targeted professional credentials to scale your profile value." },
        'productivity': { title: "Productivity Center", desc: "Create focus schedules, todo lists, and plan exam deadlines." },
        'coach-chat': { title: "AI Career Coach", desc: "24/7 counseling, learning checklists, and resume tips." }
    };

    if (descriptions[viewName]) {
        titleEl.textContent = descriptions[viewName].title;
        descEl.textContent = descriptions[viewName].desc;
    }
}

// Chips management & Assessment inputs
function setupForms() {
    const skillsContainer = document.getElementById('as-skills-chips');
    const interestsContainer = document.getElementById('as-interests-chips');

    // Build skills chips
    SKILLS_LIST.forEach(skill => {
        const chip = document.createElement('div');
        chip.className = 'chip-select';
        chip.textContent = skill;
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            if (chip.classList.contains('active')) {
                state.selectedSkills.add(skill);
            } else {
                state.selectedSkills.delete(skill);
            }
        });
        skillsContainer.appendChild(chip);
    });

    // Build interests chips
    INTERESTS_LIST.forEach(interest => {
        const chip = document.createElement('div');
        chip.className = 'chip-select';
        chip.textContent = interest;
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            if (chip.classList.contains('active')) {
                state.selectedInterests.add(interest);
            } else {
                state.selectedInterests.delete(interest);
            }
        });
        interestsContainer.appendChild(chip);
    });

    // Form submission
    const form = document.getElementById('assessment-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Lock button with spinner
        const submitBtn = document.getElementById('btn-submit-assessment');
        const prevContent = submitBtn.innerHTML;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating analysis...`;
        submitBtn.disabled = true;

        try {
            // Read form values
            const data = {
                name: document.getElementById('as-name').value,
                age: document.getElementById('as-age').value,
                education: document.getElementById('as-education').value,
                college: document.getElementById('as-college').value,
                branch: document.getElementById('as-branch').value,
                gradYear: document.getElementById('as-gradyear').value,
                cgpa: document.getElementById('as-cgpa').value,
                favSubjects: document.getElementById('as-fav-subjects').value,
                strongSubjects: document.getElementById('as-strong-subjects').value,
                weakSubjects: document.getElementById('as-weak-subjects').value,
                skills: Array.from(state.selectedSkills),
                interests: Array.from(state.selectedInterests),
                goal: document.getElementById('as-goal').value
            };

            // Save basic form
            state.assessment = data;
            localStorage.setItem('user_assessment_data', JSON.stringify(data));

            // Run AI analysis
            await runAssessmentAnalysis(data);

            // Prefill Resume builder fields with matching inputs
            prefillResumeBuilderFields(data);

            showToast("AI Career Analysis Generated!", "success");
            
            // Redirect to overview
            document.querySelector('[data-view="dashboard-home"]').click();

        } catch (err) {
            console.error(err);
            showToast("Failed to compile analysis: " + err.message, "error");
        } finally {
            submitBtn.innerHTML = prevContent;
            submitBtn.disabled = false;
        }
    });
}

function loadAssessmentFromState() {
    const data = state.assessment;
    // Set text fields
    document.getElementById('as-name').value = data.name || '';
    document.getElementById('as-age').value = data.age || '';
    document.getElementById('as-education').value = data.education || 'B.Tech';
    document.getElementById('as-college').value = data.college || '';
    document.getElementById('as-branch').value = data.branch || '';
    document.getElementById('as-gradyear').value = data.gradYear || '';
    document.getElementById('as-cgpa').value = data.cgpa || '';
    document.getElementById('as-fav-subjects').value = data.favSubjects || '';
    document.getElementById('as-strong-subjects').value = data.strongSubjects || '';
    document.getElementById('as-weak-subjects').value = data.weakSubjects || '';
    document.getElementById('as-goal').value = data.goal || 'Full Stack Developer';

    // Set skills chips
    state.selectedSkills = new Set(data.skills || []);
    document.querySelectorAll('#as-skills-chips .chip-select').forEach(chip => {
        chip.classList.toggle('active', state.selectedSkills.has(chip.textContent));
    });

    // Set interests chips
    state.selectedInterests = new Set(data.interests || []);
    document.querySelectorAll('#as-interests-chips .chip-select').forEach(chip => {
        chip.classList.toggle('active', state.selectedInterests.has(chip.textContent));
    });

    // Load results if present
    if (state.results) {
        populateAnalysisModules(state.results);
    }
}

// Prefill resume builder
function prefillResumeBuilderFields(asData) {
    document.getElementById('rb-edu-degree').value = `${asData.education || 'B.Tech'} in ${asData.branch || 'CSE'}`;
    document.getElementById('rb-edu-college').value = asData.college || 'NIT';
    document.getElementById('rb-edu-gpa').value = `${asData.cgpa || '8.5'} CGPA`;
    document.getElementById('rb-edu-timeline').value = `${new Date().getFullYear() - 2} - ${asData.gradYear || (new Date().getFullYear() + 2)}`;
    
    // Add objective
    document.getElementById('rb-profile-desc').value = `Motivated student studying ${asData.branch} at ${asData.college}. Aiming to apply skills in ${asData.skills.slice(0, 3).join(', ')} to secure a position as a ${asData.goal}.`;

    // Trigger preview update
    updateResumePreview();
}

// AI Engine Controller
async function runAssessmentAnalysis(data) {
    if (state.mockMode || !state.apiKey) {
        // Run mock analysis builder
        const simulated = generateMockAnalysis(data);
        state.results = simulated;
        localStorage.setItem('user_assessment_results', JSON.stringify(simulated));
        populateAnalysisModules(simulated);
        return;
    }

    try {
        const systemPrompt = `You are a premium career development platform backend. Generate output in structural JSON format ONLY. Validate that the JSON structure fits the requested parameters exactly without surrounding markdown text.`;
        const userPrompt = `
        Analyze the following academic profile and generate full career insights:
        Profile:
        Name: ${data.name}
        Degree: ${data.education} (${data.branch})
        CGPA: ${data.cgpa}
        Strong Subjects: ${data.strongSubjects}
        Weak Subjects: ${data.weakSubjects}
        Familiar Skills: ${data.skills.join(', ')}
        Interests: ${data.interests.join(', ')}
        Target Career: ${data.goal}

        You must output JSON matching this schema:
        {
          "readinessScore": 75,
          "recommendations": [
             {
               "role": "Role Name",
               "matchScore": 95,
               "suitability": "Reason why it fits",
               "growth": "High",
               "demand": "90%",
               "difficulty": "Medium",
               "skillsRequired": ["React", "CSS"],
               "timeline": "6 Months",
               "salary": { "fresher": "6 LPA", "mid": "15 LPA", "senior": "30 LPA" },
               "outlook": "Bright"
             }
          ],
          "skillGap": {
             "highPriority": ["Missing core skill 1"],
             "mediumPriority": ["Missing tool 1"],
             "lowPriority": ["Secondary library"]
          },
          "roadmap": {
             "beginner": { "concepts": ["Foundations"], "resources": ["Tutorial Link"], "projects": ["Simple website"] },
             "intermediate": { "frameworks": ["React"], "projects": ["Full App"] },
             "advanced": { "tools": ["Docker"], "projects": ["System Design"] },
             "placement": { "dsa": ["Graph Algos"], "questions": ["Mock Qs"], "checklist": ["Resume Review"] }
          },
          "projects": {
             "beginner": { "title": "B-Project", "stack": "HTML/CSS", "description": "Details", "impact": "Learn page elements" },
             "intermediate": { "title": "I-Project", "stack": "MERN", "description": "Details", "impact": "Learn APIs" },
             "advanced": { "title": "A-Project", "stack": "NextJS/Docker", "description": "Details", "impact": "High scalability" }
          },
          "certifications": [
             { "name": "AWS Certified Developer", "difficulty": "Medium", "benefits": "Validate Cloud infrastructure skills", "impact": "High" }
          ]
        }
        `;

        const responseObj = await callGroqAPI(systemPrompt, userPrompt);
        state.results = responseObj;
        localStorage.setItem('user_assessment_results', JSON.stringify(responseObj));
        populateAnalysisModules(responseObj);
    } catch (e) {
        console.error("Groq assessment error, falling back to mock mode: ", e);
        showToast("AI engine error. Falling back to offline mock mode.", "warning");
        const fallback = generateMockAnalysis(data);
        state.results = fallback;
        localStorage.setItem('user_assessment_results', JSON.stringify(fallback));
        populateAnalysisModules(fallback);
    }
}

// Groq API client
async function callGroqAPI(systemPrompt, userPrompt) {
    const key = state.apiKey || localStorage.getItem('groq_api_key');
    if (!key) {
        throw new Error("No API Key configured.");
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-specdec',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 3000,
            response_format: { type: "json_object" }
        })
    });

    if (!res.ok) {
        throw new Error(`API returned code ${res.status}`);
    }

    const payload = await res.json();
    return JSON.parse(payload.choices[0].message.content);
}

// Offline Dynamic Mock Generator Engine
function generateMockAnalysis(asData) {
    const goal = asData.goal || "Full Stack Developer";
    const curSkills = asData.skills || [];
    
    // Look up default data for selected target
    const targetMeta = CAREER_DB[goal] || CAREER_DB["Software Engineer"];
    const allRequired = targetMeta.skills;

    // Find missing skills
    const missing = allRequired.filter(s => !curSkills.includes(s));
    const matched = allRequired.filter(s => curSkills.includes(s));
    
    const readiness = allRequired.length > 0 
        ? Math.round((matched.length / allRequired.length) * 100) 
        : 40;

    // Determine priority gaps
    const highPriority = missing.length > 0 ? [missing[0]] : ["Advanced System Architecture"];
    const mediumPriority = missing.length > 1 ? [missing[1]] : ["Testing & Deployment pipelines"];
    const lowPriority = missing.slice(2).length > 0 ? missing.slice(2) : ["Technical Writing & Documentation"];

    // Build recommended roles list
    const recommendations = [
        {
            role: goal,
            matchScore: Math.max(readiness, 55),
            suitability: `Direct alignment with your objective profile and matching academic courses in ${asData.strongSubjects || 'Data Structures'}.`,
            growth: targetMeta.growth,
            demand: targetMeta.demand,
            difficulty: targetMeta.difficulty,
            skillsRequired: allRequired,
            timeline: "3-5 Months",
            salary: targetMeta.salary,
            outlook: targetMeta.outlook
        }
    ];

    // Add adjacent options
    const otherKeys = Object.keys(CAREER_DB).filter(k => k !== goal);
    for (let i = 0; i < 4; i++) {
        const otherGoal = otherKeys[i % otherKeys.length];
        const meta = CAREER_DB[otherGoal];
        const altMatched = meta.skills.filter(s => curSkills.includes(s));
        const altScore = Math.max(Math.round((altMatched.length / meta.skills.length) * 80), 45);
        recommendations.push({
            role: otherGoal,
            matchScore: altScore,
            suitability: `Alternative career path using your matching competencies in ${altMatched.join(', ') || 'Logic and Problem Solving'}.`,
            growth: meta.growth,
            demand: meta.demand,
            difficulty: meta.difficulty,
            skillsRequired: meta.skills,
            timeline: "6-8 Months",
            salary: meta.salary,
            outlook: meta.outlook
        });
    }

    // Build Roadmap stages
    const roadmap = {
        beginner: {
            concepts: [`Core Language Syntaxes`, `Object-Oriented Programming principles`, `Version Control tools (Git/Github)`],
            resources: [`freeCodeCamp courses`, `W3Schools Language Guides`, `MIT OpenCourseWare`],
            projects: [`Build basic CLI application`, `Simple dynamic calculator or dashboard web page`]
        },
        intermediate: {
            frameworks: [`Framework components (React, Node or Spring Boot)`, `Structured database schemas (SQL/NoSQL)`, `API structure and parameters`],
            projects: [`Multi-user notes organizer app`, `E-Commerce inventory API system`]
        },
        advanced: {
            tools: [`Container engines (Docker/Kubernetes)`, `Unit Testing & CI/CD Pipelines`, `System design caching (Redis)`],
            projects: [`Distributed instant chat app with WebSockets`, `Automated server metrics monitor`]
        },
        placement: {
            dsa: [`Arrays & Hashing matrices`, `Two-pointer algorithms`, `Stack and Queue executions`],
            questions: [`Two Sum`, `Reverse Linked List`, `Kadane's Subarray optimization`],
            checklist: [`Build a clean single page portfolio`, `Rehearse standard behavioral HR interview formats`]
        }
    };

    // Build custom projects
    const projects = {
        beginner: {
            title: `Interactive ${goal} Task Dashboard`,
            stack: curSkills.length > 0 ? `${curSkills[0]} / CSS3` : "Vanilla JS / CSS",
            description: `A user-centric scheduling workspace with dynamic charts, local storage data mapping, and custom widgets.`,
            impact: `Demonstrates basic asynchronous updates, DOM handling, and modular script patterns.`
        },
        intermediate: {
            title: `Collaborative Portfolio Workspace`,
            stack: curSkills.length > 1 ? `${curSkills[0]} / ${curSkills[1]} / SQLite` : "Node / Express / MongoDB",
            description: `A shared client-server board enabling remote chat updates, file uploads, and session tokens.`,
            impact: `Validates client-server endpoints, database structures, and authorization middlewares.`
        },
        advanced: {
            title: `Microservices ${goal} API Controller`,
            stack: "Docker / Redis / Kubernetes / PostgreSQL",
            description: `A highly scalable analytics dashboard querying multiple database channels, using load balancers and caching.`,
            impact: `Showcases knowledge of container systems, server caching, scaling loads, and security headers.`
        }
    };

    // Build custom certifications
    const certifications = [
        { name: `AWS Certified Solutions Architect`, difficulty: "Hard", benefits: "Validates ability to design secure, robust and scalable systems on AWS", impact: "High" },
        { name: `Google Professional Cloud Developer`, difficulty: "Medium", benefits: "Confirms skills in designing, building, and managing cloud apps", impact: "Medium" }
    ];

    return {
        readinessScore: readiness,
        recommendations,
        skillGap: { highPriority, mediumPriority, lowPriority },
        roadmap,
        projects,
        certifications
    };
}

// Populate dashboards using parsed assessment output
function populateAnalysisModules(res) {
    // 1. Update Overview Profile Dashboard Card
    document.getElementById('overview-user-name').textContent = state.assessment ? state.assessment.name : "Guest Explorer";
    document.getElementById('overview-branch').textContent = state.assessment ? state.assessment.branch : "Not Set";
    document.getElementById('overview-goal').textContent = state.assessment ? state.assessment.goal : "Not Set";
    document.getElementById('overview-readiness').textContent = `${res.readinessScore || 0}%`;

    // 2. Populate Career Recommendation Cards
    const recsWrapper = document.getElementById('recommendations-container');
    recsWrapper.innerHTML = ''; // clear loading state
    
    res.recommendations.forEach((rec, idx) => {
        const card = document.createElement('div');
        card.className = 'career-rec-card glass-panel';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', `${idx * 100}`);
        
        card.innerHTML = `
            <div class="career-rec-header">
                <div class="career-rec-title">
                    <h3>${rec.role}</h3>
                    <div class="career-meta-tags">
                        <span class="tag-badge growth"><i class="fa-solid fa-chart-line"></i> ${rec.growth} Growth</span>
                        <span class="tag-badge demand"><i class="fa-solid fa-bolt"></i> ${rec.demand} Demand</span>
                        <span class="tag-badge difficulty"><i class="fa-solid fa-brain"></i> ${rec.difficulty} Difficulty</span>
                    </div>
                </div>
                <div class="match-score-badge">
                    ${rec.matchScore}%
                    <span>Match</span>
                </div>
            </div>
            <div class="rec-details-grid">
                <div class="detail-item">
                    <h4>Suitability Analysis</h4>
                    <p>${rec.suitability}</p>
                </div>
                <div class="detail-item">
                    <h4>Core Stack Required</h4>
                    <p>${rec.skillsRequired ? rec.skillsRequired.join(', ') : 'Not Specified'}</p>
                </div>
                <div class="detail-item">
                    <h4>Growth Outlook</h4>
                    <p>${rec.outlook || 'Stable market growth expected'}</p>
                </div>
            </div>
            <div class="salary-outlook">
                <div class="salary-box">
                    <span class="title">Fresher Average</span>
                    <span class="value">${rec.salary?.fresher || '5-7 LPA'}</span>
                </div>
                <div class="salary-box">
                    <span class="title">Mid-Level Average</span>
                    <span class="value">${rec.salary?.mid || '12-16 LPA'}</span>
                </div>
                <div class="salary-box">
                    <span class="title">Senior Average</span>
                    <span class="value">${rec.salary?.senior || '22-30 LPA'}</span>
                </div>
            </div>
        `;
        recsWrapper.appendChild(card);
    });

    // 3. Populate Skill Gap Analysis
    const gapWrapper = document.getElementById('skill-gap-container');
    gapWrapper.innerHTML = `
        <div class="glass-panel readiness-gauge">
            <h3>Placement Readiness</h3>
            <div class="circular-progress-wrap" style="margin-top:1.5rem;">
                <svg class="circular-progress-svg" width="180" height="180">
                    <circle class="circular-progress-bg" cx="90" cy="90" r="80" />
                    <circle class="circular-progress-bar" id="gap-readiness-bar" cx="90" cy="90" r="80" />
                </svg>
                <div class="circular-progress-text" id="gap-readiness-val">0%</div>
            </div>
            <p style="color:var(--text-secondary); font-size:0.85rem;">Score based on matching your current skills to target profiles</p>
        </div>
        <div class="gap-categories">
            <div class="glass-panel gap-priority-box">
                <div class="gap-priority-header high"><i class="fa-solid fa-triangle-exclamation"></i> High Priority Missing Skills</div>
                <div class="gap-skills-list" id="gap-skills-high"></div>
            </div>
            <div class="glass-panel gap-priority-box">
                <div class="gap-priority-header medium"><i class="fa-solid fa-circle-exclamation"></i> Medium Priority Targets</div>
                <div class="gap-skills-list" id="gap-skills-med"></div>
            </div>
            <div class="glass-panel gap-priority-box">
                <div class="gap-priority-header low"><i class="fa-solid fa-circle-check"></i> Secondary Frameworks / Tools</div>
                <div class="gap-skills-list" id="gap-skills-low"></div>
            </div>
        </div>
    `;

    // Populate gap badges
    const highContainer = document.getElementById('gap-skills-high');
    const medContainer = document.getElementById('gap-skills-med');
    const lowContainer = document.getElementById('gap-skills-low');

    const gap = res.skillGap || { highPriority: [], mediumPriority: [], lowPriority: [] };
    
    if (gap.highPriority.length === 0) highContainer.innerHTML = `<span class="gap-skill-item low">All key foundations matched!</span>`;
    else gap.highPriority.forEach(sk => highContainer.innerHTML += `<span class="gap-skill-item high">${sk}</span>`);

    if (gap.mediumPriority.length === 0) medContainer.innerHTML = `<span class="gap-skill-item low">No priority frameworks missing</span>`;
    else gap.mediumPriority.forEach(sk => medContainer.innerHTML += `<span class="gap-skill-item medium">${sk}</span>`);

    if (gap.lowPriority.length === 0) lowContainer.innerHTML = `<span class="gap-skill-item low">No accessory tools missing</span>`;
    else gap.lowPriority.forEach(sk => lowContainer.innerHTML += `<span class="gap-skill-item low">${sk}</span>`);

    // Set SVG progress ring stroke offset
    setTimeout(() => {
        const bar = document.getElementById('gap-readiness-bar');
        const valText = document.getElementById('gap-readiness-val');
        if (bar && valText) {
            const score = res.readinessScore || 0;
            const radius = 80;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            bar.style.strokeDashoffset = offset;
            valText.textContent = `${score}%`;
        }
    }, 100);

    // 4. Populate Personalized Learning Roadmap (Timeline)
    const mapWrapper = document.getElementById('roadmap-container');
    mapWrapper.innerHTML = '';
    
    const timeline = document.createElement('div');
    timeline.className = 'roadmap-timeline';
    
    const phases = [
        { key: 'beginner', title: 'Phase 1: Beginner Foundations', icon: 'fa-baby-carriage', side: 'left' },
        { key: 'intermediate', title: 'Phase 2: Intermediate Frameworks', icon: 'fa-layer-group', side: 'right' },
        { key: 'advanced', title: 'Phase 3: Advanced Cloud & Design', icon: 'fa-shield-halved', side: 'left' },
        { key: 'placement', title: 'Phase 4: Placement Prep & DSA', icon: 'fa-paper-plane', side: 'right' }
    ];

    phases.forEach(phase => {
        const step = document.createElement('div');
        step.className = `roadmap-step ${phase.side}`;
        
        const phaseData = res.roadmap?.[phase.key] || { concepts: [], resources: [], projects: [] };
        
        let itemsHtml = '';
        if (phaseData.concepts) phaseData.concepts.forEach(c => itemsHtml += `<div><i class="fa-solid fa-circle-notch"></i><span>Concept: ${c}</span></div>`);
        if (phaseData.frameworks) phaseData.frameworks.forEach(c => itemsHtml += `<div><i class="fa-solid fa-circle-notch"></i><span>Framework: ${c}</span></div>`);
        if (phaseData.tools) phaseData.tools.forEach(c => itemsHtml += `<div><i class="fa-solid fa-circle-notch"></i><span>Tool: ${c}</span></div>`);
        if (phaseData.resources) phaseData.resources.forEach(c => itemsHtml += `<div><i class="fa-solid fa-link"></i><span>Resource: ${c}</span></div>`);
        if (phaseData.projects) phaseData.projects.forEach(c => itemsHtml += `<div><i class="fa-solid fa-lightbulb"></i><span>Project: ${c}</span></div>`);
        if (phaseData.dsa) phaseData.dsa.forEach(c => itemsHtml += `<div><i class="fa-solid fa-code"></i><span>DSA: ${c}</span></div>`);
        
        step.innerHTML = `
            <div class="roadmap-content glass-panel">
                <h4 class="roadmap-phase-title"><i class="fa-solid ${phase.icon}"></i> ${phase.title}</h4>
                <div class="roadmap-items-list">${itemsHtml}</div>
            </div>
        `;
        timeline.appendChild(step);
    });
    mapWrapper.appendChild(timeline);

    // 5. Populate Project Recommendations
    const projWrapper = document.getElementById('projects-container');
    projWrapper.innerHTML = '';
    
    const levels = [
        { key: 'beginner', title: 'Beginner Projects', icon: 'fa-seedling' },
        { key: 'intermediate', title: 'Intermediate Projects', icon: 'fa-tree' },
        { key: 'advanced', title: 'Advanced Projects', icon: 'fa-mountain' }
    ];

    levels.forEach(lvl => {
        const proj = res.projects?.[lvl.key] || { title: 'Project Title', stack: 'HTML', description: 'Brief', impact: 'Impact Details' };
        
        const card = document.createElement('div');
        card.className = 'feature-card glass-panel';
        card.innerHTML = `
            <div class="feature-icon"><i class="fa-solid ${lvl.icon}"></i></div>
            <h3 style="font-size:1.15rem; color:var(--accent);">${lvl.title}</h3>
            <h4>${proj.title}</h4>
            <p style="margin: 0.5rem 0;">${proj.description}</p>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">
                <strong>Stack:</strong> ${proj.stack}
            </div>
            <div style="font-size:0.8rem; background:rgba(255,255,255,0.02); border:1px solid var(--card-border); padding:8px; border-radius:6px;">
                <strong>Portfolio Impact:</strong> ${proj.impact}
            </div>
        `;
        projWrapper.appendChild(card);
    });
}

// Resume Analyzer
function setupResumeAnalyzer() {
    const btn = document.getElementById('btn-analyze-resume');
    const input = document.getElementById('resume-text-input');
    const progressRing = document.getElementById('resume-ats-progress');
    const scoreVal = document.getElementById('resume-ats-score');
    const gradeVal = document.getElementById('resume-ats-grade');
    const resultsContainer = document.getElementById('resume-analysis-results');

    btn.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) {
            showToast("Please paste your resume text first.", "warning");
            return;
        }

        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...`;
        btn.disabled = true;

        try {
            let analysisResult;
            if (state.mockMode || !state.apiKey) {
                // Mock analyzer response
                analysisResult = simulateResumeAnalysis(text);
            } else {
                const systemPrompt = `You are a professional ATS resume scanner. Output JSON format ONLY. Make the evaluation highly thorough and realistic.`;
                const userPrompt = `
                Examine this resume text and calculate metrics:
                Resume Text:
                ${text}

                Goal: ${state.assessment?.goal || "Software Engineer"}

                Output JSON schema:
                {
                  "score": 78,
                  "strength": "Overall Profile Strength details",
                  "missingKeywords": ["Keywords matching goal"],
                  "missingSkills": ["Skills needed"],
                  "grammarSuggestions": ["Grammar tips"],
                  "formattingSuggestions": ["Formatting tips"],
                  "projectSuggestions": ["Specific project ideas"],
                  "improvementPlan": ["Step 1", "Step 2"]
                }
                `;
                analysisResult = await callGroqAPI(systemPrompt, userPrompt);
            }

            // Update Circle Ring Progress
            const score = analysisResult.score || 60;
            const radius = 80;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
            scoreVal.textContent = `${score}%`;
            
            let grade = "Needs Significant Updates";
            if (score >= 85) grade = "Excellent ATS Alignment!";
            else if (score >= 70) grade = "Good Base. Minor fixes suggested.";
            gradeVal.textContent = grade;

            // Update Report Container
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `
                <h3 style="margin-bottom:1.5rem; color:var(--accent);"><i class="fa-solid fa-clipboard-check"></i> Analysis Feedback</h3>
                <div class="rec-details-grid">
                    <div class="detail-item">
                        <h4>Profile Strength</h4>
                        <p>${analysisResult.strength || 'Good basic profile. Needs stronger outcome-based metrics.'}</p>
                    </div>
                    <div class="detail-item">
                        <h4>Missing ATS Keywords</h4>
                        <p>${analysisResult.missingKeywords?.join(', ') || 'None identified.'}</p>
                    </div>
                </div>
                <div style="margin-top:1.5rem; display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                    <div>
                        <h4 style="color:var(--danger); margin-bottom:8px;"><i class="fa-solid fa-spell-check"></i> Grammar & Language</h4>
                        <ul style="padding-left:1.2rem; font-size:0.85rem;">
                            ${analysisResult.grammarSuggestions?.map(s => `<li>${s}</li>`).join('') || '<li>No typos detected.</li>'}
                        </ul>
                    </div>
                    <div>
                        <h4 style="color:var(--warning); margin-bottom:8px;"><i class="fa-solid fa-list-check"></i> Formatting suggestions</h4>
                        <ul style="padding-left:1.2rem; font-size:0.85rem;">
                            ${analysisResult.formattingSuggestions?.map(s => `<li>${s}</li>`).join('') || '<li>Format is clean.</li>'}
                        </ul>
                    </div>
                </div>
                <div style="margin-top:1.5rem;">
                    <h4 style="color:var(--success); margin-bottom:8px;"><i class="fa-solid fa-graduation-cap"></i> Improvement Roadmap Plan</h4>
                    <ol style="padding-left:1.2rem; font-size:0.85rem;">
                        ${analysisResult.improvementPlan?.map(s => `<li>${s}</li>`).join('') || '<li>Update resume formatting.</li>'}
                    </ol>
                </div>
            `;
            
            showToast("Resume Analysis Complete!", "success");

        } catch (e) {
            console.error(e);
            showToast("Analysis failed: " + e.message, "error");
        } finally {
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass-chart"></i> Analyze Resume`;
            btn.disabled = false;
        }
    });
}

function simulateResumeAnalysis(text) {
    const score = Math.floor(Math.random() * 25) + 60; // 60-85
    return {
        score: score,
        strength: "The profile exhibits good education credentials and matching projects. However, it lacks quantifiable action verbs (e.g., 'Optimized query latency by 40%').",
        missingKeywords: ["Asynchronous API Design", "CI/CD Pipeline integration", "Unit Testing configurations"],
        missingSkills: ["Docker", "Redis Cache implementation", "Kubernetes clusters"],
        grammarSuggestions: [
            "Use active past tense verbs like 'orchestrated' or 'formulated' instead of 'was responsible for'.",
            "Maintain consistency in bullet ending punctuations (either all end in periods or none)."
        ],
        formattingSuggestions: [
            "Reduce paragraph descriptions to single-line bulleted logs for easier ATS reading.",
            "Limit length to a single compact page."
        ],
        projectSuggestions: ["Implement Redis cache layers onto existing SQL query endpoints."],
        improvementPlan: [
            "Quantify accomplishments with exact performance values (e.g. seconds reduced, size decreased).",
            "Embed missing ATS keywords into project details.",
            "Export only in standard PDF layouts without sidebars or columns."
        ]
    };
}

// Resume Builder
function setupResumeBuilder() {
    const preview = document.getElementById('resume-preview-target');
    const prefillBtn = document.getElementById('btn-prefill-resume');
    const downloadBtn = document.getElementById('btn-export-resume-pdf');

    // Add keyup update triggers
    const inputs = ['rb-email', 'rb-phone', 'rb-github', 'rb-linkedin', 'rb-profile-desc', 'rb-edu-degree', 'rb-edu-college', 'rb-edu-gpa', 'rb-edu-timeline', 'rb-p1-title', 'rb-p1-desc', 'rb-p2-title', 'rb-p2-desc', 'rb-certs', 'rb-achievements'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateResumePreview);
    });

    prefillBtn.addEventListener('click', () => {
        if (!state.assessment) {
            showToast("Complete assessment first to prefill profile values.", "warning");
            return;
        }
        prefillResumeBuilderFields(state.assessment);
        showToast("Form prefilled!", "success");
    });

    downloadBtn.addEventListener('click', exportResumePDF);

    // Initial render
    updateResumePreview();
}

function updateResumePreview() {
    const preview = document.getElementById('resume-preview-target');
    const name = state.assessment ? state.assessment.name : "Your Full Name";
    const email = document.getElementById('rb-email').value;
    const phone = document.getElementById('rb-phone').value;
    const github = document.getElementById('rb-github').value;
    const linkedin = document.getElementById('rb-linkedin').value;
    const profile = document.getElementById('rb-profile-desc').value;
    const degree = document.getElementById('rb-edu-degree').value;
    const college = document.getElementById('rb-edu-college').value;
    const gpa = document.getElementById('rb-edu-gpa').value;
    const timeline = document.getElementById('rb-edu-timeline').value;
    const p1Title = document.getElementById('rb-p1-title').value;
    const p1Desc = document.getElementById('rb-p1-desc').value;
    const p2Title = document.getElementById('rb-p2-title').value;
    const p2Desc = document.getElementById('rb-p2-desc').value;
    const certs = document.getElementById('rb-certs').value.split(',');
    const achievements = document.getElementById('rb-achievements').value.split(',');

    preview.innerHTML = `
        <div class="resume-preview-header">
            <h2>${name}</h2>
            <p>
                <span><i class="fa-solid fa-envelope"></i> ${email}</span>
                <span><i class="fa-solid fa-phone"></i> ${phone}</span>
                <span><i class="fa-solid fa-link"></i> ${github}</span>
                <span><i class="fa-solid fa-link"></i> ${linkedin}</span>
            </p>
        </div>

        <div class="resume-preview-section">
            <h3>Professional Summary</h3>
            <p class="resume-preview-desc">${profile}</p>
        </div>

        <div class="resume-preview-section">
            <h3>Education</h3>
            <div class="resume-preview-list-item">
                <div class="resume-preview-list-item-header">
                    <span>${degree}</span>
                    <span>${timeline}</span>
                </div>
                <div class="resume-preview-list-item-sub">
                    <span>${college}</span>
                    <span>${gpa}</span>
                </div>
            </div>
        </div>

        <div class="resume-preview-section">
            <h3>Key Projects</h3>
            <div class="resume-preview-list-item">
                <div class="resume-preview-list-item-header">
                    <span>${p1Title}</span>
                </div>
                <p class="resume-preview-desc">${p1Desc}</p>
            </div>
            <div class="resume-preview-list-item" style="margin-top:10px;">
                <div class="resume-preview-list-item-header">
                    <span>${p2Title}</span>
                </div>
                <p class="resume-preview-desc">${p2Desc}</p>
            </div>
        </div>

        <div class="resume-preview-section">
            <h3>Certifications</h3>
            <div class="resume-preview-skills-tags">
                ${certs.map(c => c.trim() ? `<span>${c.trim()}</span>` : '').join('')}
            </div>
        </div>

        <div class="resume-preview-section">
            <h3>Key Achievements</h3>
            <ul style="padding-left:1.2rem; font-size:0.85rem; color:#475569;">
                ${achievements.map(a => a.trim() ? `<li>${a.trim()}</li>` : '').join('')}
            </ul>
        </div>
    `;
}

// Download Resume PDF
function exportResumePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    
    const name = state.assessment ? state.assessment.name : "Your Full Name";
    const email = document.getElementById('rb-email').value;
    const phone = document.getElementById('rb-phone').value;
    const github = document.getElementById('rb-github').value;
    const linkedin = document.getElementById('rb-linkedin').value;
    const profile = document.getElementById('rb-profile-desc').value;
    const degree = document.getElementById('rb-edu-degree').value;
    const college = document.getElementById('rb-edu-college').value;
    const gpa = document.getElementById('rb-edu-gpa').value;
    const timeline = document.getElementById('rb-edu-timeline').value;
    const p1Title = document.getElementById('rb-p1-title').value;
    const p1Desc = document.getElementById('rb-p1-desc').value;
    const p2Title = document.getElementById('rb-p2-title').value;
    const p2Desc = document.getElementById('rb-p2-desc').value;
    const certs = document.getElementById('rb-certs').value;
    const achievements = document.getElementById('rb-achievements').value;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(name, 40, 50);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`${email}  |  ${phone}  |  ${github}  |  ${linkedin}`, 40, 70);

    // Section line
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1.5);
    doc.line(40, 80, 550, 80);

    let y = 100;
    
    // Profile
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241);
    doc.text("PROFESSIONAL SUMMARY", 40, y);
    y += 15;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const splitProfile = doc.splitTextToSize(profile, 510);
    doc.text(splitProfile, 40, y);
    y += splitProfile.length * 12 + 15;

    // Education
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241);
    doc.text("EDUCATION", 40, y);
    y += 15;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(degree, 40, y);
    doc.setFont("Helvetica", "normal");
    doc.text(timeline, 500, y, { align: 'right' });
    y += 12;
    doc.text(`${college}  -  ${gpa}`, 40, y);
    y += 25;

    // Projects
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241);
    doc.text("KEY PROJECTS", 40, y);
    y += 15;
    
    // P1
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(p1Title, 40, y);
    y += 12;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const splitP1 = doc.splitTextToSize(p1Desc, 510);
    doc.text(splitP1, 40, y);
    y += splitP1.length * 12 + 15;

    // P2
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(p2Title, 40, y);
    y += 12;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const splitP2 = doc.splitTextToSize(p2Desc, 510);
    doc.text(splitP2, 40, y);
    y += splitP2.length * 12 + 15;

    // Certifications
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241);
    doc.text("CERTIFICATIONS", 40, y);
    y += 15;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const splitCerts = doc.splitTextToSize(certs, 510);
    doc.text(splitCerts, 40, y);
    y += splitCerts.length * 12 + 15;

    // Achievements
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241);
    doc.text("ACHIEVEMENTS", 40, y);
    y += 15;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    achievements.split(',').forEach(ach => {
        if (ach.trim()) {
            doc.text(`* ${ach.trim()}`, 45, y);
            y += 12;
        }
    });

    doc.save(`${name.replace(/\s+/g, '_')}_Resume.pdf`);
    showToast("Resume exported!", "success");
}

// Interview Preparation Hub
function setupDSA() {
    const listWrap = document.getElementById('dsa-accordion');
    const filterWrap = document.getElementById('dsa-topics-chips');
    
    const topics = ["All", "Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "Dynamic Programming"];

    const renderQuestions = (filterTopic = "All") => {
        listWrap.innerHTML = '';
        const filtered = filterTopic === "All" 
            ? DSA_QUESTIONS 
            : DSA_QUESTIONS.filter(q => q.topic === filterTopic);

        filtered.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'accordion-item glass-panel';
            item.innerHTML = `
                <button class="accordion-trigger">
                    <span><strong>[${q.topic}]</strong> ${q.title} <span class="tag-badge" style="margin-left:10px;">${q.difficulty}</span></span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="accordion-content">
                    <p style="margin-bottom:8px;"><strong>Strategy & Code approach:</strong> ${q.path}</p>
                    <p><strong>Complexity analysis:</strong> <code style="font-family:'JetBrains Mono', monospace; font-size:0.8rem; background:rgba(0,0,0,0.2); padding:2px 6px; border-radius:4px;">${q.complexity}</code></p>
                </div>
            `;
            
            item.querySelector('.accordion-trigger').addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                document.querySelectorAll('#dsa-accordion .accordion-item').forEach(el => el.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            });

            listWrap.appendChild(item);
        });
    };

    // Load filter chips
    topics.forEach(t => {
        const chip = document.createElement('div');
        chip.className = `chip-select ${t === 'All' ? 'active' : ''}`;
        chip.textContent = t;
        chip.addEventListener('click', () => {
            document.querySelectorAll('#dsa-topics-chips .chip-select').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderQuestions(t);
        });
        filterWrap.appendChild(chip);
    });

    renderQuestions();
}

// Mock Recruiter Interview Simulator Module
function setupMockInterview() {
    const startBtn = document.getElementById('btn-start-mock');
    const stopBtn = document.getElementById('btn-stop-mock');
    const nextBtn = document.getElementById('btn-next-mock-question');
    const questionText = document.getElementById('mock-question-display');
    const inputArea = document.getElementById('mock-response-input');
    const timerDisplay = document.getElementById('mock-timer');
    const counterDisplay = document.getElementById('mock-question-counter');
    const reportBox = document.getElementById('mock-report-results');

    // Preset standard questions mapped by Target Domain
    const genericQuestions = [
        "Tell me about a challenging engineering project you built and how you selected the technology stack.",
        "How do you handle debugging when a memory leakage or API failure occurs in production?",
        "Explain the design trade-offs between implementing REST APIs versus GraphQL templates.",
        "Describe a situation where you had to collaborate with a difficult stakeholder or group member.",
        "Why do you wish to pursue this career path and how do you track technological shifts?"
    ];

    startBtn.addEventListener('click', () => {
        // Init Mock State
        state.mockInterview.active = true;
        state.mockInterview.timeElapsed = 0;
        state.mockInterview.currentQuestionIndex = 0;
        state.mockInterview.questions = genericQuestions;
        state.mockInterview.responses = [];
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        nextBtn.disabled = false;
        inputArea.disabled = false;
        inputArea.value = '';
        reportBox.style.display = 'none';

        // Start Waveform CSS animation
        document.querySelectorAll('.waveform-bar').forEach(bar => bar.classList.add('active'));

        // Start Timer
        state.mockInterview.timerInterval = setInterval(() => {
            state.mockInterview.timeElapsed++;
            const mins = Math.floor(state.mockInterview.timeElapsed / 60).toString().padStart(2, '0');
            const secs = (state.mockInterview.timeElapsed % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${mins}:${secs}`;
        }, 1000);

        showQuestion();
        showToast("Mock Interview Session Started!", "success");
    });

    const showQuestion = () => {
        const idx = state.mockInterview.currentQuestionIndex;
        questionText.textContent = state.mockInterview.questions[idx];
        counterDisplay.textContent = `Question ${idx + 1} of ${state.mockInterview.questions.length}`;
        inputArea.value = '';
    };

    nextBtn.addEventListener('click', () => {
        const resp = inputArea.value.trim();
        if (!resp) {
            showToast("Please enter an answer response before moving forward.", "warning");
            return;
        }

        // Save Response
        state.mockInterview.responses.push(resp);
        state.mockInterview.currentQuestionIndex++;

        if (state.mockInterview.currentQuestionIndex < state.mockInterview.questions.length) {
            showQuestion();
        } else {
            endMockSession();
        }
    });

    stopBtn.addEventListener('click', endMockSession);

    async function endMockSession() {
        clearInterval(state.mockInterview.timerInterval);
        state.mockInterview.active = false;
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        nextBtn.disabled = true;
        inputArea.disabled = true;
        
        // Stop Waveform
        document.querySelectorAll('.waveform-bar').forEach(bar => bar.classList.remove('active'));

        // Generate scoring report
        questionText.textContent = "Interview session complete! Evaluating transcript...";
        reportBox.style.display = 'block';
        reportBox.innerHTML = `
            <div class="skeleton" style="padding:1.5rem; display:flex; flex-direction:column; gap:10px;">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
        `;

        try {
            let feedback;
            if (state.mockMode || !state.apiKey) {
                // Mock analyzer evaluation
                feedback = simulateInterviewFeedback();
            } else {
                const systemPrompt = `You are a tech recruitment lead evaluating a candidate's transcript. Output JSON format ONLY. Make feedback detailed.`;
                const transcriptLogs = state.mockInterview.questions.map((q, i) => `Q: ${q}\nA: ${state.mockInterview.responses[i] || 'No Response'}`).join('\n\n');
                const userPrompt = `
                Evaluate this transcript logic:
                Target Goal: ${state.assessment?.goal || 'Software Engineer'}
                Transcript Logs:
                ${transcriptLogs}

                Output JSON schema:
                {
                  "overallScore": 82,
                  "confidenceScore": 80,
                  "communicationTips": ["Tip 1"],
                  "idealSuggestions": ["Detailed feedback on question answers"],
                  "strengths": ["Item 1"],
                  "weaknesses": ["Item 1"]
                }
                `;
                feedback = await callGroqAPI(systemPrompt, userPrompt);
            }

            // Save score
            state.mockInterview.score = feedback.overallScore;

            reportBox.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--card-border); padding-bottom:1rem; margin-bottom:1.5rem;">
                    <h3 style="color:var(--accent);"><i class="fa-solid fa-ranking-star"></i> AI Evaluation Report</h3>
                    <div style="font-size:1.5rem; font-weight:800; color:var(--success);">${feedback.overallScore}/100</div>
                </div>
                <div class="rec-details-grid">
                    <div class="detail-item">
                        <h4>Key Strengths</h4>
                        <ul style="padding-left:1.2rem; font-size:0.85rem;">
                            ${feedback.strengths?.map(s => `<li>${s}</li>`).join('') || '<li>Exhibits basic domain understanding.</li>'}
                        </ul>
                    </div>
                    <div class="detail-item">
                        <h4>Areas for Improvement</h4>
                        <ul style="padding-left:1.2rem; font-size:0.85rem;">
                            ${feedback.weaknesses?.map(w => `<li>${w}</li>`).join('') || '<li>Answers lack outcome analytics.</li>'}
                        </ul>
                    </div>
                </div>
                <div style="margin-top:1.5rem;">
                    <h4>Confidence & Communication metrics</h4>
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:10px;">Confidence Score: <strong>${feedback.confidenceScore || 75}%</strong></p>
                    <ul style="padding-left:1.2rem; font-size:0.85rem;">
                        ${feedback.communicationTips?.map(t => `<li>${t}</li>`).join('') || '<li>Pace response structures to avoid word repetitions.</li>'}
                    </ul>
                </div>
            `;
            questionText.textContent = "Evaluation complete! Review your scoring logs below.";
            showToast("Mock Interview Evaluated!", "success");

        } catch (err) {
            console.error(err);
            questionText.textContent = "Evaluation failed. View results above.";
            showToast("Mock evaluation failed: " + err.message, "error");
        }
    }
}

function simulateInterviewFeedback() {
    return {
        overallScore: Math.floor(Math.random() * 15) + 72,
        confidenceScore: Math.floor(Math.random() * 20) + 70,
        communicationTips: [
            "Structure answers using the STAR format (Situation, Task, Action, Result) to avoid trailing sentences.",
            "Incorporate technical vocabulary relevant to database parameters or container deployment systems."
        ],
        strengths: [
            "Demonstrated solid conceptual foundations regarding framework models.",
            "Excellent explanation of collaborative processes and conflict resolutions."
        ],
        weaknesses: [
            "Needs to discuss backend scaling parameters (like indices or cache nodes) in architectural questions.",
            "Avoid overly brief definitions. Elaborate on secondary constraints."
        ]
    };
}

// Q&A accordion loader
document.querySelectorAll('#interview-topics-chips .chip-select').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('#interview-topics-chips .chip-select').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        loadInterviewQA(chip.getAttribute('data-topic'));
    });
});

function loadInterviewQA(topic = "Technical") {
    const list = document.getElementById('interview-accordion');
    list.innerHTML = '';
    const pool = INTERVIEW_QA_POOL[topic] || INTERVIEW_QA_POOL["Technical"];

    pool.forEach((item, idx) => {
        const block = document.createElement('div');
        block.className = 'accordion-item glass-panel';
        block.innerHTML = `
            <button class="accordion-trigger">
                <span>Q: ${item.q} <span class="tag-badge" style="margin-left:10px;">${item.diff}</span></span>
                <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="accordion-content">
                <p style="margin-bottom:8px;"><strong>Ideal Answer Strategy:</strong> ${item.a}</p>
            </div>
        `;
        
        block.querySelector('.accordion-trigger').addEventListener('click', () => {
            const isActive = block.classList.contains('active');
            document.querySelectorAll('#interview-accordion .accordion-item').forEach(el => el.classList.remove('active'));
            if (!isActive) block.classList.add('active');
        });

        list.appendChild(block);
    });
}
loadInterviewQA("Technical"); // init

// Productivity board controls
function setupProductivity() {
    const taskInput = document.getElementById('planner-input');
    const taskAddBtn = document.getElementById('btn-planner-add');
    const taskList = document.getElementById('planner-list-container');
    const datePicker = document.getElementById('prod-date-picker');

    // Todo Planner List rendering
    const renderTasks = () => {
        taskList.innerHTML = '';
        state.todoTasks.forEach((task, idx) => {
            const li = document.createElement('li');
            li.className = `planner-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="planner-item-left">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} style="cursor:pointer;">
                    <span>${task.text}</span>
                </div>
                <i class="fa-solid fa-trash-can delete-btn" data-tooltip="Delete Task"></i>
            `;

            // Complete handler
            li.querySelector('input').addEventListener('change', () => {
                task.completed = !task.completed;
                localStorage.setItem('productivity_tasks', JSON.stringify(state.todoTasks));
                renderTasks();
            });

            // Delete handler
            li.querySelector('.delete-btn').addEventListener('click', () => {
                state.todoTasks.splice(idx, 1);
                localStorage.setItem('productivity_tasks', JSON.stringify(state.todoTasks));
                renderTasks();
                showToast("Task deleted", "info");
            });

            taskList.appendChild(li);
        });
    };

    taskAddBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (!text) return;
        state.todoTasks.push({ text, completed: false });
        localStorage.setItem('productivity_tasks', JSON.stringify(state.todoTasks));
        taskInput.value = '';
        renderTasks();
        showToast("Task added!", "success");
    });

    renderTasks();

    // Placement countdown handlers
    const savedDeadline = localStorage.getItem('placement_deadline_date');
    if (savedDeadline) {
        datePicker.value = savedDeadline;
        state.placementDeadline = savedDeadline;
        startCountdownTimer();
    }

    datePicker.addEventListener('change', () => {
        state.placementDeadline = datePicker.value;
        localStorage.setItem('placement_deadline_date', datePicker.value);
        showToast("Deadline updated", "success");
        startCountdownTimer();
    });
    
    // Focus Timer (Pomodoro)
    let pomoSeconds = 1500; // 25 min
    let pomoInterval = null;

    const pomoDisplay = document.getElementById('pomodoro-timer');
    const startPomo = document.getElementById('btn-pomo-start');
    const pausePomo = document.getElementById('btn-pomo-pause');
    const resetPomo = document.getElementById('btn-pomo-reset');

    const updatePomoDisplay = () => {
        const mins = Math.floor(pomoSeconds / 60).toString().padStart(2, '0');
        const secs = (pomoSeconds % 60).toString().padStart(2, '0');
        pomoDisplay.textContent = `${mins}:${secs}`;
    };

    startPomo.addEventListener('click', () => {
        if (pomoInterval) return;
        pomoInterval = setInterval(() => {
            pomoSeconds--;
            updatePomoDisplay();
            if (pomoSeconds <= 0) {
                clearInterval(pomoInterval);
                pomoInterval = null;
                pomoSeconds = 1500;
                playPomoSound();
                showToast("Focus Timer complete! Take a break.", "success");
            }
        }, 1000);
        showToast("Pomodoro timer started!", "info");
    });

    pausePomo.addEventListener('click', () => {
        clearInterval(pomoInterval);
        pomoInterval = null;
    });

    resetPomo.addEventListener('click', () => {
        clearInterval(pomoInterval);
        pomoInterval = null;
        pomoSeconds = 1500;
        updatePomoDisplay();
    });
}

function startCountdownTimer() {
    const updateCountdown = () => {
        if (!state.placementDeadline) return;
        const target = new Date(state.placementDeadline).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (diff <= 0) {
            document.querySelectorAll('.countdown-val').forEach(el => el.textContent = "00");
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        // Update Dashboard Display
        document.getElementById('cd-days').textContent = days.toString().padStart(2, '0');
        document.getElementById('cd-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('cd-mins').textContent = mins.toString().padStart(2, '0');

        // Update Productivity Display
        document.getElementById('prod-cd-days').textContent = days.toString().padStart(2, '0');
        document.getElementById('prod-cd-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('prod-cd-mins').textContent = mins.toString().padStart(2, '0');
    };

    updateCountdown();
    setInterval(updateCountdown, 60000); // update every minute
}

function playPomoSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.error("Audio trigger failed", e);
    }
}

// Chart.js Visualizations
let charts = { comparisonBar: null, comparisonRadar: null, salaryBar: null };

function setupCharts() {
    // Listen for select updates on Career Comparison
    document.getElementById('comp-career-1').addEventListener('change', updateComparisonCharts);
    document.getElementById('comp-career-2').addEventListener('change', updateComparisonCharts);
}

function updateComparisonCharts() {
    const c1 = document.getElementById('comp-career-1').value;
    const c2 = document.getElementById('comp-career-2').value;

    const data1 = CAREER_DB[c1] || CAREER_DB["Software Engineer"];
    const data2 = CAREER_DB[c2] || CAREER_DB["AI Engineer"];

    const barCanvas = document.getElementById('comparisonChart');
    const radarCanvas = document.getElementById('comparisonRadarChart');

    if (!barCanvas || !radarCanvas) return;

    // Helper to extract numeric values from salary strings (e.g., '6-8 LPA' -> 7)
    const getAvgSalary = (salaryStr) => {
        if (!salaryStr || typeof salaryStr !== 'string') return 0;
        const matches = salaryStr.match(/\d+(\.\d+)?/g);
        if (matches && matches.length >= 2) {
            return (parseFloat(matches[0]) + parseFloat(matches[1])) / 2;
        } else if (matches && matches.length === 1) {
            return parseFloat(matches[0]);
        }
        return 5;
    };

    const s1Fresher = getAvgSalary(data1.salary.fresher);
    const s1Mid = getAvgSalary(data1.salary.mid);
    const s1Senior = getAvgSalary(data1.salary.senior);

    const s2Fresher = getAvgSalary(data2.salary.fresher);
    const s2Mid = getAvgSalary(data2.salary.mid);
    const s2Senior = getAvgSalary(data2.salary.senior);

    // Destroy existing chart instances before rebuilding
    if (charts.comparisonBar) charts.comparisonBar.destroy();
    if (charts.comparisonRadar) charts.comparisonRadar.destroy();

    const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const borderCard = getComputedStyle(document.documentElement).getPropertyValue('--card-border').trim();

    // 1. Comparison Bar Chart
    charts.comparisonBar = new Chart(barCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Fresher Scale', 'Mid-Level Scale', 'Senior Scale'],
            datasets: [
                {
                    label: c1,
                    data: [s1Fresher, s1Mid, s1Senior],
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2
                },
                {
                    label: c2,
                    data: [s2Fresher, s2Mid, s2Senior],
                    backgroundColor: 'rgba(236, 72, 153, 0.7)',
                    borderColor: 'rgba(236, 72, 153, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: borderCard },
                    ticks: { color: textPrimary, callback: (v) => v + " LPA" }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textPrimary }
                }
            },
            plugins: {
                legend: { labels: { color: textPrimary } }
            }
        }
    });

    // 2. Comparison Radar Chart
    charts.comparisonRadar = new Chart(radarCanvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Market Growth', 'Industry Demand', 'Difficulty Curve', 'Learning Complexity'],
            datasets: [
                {
                    label: c1,
                    data: [data1.growthVal, data1.demandVal, data1.diffVal, data1.curveVal],
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2
                },
                {
                    label: c2,
                    data: [data2.growthVal, data2.demandVal, data2.diffVal, data2.curveVal],
                    backgroundColor: 'rgba(236, 72, 153, 0.2)',
                    borderColor: 'rgba(236, 72, 153, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    grid: { color: borderCard },
                    angleLines: { color: borderCard },
                    ticks: { color: textPrimary, backdropColor: 'transparent', display: false },
                    pointLabels: { color: textPrimary }
                }
            },
            plugins: {
                legend: { labels: { color: textPrimary } }
            }
        }
    });
}

function updateSalaryInsights() {
    const salaryCanvas = document.getElementById('salaryBarChart');
    if (!salaryCanvas) return;

    if (charts.salaryBar) charts.salaryBar.destroy();

    const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const borderCard = getComputedStyle(document.documentElement).getPropertyValue('--card-border').trim();

    charts.salaryBar = new Chart(salaryCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['AI Engineer', 'DevOps Engineer', 'Full Stack Dev', 'Data Scientist', 'Cyber Security'],
            datasets: [{
                label: 'Average Annual Package (LPA)',
                data: [18, 14.5, 12.5, 13.5, 11.5],
                backgroundColor: [
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)'
                ],
                borderColor: [
                    'rgba(168, 85, 247, 1)',
                    'rgba(99, 102, 241, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: borderCard },
                    ticks: { color: textPrimary, callback: (v) => v + " LPA" }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textPrimary }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Trends Module renderer
function renderTrendsModule() {
    const container = document.getElementById('trends-grid-container');
    container.innerHTML = ''; // clear

    const trends = [
        { title: "Rise of Agentic AI Workflows", icon: "fa-robot", desc: "Startups are prioritizing engineers with LangChain, Autogen, and structured tool-calling capabilities." },
        { title: "Shift to Edge Databases", icon: "fa-database", desc: "NoSQL models are expanding into local caches and regional edge networks like Cloudflare KV." },
        { title: "CI/CD Pipeline Automation", icon: "fa-rotate", desc: "Continuous testing has moved to Docker containers, prioritizing infrastructure skills as a default requirement." }
    ];

    trends.forEach((t, i) => {
        const card = document.createElement('div');
        card.className = 'feature-card glass-panel';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', `${i * 100}`);
        card.innerHTML = `
            <div class="feature-icon"><i class="fa-solid ${t.icon}"></i></div>
            <h3>${t.title}</h3>
            <p>${t.desc}</p>
        `;
        container.appendChild(card);
    });
}

// Certification Recommender
function renderCertsModule() {
    const container = document.getElementById('certs-grid-container');
    container.innerHTML = '';

    const results = state.results;
    const certs = (results && results.certifications) ? results.certifications : [
        { name: "AWS Certified Developer - Associate", difficulty: "Medium", benefits: "Validates technical core deployment templates", impact: "High" },
        { name: "Google Professional Data Engineer", difficulty: "Hard", benefits: "Confirms large scale analytical query designs", impact: "High" },
        { name: "HashiCorp Terraform Associate", difficulty: "Medium", benefits: "Demonstrates Infrastructure as Code (IaC) competency", impact: "Medium" }
    ];

    certs.forEach((c, i) => {
        const card = document.createElement('div');
        card.className = 'feature-card glass-panel';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', `${i * 100}`);
        card.innerHTML = `
            <div class="feature-icon"><i class="fa-solid fa-certificate"></i></div>
            <h3 style="font-size:1.15rem; color:var(--accent);">${c.name}</h3>
            <p>${c.benefits}</p>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:8px;">
                Difficulty: <strong>${c.difficulty}</strong> | Portfolio Impact: <strong>${c.impact}</strong>
            </div>
        `;
        container.appendChild(card);
    });
}

// AI Career Coach Chatbot Panel
function setupAICoach() {
    const sendBtn = document.getElementById('btn-chat-send');
    const input = document.getElementById('chat-user-input');
    const container = document.getElementById('chat-messages-container');

    // Handle suggestion chips
    document.querySelectorAll('#chat-suggestions .chip-select').forEach(chip => {
        chip.addEventListener('click', () => {
            input.value = chip.getAttribute('data-prompt');
            input.focus();
        });
    });

    const appendMessage = (role, content) => {
        const msg = document.createElement('div');
        msg.className = `chat-message ${role}`;
        
        const avatar = role === 'user' ? 'fa-user' : 'fa-robot';
        const name = role === 'user' ? 'You' : 'Career Coach AI';
        const rawContent = formatChatText(content);

        msg.innerHTML = `
            <div class="chat-avatar ${role === 'user' ? 'user' : ''}"><i class="fa-solid ${avatar}"></i></div>
            <div class="chat-bubble">
                <strong>${name}</strong>
                <p>${rawContent}</p>
                <div class="chat-actions">
                    <button class="chat-action-btn copy-msg" data-tooltip="Copy Response"><i class="fa-solid fa-copy"></i></button>
                    <span>Just now</span>
                </div>
            </div>
        `;

        msg.querySelector('.copy-msg').addEventListener('click', () => {
            navigator.clipboard.writeText(content);
            showToast("Copied to clipboard!", "success");
        });

        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    };

    const formatChatText = (text) => {
        // Simple regex codeblock formatter for UI neatness
        return text
            .replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    };

    const handleSend = async () => {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        appendMessage('user', text);

        // Show typing indicator
        const typing = document.createElement('div');
        typing.className = 'chat-message assistant';
        typing.id = 'chat-typing-indicator';
        typing.innerHTML = `
            <div class="chat-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="chat-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;

        try {
            let coachReply;
            if (state.mockMode || !state.apiKey) {
                coachReply = simulateCoachResponse(text);
            } else {
                const systemPrompt = `You are an expert career counselor. Provide detailed, helpful responses. Use inline code blocks for formatting commands or checklist parameters when needed.`;
                const userPrompt = `
                Goal: ${state.assessment?.goal || 'General Tech Role'}
                Question: ${text}
                `;
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${state.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gemma2-9b-it',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.5,
                        max_tokens: 800
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    coachReply = data.choices[0].message.content;
                } else {
                    throw new Error("Invalid response code");
                }
            }

            typing.remove();
            appendMessage('assistant', coachReply);

        } catch (e) {
            typing.remove();
            const fallback = "My backend network failed to communicate with the Groq server. Make sure you entered a valid API Key under Settings, or toggle Mock Mode to continue offline.";
            appendMessage('assistant', fallback);
            showToast("Coach response failed", "error");
        }
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

function simulateCoachResponse(prompt) {
    const responses = [
        "That's a great question! For a standard student profile, you should focus on building 2 core projects with distinct functionality (e.g. one API-based and one real-time frontend) to demonstrate end-to-end skill capabilities.",
        "When describing project items in a resume, remember to use the STAR method. Instead of 'built an API', write: 'Designed and deployed Express endpoints to handle asynchronous inventory requests, improving response times by 30%'.",
        "Make sure to target key DSA patterns: Arrays, two-pointers, hash tables, stacks, linked lists, sliding window, and basic recursion. These comprise 80% of technical interview questions.",
        "Your resume format should remain a single, clean column using standard fonts. Avoid decorative layouts, bar graphs for skills, or icons that confuse ATS scanner bots."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Generate Complete PDF Report
function exportCareerReportPDF() {
    if (!state.assessment || !state.results) {
        showToast("Please complete the assessment form to generate a report.", "warning");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const res = state.results;
    const as = state.assessment;

    const printHeader = (title) => {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 595, 80, 'F');
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text("CareerMentor AI Report", 40, 48);
        
        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(title, 550, 48, { align: 'right' });
    };

    const printFooter = (pageNum) => {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Report Compiled by CareerMentor AI", 40, 810);
        doc.text(`Page ${pageNum}`, 555, 810, { align: 'right' });
    };

    // --- PAGE 1: COVER ---
    printHeader("User Profile Overview");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("CAREER ASSESSMENT PROFILE", 40, 140);
    
    doc.setFontSize(10.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    
    let y = 180;
    const details = [
        ["Full Name", as.name],
        ["Age", as.age],
        ["Education Level", as.education],
        ["College Name", as.college],
        ["Branch", as.branch],
        ["Graduation Year", as.gradYear],
        ["Current CGPA", as.cgpa],
        ["Favorite Subjects", as.favSubjects],
        ["Strong Subjects", as.strongSubjects],
        ["Familiar Skills", as.skills.join(', ')],
        ["Interests", as.interests.join(', ')],
        ["Target Career Goal", as.goal]
    ];

    details.forEach(det => {
        doc.setFont("Helvetica", "bold");
        doc.text(`${det[0]}:`, 40, y);
        doc.setFont("Helvetica", "normal");
        
        const splitText = doc.splitTextToSize(det[1].toString(), 350);
        doc.text(splitText, 180, y);
        y += Math.max(splitText.length * 15, 20);
    });

    // Score widget on cover
    doc.setFillColor(241, 245, 249);
    doc.rect(40, y + 20, 510, 80, 'F');
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.text(`PLACEMENT READINESS SCORE: ${res.readinessScore || 0}%`, 60, y + 55);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Indicates alignment between your selected skills and the target career requirement criteria.", 60, y + 70);

    printFooter(1);

    // --- PAGE 2: RECOMMENDATIONS ---
    doc.addPage();
    printHeader("AI Recommended Careers");
    
    y = 120;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("TOP CAREER OPTIONS MATCHED", 40, y);
    y += 25;

    res.recommendations.slice(0, 3).forEach((rec, idx) => {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(99, 102, 241);
        doc.text(`${idx + 1}. ${rec.role} (${rec.matchScore}% Match)`, 40, y);
        y += 15;
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        
        const splitSuitability = doc.splitTextToSize(`Suitability: ${rec.suitability}`, 510);
        doc.text(splitSuitability, 40, y);
        y += splitSuitability.length * 13;

        const splitSkills = doc.splitTextToSize(`Required Stack: ${rec.skillsRequired ? rec.skillsRequired.join(', ') : 'Not Specified'}`, 510);
        doc.text(splitSkills, 40, y);
        y += splitSkills.length * 13;

        doc.text(`Estimated Timeline: ${rec.timeline}  |  Demand: ${rec.demand}  |  Growth: ${rec.growth}`, 40, y);
        y += 15;
        doc.text(`Salary Benchmark: Freshers - ${rec.salary?.fresher || 'N/A'}, Mid-Level - ${rec.salary?.mid || 'N/A'}, Senior - ${rec.salary?.senior || 'N/A'}`, 40, y);
        y += 35;
    });

    printFooter(2);

    // --- PAGE 3: GAP & ROADMAP ---
    doc.addPage();
    printHeader("Skill Gaps & Roadmaps");

    y = 120;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("IDENTIFIED SKILL GAPS", 40, y);
    y += 20;

    const gap = res.skillGap || { highPriority: [], mediumPriority: [], lowPriority: [] };
    doc.setFontSize(9.5);
    
    doc.setFont("Helvetica", "bold");
    doc.text("High Priority Gaps:", 40, y);
    doc.setFont("Helvetica", "normal");
    doc.text(gap.highPriority.join(', ') || "None identified.", 160, y);
    y += 15;

    doc.setFont("Helvetica", "bold");
    doc.text("Medium Priority Gaps:", 40, y);
    doc.setFont("Helvetica", "normal");
    doc.text(gap.mediumPriority.join(', ') || "None identified.", 160, y);
    y += 15;

    doc.setFont("Helvetica", "bold");
    doc.text("Accessory Tool Gaps:", 40, y);
    doc.setFont("Helvetica", "normal");
    doc.text(gap.lowPriority.join(', ') || "None identified.", 160, y);
    
    y += 40;
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("CHRONOLOGICAL LEARNING TIMELINE", 40, y);
    y += 25;

    const phases = [
        ["Phase 1: Beginner", res.roadmap?.beginner],
        ["Phase 2: Intermediate", res.roadmap?.intermediate],
        ["Phase 3: Advanced", res.roadmap?.advanced],
        ["Phase 4: Placement Prep", res.roadmap?.placement]
    ];

    phases.forEach(ph => {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(99, 102, 241);
        doc.text(ph[0], 40, y);
        y += 15;

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);

        const items = [];
        const data = ph[1] || {};
        if (data.concepts) data.concepts.forEach(c => items.push(`Concept: ${c}`));
        if (data.frameworks) data.frameworks.forEach(c => items.push(`Framework: ${c}`));
        if (data.tools) data.tools.forEach(c => items.push(`Tool: ${c}`));
        if (data.resources) data.resources.forEach(c => items.push(`Resource: ${c}`));
        if (data.projects) data.projects.forEach(c => items.push(`Project: ${c}`));
        if (data.dsa) data.dsa.forEach(c => items.push(`DSA Target: ${c}`));

        items.slice(0, 3).forEach(item => {
            const splitItem = doc.splitTextToSize(`* ${item}`, 510);
            doc.text(splitItem, 45, y);
            y += splitItem.length * 13;
        });
        y += 15;
    });

    printFooter(3);

    // Save report file
    doc.save(`${as.name.replace(/\s+/g, '_')}_CareerMentor_Report.pdf`);
    showToast("PDF Career Report exported!", "success");
}
