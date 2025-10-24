/**
 * 방문자 관리 시스템 - 체크아웃 기능
 */

class CheckoutManager {
    constructor() {
        this.currentVisitors = [];
        this.setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 체크아웃 버튼 클릭
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.showCheckoutModal();
        });
        
        // 일괄 체크아웃 버튼 이벤트 리스너
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'batch-checkout-btn') {
                this.batchCheckout();
            }
        });
    }

    /**
     * 체크아웃 모달 표시
     */
    async showCheckoutModal() {
        // 현재 선택된 위치가 있으면 그대로 사용 (위치 감지하지 않음)
        const currentLocation = window.locationManager.selectedLocation || window.locationManager.savedLocation;
        if (currentLocation) {
            updateLocationStatus(
                `${currentLocation.name} (${currentLocation.category === 'dormitory' ? 'Dormitory' : 'Factory'})`,
                'success'
            );
            
            // 현재 위치에 체크인된 방문자 로드
            await this.loadCurrentVisitors();
            showModal('checkout-modal');
            return;
        }

        // 위치가 없을 때만 위치 감지 또는 수동 선택 요청
        if (!window.locationManager.locationChangeEnabled) {
            updateLocationStatus('No location selected - Please select manually', 'warning');
            showNotification('Location Required', 'Please select your current location manually', 'warning');
            return;
        }

        // Location Change가 활성화되어 있고 위치가 없을 때만 GPS 감지
        updateLocationStatus('Detecting location...', 'loading');
        
        try {
            const result = await detectLocationAndCategory();
            if (result.success) {
                updateLocationStatus(
                    `${result.location.name} (${result.category === 'dormitory' ? 'Dormitory' : 'Factory'})`,
                    'success'
                );
                
                // 현재 위치에 체크인된 방문자 로드
                await this.loadCurrentVisitors();
                showModal('checkout-modal');
            } else {
                // 위치 감지 실패 시 수동 선택 옵션 제공
                window.locationManager.handleLocationDetectionFailure();
                showNotification('Location Required', 'Please select your current location', 'warning');
                
                // 위치를 감지할 수 없어도 모달은 표시 (빈 목록으로)
                await this.loadCurrentVisitors();
                showModal('checkout-modal');
            }
        } catch (error) {
            updateLocationStatus(error.message, 'error');
            showNotification('Location Error', error.message, 'error');
            
            // 오류가 발생해도 모달은 표시 (빈 목록으로)
            await this.loadCurrentVisitors();
            showModal('checkout-modal');
        }
    }

    /**
     * 현재 방문자 목록 로드 (현재 위치에 체크인된 방문자만)
     */
    async loadCurrentVisitors() {
        try {
            // 현재 감지된 위치 정보 확인
            if (!window.VisitorSystem.data.detectedCategory) {
                showNotification('Location Error', 'Please check location first', 'error');
                this.currentVisitors = [];
                this.renderCurrentVisitors();
                return;
            }

            // 현재 위치에 체크인된 방문자만 가져오기
            this.currentVisitors = await this.loadVisitorsForCurrentLocation();
            this.renderCurrentVisitors();
        } catch (error) {
            console.error('Failed to load current visitors:', error);
            showNotification('Error', 'Unable to load visitor list', 'error');
        }
    }

    /**
     * 현재 위치에 체크인된 방문자만 로드
     */
    async loadVisitorsForCurrentLocation() {
        try {
            // Supabase 클라이언트 확인
            if (!window.supabaseClient || !window.supabaseClient.client) {
                throw new Error('Supabase client not initialized');
            }
            
            const currentCategory = window.VisitorSystem.data.detectedCategory;
            console.log('Loading visitors for current location:', currentCategory);
            
            // 현재 위치 카테고리에 체크인된 방문자만 가져오기
            const { data: visitors, error } = await window.supabaseClient.client
                .from('visitors')
                .select('*')
                .eq('category', currentCategory)
                .is('checkout_time', null)
                .order('checkin_time', { ascending: false });
            
            if (error) {
                console.error('Error loading visitors:', error);
                throw error;
            }
            
            console.log(`Found ${visitors?.length || 0} visitors at current location (${currentCategory})`);
            if (visitors && visitors.length > 0) {
                console.log('Sample visitor data:', visitors[0]);
            }
            return visitors || [];
        } catch (error) {
            console.error('Failed to load visitors for current location:', error);
            return [];
        }
    }

    /**
     * 현재 방문자 목록 렌더링
     */
    renderCurrentVisitors() {
        const container = document.getElementById('current-visitors-list');
        const noVisitors = document.getElementById('no-visitors');
        
        if (this.currentVisitors.length === 0) {
            container.innerHTML = '';
            noVisitors.classList.remove('hidden');
        } else {
            noVisitors.classList.add('hidden');
            
            container.innerHTML = this.currentVisitors.map(visitor => `
                <div class="card p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                ${visitor.first_name.charAt(0)}
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg">${visitor.first_name} ${visitor.last_name}</h4>
                                <p class="text-sm text-gray-500">
                                    ${visitor.category === 'dormitory' ? 'Dormitory' : 'Factory'} • 
                                    ${formatDateTime(visitor.checkin_time)}
                                </p>
                                ${visitor.company ? `<p class="text-sm text-gray-600">${visitor.company}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 text-xs font-medium rounded-full ${visitor.category === 'dormitory' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}">
                                ${visitor.category === 'dormitory' ? 'Dormitory' : 'Factory'}
                            </span>
                            <span class="text-sm text-gray-500">
                                <i class="fas fa-clock"></i>
                                ${formatDateTime(visitor.checkin_time)}
                            </span>
                            <button 
                                class="btn btn-danger btn-sm" 
                                onclick="checkoutManager.checkoutVisitor(${visitor.id})"
                                title="Check out this visitor"
                            >
                                <i class="fas fa-sign-out-alt"></i>
                                Check Out
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 방문자 체크아웃 처리
     */
    async checkoutVisitor(visitorId) {
        const visitor = this.currentVisitors.find(v => v.id === visitorId);
        if (!visitor) {
            showNotification('Error', 'Visitor not found', 'error');
            return;
        }

        // 확인 대화상자
        if (!confirm(`Check out ${visitor.first_name} ${visitor.last_name}?`)) {
            return;
        }

        try {
            console.log(`Starting checkout process for visitor ID: ${visitorId}`);
            
            // 로딩 표시
            const checkoutBtn = document.querySelector(`button[onclick="checkoutManager.checkoutVisitor(${visitorId})"]`);
            const originalText = checkoutBtn.innerHTML;
            checkoutBtn.innerHTML = '<div class="loading"></div> Processing...';
            checkoutBtn.disabled = true;

            console.log(`Making API request to: /visitors/${visitorId}/checkout`);
            
            // API 호출
            const result = await apiRequest(`/visitors/${visitorId}/checkout`, {
                method: 'POST'
            });
            
            console.log('API request result:', result);

            // 성공 처리
            showNotification(
                'Check-out Complete', 
                `${visitor.first_name} ${visitor.last_name} has been checked out`, 
                'success'
            );

            // 목록 새로고침
            await this.loadCurrentVisitors();
            
            // 체크아웃 후 모달 닫기
            hideModal('checkout-modal');

        } catch (error) {
            console.error('Checkout error details:', error);
            showNotification('Check-out Failed', error.message, 'error');
        } finally {
            // 로딩 상태 해제
            const checkoutBtn = document.querySelector(`button[onclick="checkoutManager.checkoutVisitor(${visitorId})"]`);
            if (checkoutBtn) {
                checkoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Check Out';
                checkoutBtn.disabled = false;
            }
        }
    }

    /**
     * 체크아웃 모달 새로고침
     */
    async refreshCheckoutModal() {
        await this.loadCurrentVisitors();
    }

    /**
     * 일괄 체크아웃 처리
     */
    async batchCheckout() {
        if (this.currentVisitors.length === 0) {
            showNotification('No Visitors', 'No visitors to check out', 'info');
            return;
        }

        // 확인 대화상자
        const visitorCount = this.currentVisitors.length;
        const locationName = window.VisitorSystem.data.currentLocation?.name || 'this location';
        
        if (!confirm(`Check out all ${visitorCount} visitors at ${locationName}?`)) {
            return;
        }

        const button = document.getElementById('batch-checkout-btn');
        const originalText = button.innerHTML;
        
        try {
            // 로딩 상태
            button.innerHTML = '<div class="loading"></div> Processing...';
            button.disabled = true;

            console.log(`Starting batch checkout for ${visitorCount} visitors`);
            
            // Supabase 클라이언트 확인
            if (!window.supabaseClient || !window.supabaseClient.client) {
                throw new Error('Supabase client not initialized');
            }

            const checkoutTime = new Date().toISOString();
            const currentCategory = window.VisitorSystem.data.detectedCategory;
            
            console.log(`Batch checkout time: ${checkoutTime}, Category: ${currentCategory}`);

            // 현재 위치의 모든 방문자를 일괄 체크아웃
            const { data: updatedVisitors, error } = await window.supabaseClient.client
                .from('visitors')
                .update({ checkout_time: checkoutTime })
                .eq('category', currentCategory)
                .is('checkout_time', null)
                .select();

            if (error) {
                console.error('Batch checkout error:', error);
                throw error;
            }

            console.log(`Batch checkout successful: ${updatedVisitors?.length || 0} visitors checked out`);

            // 성공 처리
            showNotification(
                'Batch Check-out Complete', 
                `${updatedVisitors?.length || 0} visitors have been checked out`, 
                'success'
            );

            // 목록 새로고침
            await this.loadCurrentVisitors();

        } catch (error) {
            console.error('Batch checkout error details:', error);
            showNotification('Batch Check-out Failed', error.message, 'error');
        } finally {
            // 버튼 상태 복원
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    /**
     * 테스트용 직접 체크아웃 함수
     */
    async testDirectCheckout(visitorId) {
        try {
            console.log(`Testing direct checkout for visitor ID: ${visitorId}`);
            
            // Supabase 클라이언트 확인
            if (!window.supabaseClient || !window.supabaseClient.client) {
                throw new Error('Supabase client not initialized');
            }

            const checkoutTime = new Date().toISOString();
            console.log(`Checkout time: ${checkoutTime}`);
            
            // 직접 Supabase 호출
            const { data: visitor, error } = await window.supabaseClient.client
                .from('visitors')
                .update({ checkout_time: checkoutTime })
                .eq('id', visitorId)
                .select()
                .single();
            
            if (error) {
                console.error('Direct checkout error:', error);
                throw error;
            }
            
            console.log('Direct checkout successful:', visitor);
            return visitor;
        } catch (error) {
            console.error('Direct checkout failed:', error);
            throw error;
        }
    }
}

// 체크아웃 매니저 인스턴스 생성
window.checkoutManager = new CheckoutManager();
