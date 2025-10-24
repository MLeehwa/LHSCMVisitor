/**
 * 방문자 관리 시스템 - 체크인 기능
 */

class CheckinManager {
    constructor() {
        this.frequentVisitors = [];
        this.setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 체크인 버튼 클릭
        document.getElementById('checkin-btn').addEventListener('click', () => {
            this.showCheckinModal();
        });

        // 체크인 폼 제출
        document.getElementById('checkin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCheckin();
        });
    }

    /**
     * 체크인 모달 표시
     */
    async showCheckinModal() {
        // 현재 선택된 위치가 있으면 그대로 사용 (위치 감지하지 않음)
        const currentLocation = window.locationManager.selectedLocation || window.locationManager.savedLocation;
        if (currentLocation) {
            updateLocationStatus(
                `${currentLocation.name} (${currentLocation.category === 'dormitory' ? 'Dormitory' : 'Factory'})`,
                'success'
            );
            showModal('checkin-modal');
            return;
        }

        // 위치가 없으면 수동 선택 요청
        updateLocationStatus('No location selected - Please select manually', 'warning');
        showNotification('Location Required', 'Please select your current location manually', 'warning');

        // 자주 방문하는 방문자 로드
        await this.loadFrequentVisitors();
        
        // 폼 필드 업데이트
        this.updateFormFieldsForCategory();
        
        // 모달 표시
        showModal('checkin-modal');
    }

    /**
     * 자주 방문하는 방문자 로드
     */
    async loadFrequentVisitors() {
        try {
            this.frequentVisitors = await loadFrequentVisitors();
            this.renderFrequentVisitors();
        } catch (error) {
            console.error('Failed to load frequent visitors:', error);
        }
    }

    /**
     * 자주 방문하는 방문자 렌더링
     */
    renderFrequentVisitors() {
        const section = document.getElementById('frequent-visitors-section');
        const list = document.getElementById('frequent-visitors-list');
        
        // 기숙사 방문이고 자주 방문하는 방문자가 있는 경우에만 표시
        if (window.VisitorSystem.data.detectedCategory === 'dormitory' && this.frequentVisitors.length > 0) {
            section.classList.remove('hidden');
            
            list.innerHTML = this.frequentVisitors.map(visitor => `
                <div class="card p-3 cursor-pointer hover:bg-gray-50 transition-colors" 
                     onclick="checkinManager.selectFrequentVisitor('${visitor.first_name}', '${visitor.last_name}', '${visitor.company || ''}', '${visitor.phone || ''}')">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-semibold">${visitor.first_name} ${visitor.last_name}</div>
                            <div class="text-sm text-gray-500">${visitor.company || 'No company info'}</div>
                        </div>
                        <i class="fas fa-star text-yellow-500"></i>
                    </div>
                </div>
            `).join('');
        } else {
            section.classList.add('hidden');
        }
    }

    /**
     * 자주 방문하는 방문자 선택
     */
    selectFrequentVisitor(firstName, lastName, company, phone) {
        const form = document.getElementById('checkin-form');
        form.first_name.value = firstName;
        form.last_name.value = lastName;
        form.company.value = company;
        form.phone.value = phone;
        
        showNotification('Frequent Visitor Selected', `${firstName} ${lastName}'s information has been filled in`, 'success');
    }

    /**
     * 카테고리에 따른 폼 필드 업데이트
     */
    updateFormFieldsForCategory() {
        const companyField = document.querySelector('input[name="company"]');
        const phoneField = document.querySelector('input[name="phone"]');
        
        if (window.VisitorSystem.data.detectedCategory === 'factory') {
            companyField.required = true;
            phoneField.required = true;
            companyField.placeholder = 'Company Name (Required)';
            phoneField.placeholder = 'Phone Number (Required)';
        } else {
            companyField.required = false;
            phoneField.required = false;
            companyField.placeholder = 'Company Name (Optional)';
            phoneField.placeholder = 'Phone Number (Optional)';
        }
    }

    /**
     * 체크인 처리
     */
    async handleCheckin() {
        const formData = getFormData('checkin-form');
        
        // 기본 검증
        if (!formData.first_name || !formData.last_name) {
            showNotification('Input Error', 'First name and last name are required', 'error');
            return;
        }

        // 현재 선택된 위치 정보 가져오기 (우선순위: selectedLocation > savedLocation > VisitorSystem.data)
        const currentLocation = window.locationManager.selectedLocation || 
                               window.locationManager.savedLocation || 
                               window.VisitorSystem.data.currentLocation;
        const currentCategory = currentLocation ? currentLocation.category : window.VisitorSystem.data.detectedCategory;
        const locationName = currentLocation ? currentLocation.name : 'Current Location';
        
        console.log('Check-in location info:', {
            selectedLocation: window.locationManager.selectedLocation,
            savedLocation: window.locationManager.savedLocation,
            visitorSystemLocation: window.VisitorSystem.data.currentLocation,
            currentLocation: currentLocation,
            currentCategory: currentCategory,
            locationName: locationName
        });

        // 공장 방문 시 추가 검증
        if (currentCategory === 'factory') {
            if (!formData.company || !formData.phone) {
                showNotification('Input Error', 'Company name and phone number are required for factory visits', 'error');
                return;
            }
        }

        // 체크인 데이터 준비
        const checkinData = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            company: formData.company || '',
            phone: formData.phone || '',
            purpose: formData.purpose || 'other',
            category: currentCategory,
            location_name: locationName
        };

        try {
            // 로딩 표시
            const submitBtn = document.querySelector('#checkin-form button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class="loading"></div> Processing...';
            submitBtn.disabled = true;

            // API 호출
            const visitor = await apiRequest('/visitors', {
                method: 'POST',
                body: JSON.stringify(checkinData)
            });

            // 성공 처리
            showNotification(
                'Check-in Complete', 
                `${checkinData.first_name} ${checkinData.last_name} has been checked in`, 
                'success'
            );

            // 폼 초기화 및 모달 닫기
            resetForm('checkin-form');
            hideModal('checkin-modal');

        } catch (error) {
            showNotification('Check-in Failed', error.message, 'error');
        } finally {
            // 로딩 상태 해제
            const submitBtn = document.querySelector('#checkin-form button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Complete Check-in';
            submitBtn.disabled = false;
        }
    }
}

// 체크인 매니저 인스턴스 생성
window.checkinManager = new CheckinManager();
