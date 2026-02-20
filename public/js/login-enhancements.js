/**
 * Améliorations pour la page de connexion DLMS
 * Fonctionnalités d'amélioration de l'UX
 */

class LoginEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupAnimations();
        this.setupPasswordToggle();
        this.setupAutoFocus();
        this.setupKeyboardNavigation();
        this.setupLoadingStates();
    }

    /**
     * Configuration de la validation du formulaire
     */
    setupFormValidation() {
        const form = document.getElementById('loginForm');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');

        if (!form) return;

        // Validation en temps réel
        [usernameInput, passwordInput].forEach(input => {
            input.addEventListener('input', () => {
                this.validateField(input);
            });

            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });

        // Validation lors de la soumission
        form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.showValidationError();
            }
        });
    }

    /**
     * Validation d'un champ individuel
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldGroup = field.closest('.form-group');
        
        // Supprimer les classes d'erreur précédentes
        field.classList.remove('is-invalid');
        fieldGroup.classList.remove('has-error');
        
        // Validation spécifique selon le type de champ
        let isValid = true;
        let errorMessage = '';

        if (field.type === 'text' && field.name === 'loginId') {
            if (value.length < 3) {
                isValid = false;
                errorMessage = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
            }
        }

        if (field.type === 'password') {
            if (value.length < 6) {
                isValid = false;
                errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
            }
        }

        // Appliquer les styles d'erreur si nécessaire
        if (!isValid) {
            field.classList.add('is-invalid');
            fieldGroup.classList.add('has-error');
            this.showFieldError(field, errorMessage);
        } else {
            field.classList.add('is-valid');
            this.hideFieldError(field);
        }

        return isValid;
    }

    /**
     * Validation complète du formulaire
     */
    validateForm() {
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        
        const isUsernameValid = this.validateField(usernameInput);
        const isPasswordValid = this.validateField(passwordInput);
        
        return isUsernameValid && isPasswordValid;
    }

    /**
     * Affichage des erreurs de validation
     */
    showValidationError() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Validation requise',
                text: 'Veuillez corriger les erreurs dans le formulaire',
                confirmButtonColor: '#1565C0',
                background: '#fff',
                backdrop: 'rgba(0,0,0,0.4)'
            });
        }
    }

    /**
     * Affichage d'erreur pour un champ spécifique
     */
    showFieldError(field, message) {
        let errorElement = field.parentElement.querySelector('.field-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error text-danger mt-1 small';
            field.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Masquage d'erreur pour un champ spécifique
     */
    hideFieldError(field) {
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Configuration des animations
     */
    setupAnimations() {
        // Animation d'entrée pour les éléments
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observer les éléments à animer
        document.querySelectorAll('.form-group, .btn-login, .welcome-text').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Configuration du toggle du mot de passe
     */
    setupPasswordToggle() {
        const passwordInput = document.getElementById('login-password');
        if (!passwordInput) return;

        // Créer le bouton de toggle
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'password-toggle';
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
        toggleButton.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #adb5bd;
            cursor: pointer;
            z-index: 10;
            transition: color 0.3s ease;
        `;

        // Ajouter le bouton au conteneur du mot de passe
        const passwordGroup = passwordInput.closest('.input-group');
        if (passwordGroup) {
            passwordGroup.style.position = 'relative';
            passwordGroup.appendChild(toggleButton);
        }

        // Gestion du clic sur le toggle
        toggleButton.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = toggleButton.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            
            toggleButton.style.color = type === 'password' ? '#adb5bd' : '#1565C0';
        });
    }

    /**
     * Configuration de l'auto-focus
     */
    setupAutoFocus() {
        const usernameInput = document.getElementById('login-username');
        if (usernameInput) {
            // Focus automatique après un court délai
            setTimeout(() => {
                usernameInput.focus();
            }, 500);
        }
    }

    /**
     * Configuration de la navigation au clavier
     */
    setupKeyboardNavigation() {
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const submitButton = document.getElementById('loginBtn');

        if (!usernameInput || !passwordInput || !submitButton) return;

        // Navigation avec Tab
        usernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                passwordInput.focus();
            }
        });

        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitButton.click();
            }
        });

        // Raccourci clavier Ctrl+Enter pour soumettre
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                submitButton.click();
            }
        });
    }

    /**
     * Configuration des états de chargement
     */
    setupLoadingStates() {
        const form = document.getElementById('loginForm');
        const submitButton = document.getElementById('loginBtn');

        if (!form || !submitButton) return;

        form.addEventListener('submit', () => {
            // Désactiver le bouton et afficher l'état de chargement
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Connexion...';
            
            // Ajouter une classe pour l'animation
            submitButton.classList.add('loading');
        });
    }

    /**
     * Fonction utilitaire pour afficher des notifications
     */
    showNotification(message, type = 'info') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: message,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: '#fff',
                backdrop: false
            });
        }
    }

    /**
     * Fonction pour réinitialiser le formulaire
     */
    resetForm() {
        const form = document.getElementById('loginForm');
        const submitButton = document.getElementById('loginBtn');
        
        if (form) {
            form.reset();
        }
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Se connecter';
            submitButton.classList.remove('loading');
        }

        // Nettoyer les erreurs
        document.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });

        document.querySelectorAll('.field-error').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// Styles CSS supplémentaires pour les améliorations
const additionalStyles = `
    .form-group {
        position: relative;
        margin-bottom: 1.5rem;
    }

    .form-control.is-invalid {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }

    .form-control.is-valid {
        border-color: #198754;
        box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
    }

    .has-error .input-icon {
        color: #dc3545;
    }

    .field-error {
        font-size: 0.875rem;
        margin-top: 0.25rem;
        animation: fadeIn 0.3s ease-in;
    }

    .btn-login.loading {
        pointer-events: none;
        opacity: 0.8;
    }

    .animate-in {
        animation: slideInUp 0.6s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .password-toggle:hover {
        color: #1565C0 !important;
    }

    .form-control:focus + .input-icon {
        color: #1565C0;
    }
`;

// Ajouter les styles au document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialiser les améliorations quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new LoginEnhancements();
});

// Exporter la classe pour utilisation externe
window.LoginEnhancements = LoginEnhancements; 