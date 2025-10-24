/**
 * Location Manager - 위치 선택 및 저장 기능
 */

class LocationManager {
    constructor() {
        this.selectedLocation = null;
        this.savedLocation = this.loadSavedLocation();
        this.setupEventListeners();
        this.initializeManualButton();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 수동 위치 선택 버튼
        document.getElementById('manual-location-btn').addEventListener('click', () => {
            this.showLocationSelectionModal();
        });

        // 위치 저장 버튼
        document.getElementById('save-location-preference').addEventListener('click', () => {
            this.saveLocationPreference();
        });
    }

    /**
     * 저장된 위치 로드
     */
    loadSavedLocation() {
        const saved = localStorage.getItem('visitorSystem_savedLocation');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Failed to parse saved location:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * 위치 저장
     */
    saveLocation(location) {
        this.selectedLocation = location;
        localStorage.setItem('visitorSystem_savedLocation', JSON.stringify(location));
        console.log('Location saved:', location);
    }

    /**
     * 위치 선택 모달 표시
     */
    async showLocationSelectionModal() {
        try {
            // 위치 목록 로드
            const locations = await this.loadLocations();
            this.renderLocationOptions(locations);
            showModal('location-selection-modal');
        } catch (error) {
            console.error('Failed to load locations:', error);
            showNotification('Error', 'Failed to load locations', 'error');
        }
    }

    /**
     * 위치 목록 로드
     */
    async loadLocations() {
        try {
            if (!window.supabaseClient || !window.supabaseClient.client) {
                throw new Error('Supabase client not initialized');
            }

            const { data: locations, error } = await window.supabaseClient.client
                .from('locations')
                .select('*')
                .order('name');

            if (error) throw error;
            return locations || [];
        } catch (error) {
            console.error('Failed to load locations:', error);
            // 기본 위치 반환
            return [
                { id: 1, name: 'Main Dormitory', category: 'dormitory' },
                { id: 2, name: 'Factory Building A', category: 'factory' },
                { id: 3, name: 'Factory Building B', category: 'factory' }
            ];
        }
    }

    /**
     * 위치 옵션 렌더링
     */
    renderLocationOptions(locations) {
        const container = document.getElementById('location-options');
        
        container.innerHTML = locations.map(location => `
            <div class="location-option card cursor-pointer hover:bg-gray-50 transition-colors" 
                 onclick="locationManager.selectLocation(${location.id}, '${location.name}', '${location.category}')">
                <div class="flex items-center gap-3">
                    <div class="location-option-icon">
                        <i class="fas ${location.category === 'dormitory' ? 'fa-home' : 'fa-industry'} text-2xl ${location.category === 'dormitory' ? 'text-blue-500' : 'text-orange-500'}"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-lg">${location.name}</h4>
                        <p class="text-sm text-gray-500">${location.category === 'dormitory' ? 'Dormitory' : 'Factory'}</p>
                    </div>
                    <div class="location-option-arrow">
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 위치 선택
     */
    selectLocation(id, name, category) {
        const location = { id, name, category };
        this.selectedLocation = location;
        
        // 선택한 위치를 저장된 위치로도 저장 (지속성 유지)
        this.saveLocation(location);
        
        // 위치 상태 업데이트
        updateLocationStatus(`${name} (${category === 'dormitory' ? 'Dormitory' : 'Factory'})`, 'success');
        
        // VisitorSystem 데이터 업데이트
        window.VisitorSystem.data.detectedCategory = category;
        window.VisitorSystem.data.currentLocation = location;
        
        // 모달 닫기
        hideModal('location-selection-modal');
        
        showNotification('Location Selected', `Selected: ${name}`, 'success');
        
        console.log('Location selected and saved:', location);
    }

    /**
     * 위치 기본값으로 저장
     */
    saveLocationPreference() {
        if (this.selectedLocation) {
            this.saveLocation(this.selectedLocation);
            showNotification('Location Saved', 'Location saved as default', 'success');
            hideModal('location-selection-modal');
        } else {
            showNotification('Error', 'Please select a location first', 'error');
        }
    }


    /**
     * Manual 버튼 초기화
     */
    initializeManualButton() {
        const manualBtn = document.getElementById('manual-location-btn');
        if (manualBtn) {
            manualBtn.disabled = false;
            console.log('Manual button initialized and enabled');
        }
    }

    /**
     * 저장된 위치 사용
     */
    useSavedLocation() {
        if (this.savedLocation) {
            this.selectLocation(
                this.savedLocation.id, 
                this.savedLocation.name, 
                this.savedLocation.category
            );
            return true;
        }
        return false;
    }


    /**
     * 위치 감지 실패 시 처리
     */
    handleLocationDetectionFailure() {
        // 저장된 위치가 있으면 사용
        if (this.useSavedLocation()) {
            showNotification('Using Saved Location', 'Using previously saved location', 'info');
            return;
        }

        // 저장된 위치가 없으면 수동 선택 요청
        updateLocationStatus('Location detection failed. Please select manually.', 'warning');
        showNotification('Location Required', 'Please select your current location', 'warning');
        
        // 수동 선택 버튼 활성화
        document.getElementById('manual-location-btn').disabled = false;
    }
}

// 위치 매니저 인스턴스 생성
window.locationManager = new LocationManager();
