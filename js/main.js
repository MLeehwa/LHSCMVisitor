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
        // 저장된 위치가 있으면 사용 (Location Change 설정과 관계없이)
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
            
            if (!window.locationManager.locationChangeEnabled) {
                showNotification('Location Loaded', 'Using previously saved location - GPS disabled', 'info');
            } else {
                showNotification('Location Loaded', 'Using previously saved location', 'info');
            }
            return;
        }

        // Location Change가 비활성화되어 있으면 GPS 사용하지 않음
        if (!window.locationManager.locationChangeEnabled) {
            updateLocationStatus('Location Change is OFF - Please enable to detect location', 'warning');
            showNotification('Location Change Required', 'Please enable Location Change to detect your location', 'warning');
            return;
        }

        // 저장된 위치가 없고 Location Change가 활성화되어 있으면 GPS로 위치 감지
        updateLocationStatus('Detecting location...', 'loading');
        
        try {
            const result = await detectLocationAndCategory();
            if (result.success) {
                // 새로운 위치 정보 저장
                window.locationManager.saveLocation(result.location);
                
                updateLocationStatus(
                    `${result.location.name} (${result.category === 'dormitory' ? 'Dormitory' : 'Factory'})`,
                    'success'
                );
                
                showNotification('Location Detected', `Location detected and saved: ${result.location.name}`, 'success');
            } else {
                // 위치 감지 실패 시 수동 선택 옵션 제공
                window.locationManager.handleLocationDetectionFailure();
            }
        } catch (error) {
            // 위치 감지 오류 시 수동 선택 옵션 제공
            window.locationManager.handleLocationDetectionFailure();
        }
    }
}

// 메인 페이지 매니저 인스턴스 생성
window.mainPageManager = new MainPageManager();
