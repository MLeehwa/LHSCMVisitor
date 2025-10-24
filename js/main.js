/**
 * 방문자 관리 시스템 - 메인 페이지 기능
 */

class MainPageManager {
    constructor() {
        this.initializePage();
    }

    /**
     * 페이지 초기화
     */
    async initializePage() {
        // 저장된 위치가 있으면 사용
        if (window.locationManager && window.locationManager.savedLocation) {
            // 선택된 위치를 저장된 위치로 설정
            window.locationManager.selectedLocation = window.locationManager.savedLocation;
            
            // VisitorSystem 데이터 업데이트
            window.VisitorSystem.data.detectedCategory = window.locationManager.savedLocation.category;
            window.VisitorSystem.data.currentLocation = window.locationManager.savedLocation;
            
            updateLocationStatus(
                `${window.locationManager.savedLocation.name} (${window.locationManager.savedLocation.category === 'dormitory' ? 'Dormitory' : 'Factory'})`, 
                'success'
            );
            
            showNotification('Location Loaded', 'Using previously saved location', 'info');
            return;
        }

        // 저장된 위치가 없으면 수동 선택 요청
        updateLocationStatus('No location selected - Please select manually', 'warning');
        showNotification('Location Required', 'Please select your current location manually', 'warning');
    }
}

// 메인 페이지 매니저 인스턴스 생성
window.mainPageManager = new MainPageManager();

