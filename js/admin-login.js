/**
 * 관리자 로그인 시스템
 */

class AdminLoginManager {
    constructor() {
        this.adminPassword = 'admin123'; // 기본 패스워드
        this.isLoggedIn = false;
        this.init();
    }

    /**
     * 초기화 (DOM 로드 후 실행)
     */
    init() {
        // 이미 초기화되었으면 스킵
        if (this.initialized) return;
        
        // DOM이 로드된 후 이벤트 리스너 설정
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.initialized = true;
            });
        } else {
            this.setupEventListeners();
            this.initialized = true;
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 관리자 버튼 클릭
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                this.showAdminLoginModal();
            });
        }

        // 로그인 버튼 클릭
        const loginBtn = document.getElementById('admin-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.attemptLogin();
            });
        }

        // 폼 제출 이벤트
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.attemptLogin();
            });
        }

        // 엔터키로 로그인
        const passwordInput = document.getElementById('admin-password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.attemptLogin();
                }
            });
        }
    }

    /**
     * 관리자 로그인 모달 표시
     */
    showAdminLoginModal() {
        // 패스워드 입력 필드 초기화
        document.getElementById('admin-password').value = '';
        showModal('admin-login-modal');
    }

    /**
     * 로그인 시도
     */
    attemptLogin() {
        const password = document.getElementById('admin-password').value;
        
        if (!password) {
            showNotification('Error', 'Please enter password', 'error');
            return;
        }

        if (password === this.adminPassword) {
            this.loginSuccess();
        } else {
            this.loginFailed();
        }
    }

    /**
     * 로그인 성공
     */
    loginSuccess() {
        this.isLoggedIn = true;
        hideModal('admin-login-modal');
        showNotification('Login Success', 'Welcome to Admin Mode', 'success');
        
        // 관리자 페이지로 이동 (로그인 상태 파라미터 포함)
        window.location.href = 'admin.html?admin=true';
    }

    /**
     * 로그인 실패
     */
    loginFailed() {
        showNotification('Login Failed', 'Incorrect password', 'error');
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password').focus();
    }

    /**
     * 로그인 상태 확인
     */
    isAdminLoggedIn() {
        return this.isLoggedIn;
    }

    /**
     * 로그아웃
     */
    logout() {
        this.isLoggedIn = false;
        showNotification('Logged Out', 'You have been logged out', 'info');
    }
}

// DOM 로드 후 관리자 로그인 매니저 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    window.adminLoginManager = new AdminLoginManager();
});
