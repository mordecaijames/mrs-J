// ========================================
// Configuration & Constants
// ========================================

const CONFIG = {
    // Replace with your deployed Google Apps Script Web App URL
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbw1Q1ssbToaD5PZLjLTR7VNRdPvPHC-v0nYndUMWXT5PmGUXrrpxDAJCggJ9tP_afx5cQ/exec',
    
    // Team access code (must match backend)
    ACCESS_CODE: 'TEAM2026',
    
    // Approved team members structure
    APPROVED_TEAM: {
        lead_vocal: ['Jacinta Samson'],
        instrumentalist: [
            'Cyril Alfred (Acoustic Guitar)',
            'Pst Michael Adedimeji (Keyboard)',
            'Reuben Garba (Bass Guitar)',
            'Isaac Aleyideno (Lead Guitar)',
            'Mordecai James (Drum)',
            'Mishack (Keyboardist)'
        ],
        bgvs: [
            'Elijah Amos',
            'Chioma Chukwuma',
            'Oyi Favour',
            'Omotola',
            'Love Daniel',
            'Marvel Clifford',
            'Emmanuel Anierobi',
            'Grace Ayuba',
            'Mercy Kingsley',
            'Daniel David'
        ]
    }
};

// Track registered names to prevent duplicates (client-side check)
const registeredTeamMembers = new Set();

// ========================================
// DOM Elements
// ========================================

const DOM = {
    // Section toggles
    toggleBtns: document.querySelectorAll('.toggle-btn'),
    teamSection: document.getElementById('team-section'),
    audienceSection: document.getElementById('audience-section'),
    
    // Team access
    lockScreen: document.getElementById('team-lock-screen'),
    accessForm: document.getElementById('access-code-form'),
    accessInput: document.getElementById('access-code-input'),
    accessError: document.getElementById('access-error'),
    
    // Team form
    teamForm: document.getElementById('team-form'),
    teamCategory: document.getElementById('team-category'),
    teamName: document.getElementById('team-name'),
    teamEmail: document.getElementById('team-email'),
    teamPhone: document.getElementById('team-phone'),
    teamSubmit: document.getElementById('team-submit'),
    
    // Audience form
    audienceForm: document.getElementById('audience-form'),
    audienceName: document.getElementById('audience-name'),
    audienceEmail: document.getElementById('audience-email'),
    audiencePhone: document.getElementById('audience-phone'),
    audienceSubmit: document.getElementById('audience-submit'),
    
    // Modals
    successModal: document.getElementById('success-modal'),
    errorModal: document.getElementById('error-modal'),
    modalDetails: document.getElementById('modal-details'),
    errorMessage: document.getElementById('error-message')
};

// ========================================
// Initialization
// ========================================

function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // Section toggle
    DOM.toggleBtns.forEach(btn => {
        btn.addEventListener('click', handleSectionToggle);
    });
    
    // Access code form
    DOM.accessForm.addEventListener('submit', handleAccessCodeSubmit);
    
    // Team category change
    DOM.teamCategory.addEventListener('change', handleCategoryChange);
    
    // Form submissions
    DOM.teamForm.addEventListener('submit', handleTeamSubmit);
    DOM.audienceForm.addEventListener('submit', handleAudienceSubmit);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', closeModals);
    });
}

// ========================================
// Section Toggle
// ========================================

function handleSectionToggle(e) {
    const btn = e.currentTarget;
    const targetSection = btn.dataset.section;
    
    // Update active button
    DOM.toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Switch sections
    if (targetSection === 'team') {
        DOM.teamSection.classList.add('active');
        DOM.audienceSection.classList.remove('active');
    } else {
        DOM.audienceSection.classList.add('active');
        DOM.teamSection.classList.remove('active');
    }
    
    // Reset forms
    clearFormErrors(DOM.teamForm);
    clearFormErrors(DOM.audienceForm);
}

// ========================================
// Team Access Code
// ========================================

function handleAccessCodeSubmit(e) {
    e.preventDefault();
    
    const code = DOM.accessInput.value.trim();
    
    if (code === CONFIG.ACCESS_CODE) {
        // Success - unlock form
        DOM.lockScreen.style.display = 'none';
        DOM.teamForm.classList.remove('hidden');
        DOM.accessError.classList.remove('show');
    } else {
        // Error - show message
        DOM.accessError.textContent = 'Invalid access code. Please try again.';
        DOM.accessError.classList.add('show');
        DOM.accessInput.value = '';
        DOM.accessInput.focus();
    }
}

// ========================================
// Team Category Change
// ========================================

function handleCategoryChange(e) {
    const category = e.target.value;
    const nameSelect = DOM.teamName;
    
    // Clear existing options
    nameSelect.innerHTML = '<option value="">Select your name</option>';
    
    if (category && CONFIG.APPROVED_TEAM[category]) {
        // Populate names for selected category
        const names = CONFIG.APPROVED_TEAM[category];
        
        names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            
            // Disable if already registered
            if (registeredTeamMembers.has(name)) {
                option.disabled = true;
                option.textContent += ' (Already registered)';
            }
            
            nameSelect.appendChild(option);
        });
        
        nameSelect.disabled = false;
    } else {
        nameSelect.disabled = true;
        nameSelect.innerHTML = '<option value="">Select category first</option>';
    }
    
    // Clear name validation error if exists
    clearFieldError(nameSelect);
}

// ========================================
// Form Validation
// ========================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    // Basic validation - not empty
    return phone.trim().length > 0;
}

