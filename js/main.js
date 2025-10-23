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
        if (window.locationManager && window.locationManager.useSavedLocation()) {
            updateLocationStatus('Using saved location', 'success');
            showNotification('Location Loaded', 'Using previously saved location', 'info');
            return;
        }

        // 저장된 위치가 없으면 GPS로 위치 감지
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