function validateTeamForm() {
    let isValid = true;
    
    // Category validation
    if (!DOM.teamCategory.value) {
        showFieldError(DOM.teamCategory, 'Please select a category');
        isValid = false;
    } else {
        clearFieldError(DOM.teamCategory);
    }
    
    // Name validation
    if (!DOM.teamName.value) {
        showFieldError(DOM.teamName, 'Please select your name');
        isValid = false;
    } else {
        clearFieldError(DOM.teamName);
    }
    
    // Email validation
    if (!validateEmail(DOM.teamEmail.value)) {
        showFieldError(DOM.teamEmail, 'Please enter a valid email address');
        isValid = false;
    } else {
        clearFieldError(DOM.teamEmail);
    }
    
    // Phone validation
    if (!validatePhone(DOM.teamPhone.value)) {
        showFieldError(DOM.teamPhone, 'Please enter your phone number');
        isValid = false;
    } else {
        clearFieldError(DOM.teamPhone);
    }
    
    return isValid;
}

function validateAudienceForm() {
    let isValid = true;
    
    // Name validation
    if (DOM.audienceName.value.trim().length < 2) {
        showFieldError(DOM.audienceName, 'Please enter your full name');
        isValid = false;
    } else {
        clearFieldError(DOM.audienceName);
    }
    
    // Email validation
    if (!validateEmail(DOM.audienceEmail.value)) {
        showFieldError(DOM.audienceEmail, 'Please enter a valid email address');
        isValid = false;
    } else {
        clearFieldError(DOM.audienceEmail);
    }
    
    // Phone validation
    if (!validatePhone(DOM.audiencePhone.value)) {
        showFieldError(DOM.audiencePhone, 'Please enter your phone number');
        isValid = false;
    } else {
        clearFieldError(DOM.audiencePhone);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    const errorSpan = formGroup.querySelector('.error-message');
    
    formGroup.classList.add('error');
    errorSpan.textContent = message;
    errorSpan.classList.add('show');
}

function clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    const errorSpan = formGroup.querySelector('.error-message');
    
    formGroup.classList.remove('error');
    errorSpan.textContent = '';
    errorSpan.classList.remove('show');
}

function clearFormErrors(form) {
    form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    form.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
        error.classList.remove('show');
    });
}

// ========================================
// Form Submissions
// ========================================

async function handleTeamSubmit(e) {
    e.preventDefault();
    
    if (!validateTeamForm()) {
        return;
    }
    
    // Check client-side duplicate
    if (registeredTeamMembers.has(DOM.teamName.value)) {
        showErrorModal('This team member has already registered.');
        return;
    }
    
    const submitBtn = DOM.teamSubmit;
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    
    const payload = {
        type: 'team',
        accessCode: CONFIG.ACCESS_CODE,
        category: DOM.teamCategory.value,
        name: DOM.teamName.value,
        email: DOM.teamEmail.value,
        phone: DOM.teamPhone.value
    };
    
    try {
        const response = await fetch(CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Note: With no-cors mode, we can't read the response
        // Assume success if no error is thrown
        
        // Add to registered set
        registeredTeamMembers.add(DOM.teamName.value);
        
        // Show success modal
        showSuccessModal({
            name: DOM.teamName.value,
            role: getCategoryLabel(DOM.teamCategory.value)
        });
        
        // Reset form
        DOM.teamForm.reset();
        DOM.teamName.disabled = true;
        DOM.teamName.innerHTML = '<option value="">Select category first</option>';
        
        // Refresh category dropdown to show updated registered status
        handleCategoryChange({ target: DOM.teamCategory });
        
    } catch (error) {
        console.error('Registration error:', error);
        showErrorModal('Unable to complete registration. Please try again.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

async function handleAudienceSubmit(e) {
    e.preventDefault();
    
    if (!validateAudienceForm()) {
        return;
    }
    
    const submitBtn = DOM.audienceSubmit;
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    
    const payload = {
        type: 'audience',
        fullName: DOM.audienceName.value.trim(),
        email: DOM.audienceEmail.value.trim(),
        phone: DOM.audiencePhone.value.trim()
    };
    
    try {
        const response = await fetch(CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Note: With no-cors mode, we can't read the response
        // Assume success if no error is thrown
        
        // Show success modal
        showSuccessModal({
            name: DOM.audienceName.value.trim(),
            role: null
        });
        
        // Reset form
        DOM.audienceForm.reset();
        
    } catch (error) {
        console.error('Registration error:', error);
        showErrorModal('Unable to complete registration. Please try again.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

// ========================================
// Modals
// ========================================

function showSuccessModal(data) {
    let detailsHTML = `<p class="modal-name">${data.name}</p>`;
    
    if (data.role) {
        detailsHTML += `<span class="modal-role">${data.role}</span>`;
    }
    
    DOM.modalDetails.innerHTML = detailsHTML;
    DOM.successModal.classList.add('show');
}

function showErrorModal(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorModal.classList.add('show');
}

function closeModals() {
    DOM.successModal.classList.remove('show');
    DOM.errorModal.classList.remove('show');
}

// ========================================
// Utility Functions
// ========================================

function getCategoryLabel(category) {
    const labels = {
        lead_vocal: 'Lead Vocal',
        instrumentalist: 'Instrumentalist',
        bgvs: 'Background Vocals'
    };
    return labels[category] || category;
}

// ========================================
// Start Application
// ========================================

document.addEventListener('DOMContentLoaded', init);
