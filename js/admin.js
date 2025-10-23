/**
 * 방문자 관리 시스템 - 관리자 기능
 */

class AdminManager {
    constructor() {
        this.currentVisitors = [];
        this.visitLogs = [];
        this.locations = [];
        this.frequentVisitors = [];
        this.setupEventListeners();
        this.initializePage();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 새로고침 버튼
        document.getElementById('refresh-btn').addEventListener('click', async () => {
            await this.refreshAllData();
        });

        // 자동 체크아웃 버튼
        document.getElementById('auto-checkout-btn').addEventListener('click', async () => {
            await this.manualAutoCheckout();
        });

        // 로그아웃 버튼
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // 필터 관련 이벤트
        document.getElementById('apply-filters').addEventListener('click', async () => {
            await this.loadVisitLogs();
        });

        document.getElementById('clear-filters').addEventListener('click', async () => {
            await this.clearFilters();
        });

        document.getElementById('export-logs').addEventListener('click', async () => {
            await this.exportLogs();
        });

        // 위치 관리 이벤트
        document.getElementById('add-location-btn').addEventListener('click', () => {
            this.showAddLocationModal();
        });

        document.getElementById('add-location-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddLocation();
        });

        // 자주 방문하는 방문자 이벤트
        document.getElementById('add-frequent-visitor-btn').addEventListener('click', () => {
            this.addFrequentVisitor();
        });

        // 필터 자동 적용
        ['category-filter', 'visitor-search', 'location-search', 'purpose-filter', 'start-date', 'end-date', 'sort-filter'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.loadVisitLogs();
            });
        });

        ['visitor-search', 'location-search'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.loadVisitLogs();
            });
        });
    }

    /**
     * 페이지 초기화
     */
    async initializePage() {
        try {
            // 관리자 로그인 확인
            if (!this.checkAdminAccess()) {
                return;
            }

            // Supabase 클라이언트 초기화 대기
            await this.waitForSupabaseClient();
            
            // 모든 데이터 로드
            await this.loadAllData();
        } catch (error) {
            console.error('Failed to initialize admin page:', error);
            showNotification('Initialization Error', error.message, 'error');
        }
    }

    /**
     * 관리자 접근 권한 확인
     */
    checkAdminAccess() {
        // URL 파라미터로 로그인 상태 확인 (간단한 방법)
        const urlParams = new URLSearchParams(window.location.search);
        const isAdmin = urlParams.get('admin') === 'true';
        
        if (!isAdmin) {
            // 로그인하지 않은 경우 메인 페이지로 리다이렉트
            showNotification('Access Denied', 'Please login as admin first', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return false;
        }
        
        return true;
    }

    /**
     * 로그아웃
     */
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            showNotification('Logged Out', 'You have been logged out', 'info');
            // 메인 페이지로 리다이렉트 (로그인 상태 제거)
            window.location.href = 'index.html';
        }
    }
    
    /**
     * Supabase 클라이언트 초기화 대기
     */
    async waitForSupabaseClient() {
        let attempts = 0;
        const maxAttempts = 50; // 5초 대기 (100ms * 50)
        
        while (attempts < maxAttempts) {
            if (window.supabaseClient && window.supabaseClient.client && window.supabaseClient.isInitialized) {
                console.log('Supabase client ready');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Supabase client initialization timeout');
    }

    /**
     * 수동 자동 체크아웃 실행
     */
    async manualAutoCheckout() {
        const button = document.getElementById('auto-checkout-btn');
        const originalText = button.innerHTML;
        
        try {
            // 로딩 상태
            button.innerHTML = '<div class="loading"></div> Processing...';
            button.disabled = true;

            // 자동 체크아웃 실행
            await this.executeAutoCheckout();
            
            // 성공 메시지
            showNotification('Auto Checkout Complete', 'Factory visitors have been auto checked out', 'success');
            
            // 데이터 새로고침
            await this.refreshAllData();
            
        } catch (error) {
            console.error('Manual auto checkout failed:', error);
            showNotification('Auto Checkout Failed', error.message, 'error');
        } finally {
            // 버튼 상태 복원
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    /**
     * 자동 체크아웃 실행
     */
    async executeAutoCheckout() {
        try {
            // Supabase 클라이언트 확인
            if (!window.supabaseClient || !window.supabaseClient.client) {
                throw new Error('Supabase client not initialized');
            }

            console.log('Executing manual auto checkout for factory visitors...');
            
            // Factory 카테고리의 체크인된 방문자 중 체크아웃되지 않은 방문자 조회
            const { data: factoryVisitors, error } = await window.supabaseClient.client
                .from('visitors')
                .select('*')
                .eq('category', 'factory')
                .is('checkout_time', null);
            
            if (error) {
                throw new Error(`Failed to fetch factory visitors: ${error.message}`);
            }

            if (!factoryVisitors || factoryVisitors.length === 0) {
                showNotification('No Visitors', 'No factory visitors found to auto checkout', 'info');
                return;
            }

            console.log(`Found ${factoryVisitors.length} factory visitors to auto checkout`);

            // Factory 방문자들을 일괄 체크아웃
            const checkoutTime = new Date().toISOString();
            
            const { data: updatedVisitors, error: updateError } = await window.supabaseClient.client
                .from('visitors')
                .update({ checkout_time: checkoutTime })
                .eq('category', 'factory')
                .is('checkout_time', null)
                .select();

            if (updateError) {
                throw new Error(`Failed to checkout factory visitors: ${updateError.message}`);
            }

            const successCount = updatedVisitors?.length || 0;

            console.log(`Manual auto checkout completed: ${successCount} factory visitors checked out`);

        } catch (error) {
            console.error('Auto checkout execution failed:', error);
            throw error;
        }
    }

    /**
     * 모든 데이터 로드
     */
    async loadAllData() {
        await Promise.all([
            this.loadCurrentVisitors(),
            this.loadVisitLogs(),
            this.loadLocations(),
            this.loadFrequentVisitors(),
            this.updateStats()
        ]);
    }

    /**
     * 모든 데이터 새로고침
     */
    async refreshAllData() {
        const refreshBtn = document.getElementById('refresh-btn');
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<div class="loading"></div> Refreshing...';
        refreshBtn.disabled = true;

        try {
            await this.loadAllData();
            showNotification('Refresh Complete', 'All data has been refreshed', 'success');
        } catch (error) {
            showNotification('Refresh Failed', error.message, 'error');
        } finally {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }

    /**
     * 현재 방문자 목록 로드
     */
    async loadCurrentVisitors() {
        try {
            // Supabase 클라이언트 확인
            if (!window.supabaseClient || !window.supabaseClient.client) {
                throw new Error('Supabase client not initialized');
            }
            
            // 체크아웃되지 않은 방문자만 가져오기
            const { data: visitors, error } = await window.supabaseClient.client
                .from('visitors')
                .select('*')
                .is('checkout_time', null)
                .order('checkin_time', { ascending: false });
            
            if (error) throw error;
            
            this.currentVisitors = visitors || [];
            this.renderCurrentVisitors();
        } catch (error) {
            console.error('Failed to load current visitors:', error);
            this.currentVisitors = [];
            this.renderCurrentVisitors();
        }
    }

    /**
     * 현재 방문자 목록 렌더링
     */
    renderCurrentVisitors() {
        const container = document.getElementById('current-visitors-grid');
        const noVisitors = document.getElementById('no-current-visitors');
        
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
                                <h4 class="font-semibold">${visitor.first_name} ${visitor.last_name}</h4>
                                <p class="text-sm text-gray-500">
                                    ${visitor.category === 'dormitory' ? 'Dormitory' : 'Factory'} • 
                                    ${formatDateTime(visitor.checkin_time)}
                                </p>
                                ${visitor.company ? `<p class="text-sm text-gray-600">${visitor.company}</p>` : ''}
                            </div>
                        </div>
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${visitor.category === 'dormitory' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}">
                            ${visitor.category === 'dormitory' ? 'Dormitory' : 'Factory'}
                        </span>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 방문 기록 로드
     */
    async loadVisitLogs() {
        try {
            const filters = this.getFilterValues();
            this.visitLogs = await apiRequest(`/visit-logs?${new URLSearchParams(filters).toString()}`);
            this.renderVisitLogs();
        } catch (error) {
            console.error('Failed to load visit logs:', error);
        }
    }

    /**
     * 필터 값 가져오기
     */
    getFilterValues() {
        return {
            category: document.getElementById('category-filter').value,
            visitor_search: document.getElementById('visitor-search').value,
            location_search: document.getElementById('location-search').value,
            purpose: document.getElementById('purpose-filter').value,
            start_date: document.getElementById('start-date').value,
            end_date: document.getElementById('end-date').value,
            sort: document.getElementById('sort-filter').value
        };
    }

    /**
     * 방문 기록 렌더링
     */
    renderVisitLogs() {
        const tbody = document.getElementById('logs-table-body');
        const countEl = document.getElementById('log-count');
        
        countEl.textContent = this.visitLogs.length;
        
        if (this.visitLogs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500">
                        <i class="fas fa-clipboard-list text-4xl mb-2 block"></i>
                        No records to display.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = this.visitLogs.map(log => {
                const isCheckedOut = log.checkout_time !== null;
                const statusColor = isCheckedOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                const statusText = isCheckedOut ? 'Checked Out' : 'Checked In';
                
                return `
                <tr class="hover:bg-gray-50">
                    <td class="font-semibold">${log.first_name} ${log.last_name}</td>
                    <td>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${log.category === 'dormitory' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}">
                            ${log.category === 'dormitory' ? 'Dormitory' : 'Factory'}
                        </span>
                    </td>
                    <td>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="text-sm">${formatDateTime(log.checkin_time)}</td>
                    <td class="text-sm">${log.checkout_time ? formatDateTime(log.checkout_time) : '-'}</td>
                    <td class="text-sm">${log.company || '-'}</td>
                    <td class="text-sm">${log.phone || '-'}</td>
                    <td class="text-sm">${log.purpose || '-'}</td>
                </tr>
            `;
            }).join('');
        }
    }

    /**
     * 필터 초기화
     */
    clearFilters() {
        document.getElementById('category-filter').value = 'all';
        document.getElementById('visitor-search').value = '';
        document.getElementById('location-search').value = '';
        document.getElementById('purpose-filter').value = 'all';
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        document.getElementById('sort-filter').value = 'newest';
        this.loadVisitLogs();
    }

    /**
     * 로그 내보내기
     */
    exportLogs() {
        const csvContent = this.convertToCSV(this.visitLogs);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `visit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('내보내기 완료', 'CSV 파일이 다운로드되었습니다', 'success');
    }

    /**
     * CSV 변환
     */
    convertToCSV(logs) {
        const headers = ['방문자', '구분', '상태', '체크인 시간', '체크아웃 시간', '회사', '전화번호', '목적'];
        const rows = logs.map(log => [
            `${log.first_name} ${log.last_name}`,
            log.category === 'dormitory' ? '기숙사' : '공장',
            log.action === 'checkin' ? '체크인' : '체크아웃',
            formatDateTime(log.checkin_time),
            formatDateTime(log.checkout_time),
            log.company || '',
            log.phone || '',
            log.purpose || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        return '\uFEFF' + csvContent; // BOM 추가
    }

    /**
     * 위치 목록 로드
     */
    async loadLocations() {
        try {
            this.locations = await apiRequest('/locations');
            this.renderLocations();
        } catch (error) {
            console.error('Failed to load locations:', error);
        }
    }

    /**
     * 위치 목록 렌더링
     */
    renderLocations() {
        const container = document.getElementById('locations-list');
        
        if (this.locations.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-map-marker-alt text-4xl mb-4"></i>
                    <p>등록된 위치가 없습니다.</p>
                    <p class="text-sm">새 위치를 추가하여 시작하세요.</p>
                </div>
            `;
        } else {
            container.innerHTML = this.locations.map(location => `
                <div class="card p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-blue-500"></i>
                            <h4 class="font-semibold">${location.name}</h4>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${location.category === 'dormitory' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}">
                                ${location.category === 'dormitory' ? '기숙사' : '공장'}
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="adminManager.editLocation(${location.id})" class="text-blue-500 hover:text-blue-700">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="adminManager.deleteLocation(${location.id})" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-2 gap-2 text-sm">
                        <div>
                            <span class="text-gray-500">Latitude:</span>
                            <span class="font-medium">${location.latitude}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Longitude:</span>
                            <span class="font-medium">${location.longitude}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Radius:</span>
                            <span class="font-medium">${location.radius}km</span>
                        </div>
                        <div>
                            <button onclick="adminManager.setCurrentLocation(${location.id})" class="text-blue-500 hover:text-blue-700 text-xs">
                                <i class="fas fa-crosshairs mr-1"></i>Set Current Location
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 위치 추가 모달 표시
     */
    showAddLocationModal() {
        showModal('add-location-modal');
    }

    /**
     * 위치 추가 처리
     */
    async handleAddLocation() {
        const formData = getFormData('add-location-form');
        
        try {
            await apiRequest('/locations', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            showNotification('위치 추가 완료', `"${formData.name}" 위치가 추가되었습니다`, 'success');
            hideModal('add-location-modal');
            resetForm('add-location-form');
            await this.loadLocations();
        } catch (error) {
            showNotification('위치 추가 실패', error.message, 'error');
        }
    }

    /**
     * 위치 수정
     */
    async editLocation(locationId) {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) return;
        
        const newName = prompt('위치 이름을 수정하세요:', location.name);
        if (newName && newName.trim() !== location.name) {
            try {
                await apiRequest(`/locations/${locationId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name: newName.trim() })
                });
                
                showNotification('위치 수정 완료', '위치 이름이 수정되었습니다', 'success');
                await this.loadLocations();
            } catch (error) {
                showNotification('위치 수정 실패', error.message, 'error');
            }
        }
    }

    /**
     * 위치 삭제
     */
    async deleteLocation(locationId) {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) return;
        
        if (confirm(`"${location.name}" 위치를 삭제하시겠습니까?`)) {
            try {
                await apiRequest(`/locations/${locationId}`, {
                    method: 'DELETE'
                });
                
                showNotification('위치 삭제 완료', '위치가 삭제되었습니다', 'success');
                await this.loadLocations();
            } catch (error) {
                showNotification('위치 삭제 실패', error.message, 'error');
            }
        }
    }

    /**
     * 현재 위치로 설정
     */
    async setCurrentLocation(locationId) {
        if (!navigator.geolocation) {
            showNotification('GPS Error', 'GPS is not supported by this browser', 'error');
            return;
        }
        
        showNotification('Detecting Location...', 'Getting current location to set latitude and longitude', 'info');
        
        try {
            const position = await getCurrentLocation();
            
            await apiRequest(`/locations/${locationId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    latitude: position.latitude,
                    longitude: position.longitude
                })
            });
            
            showNotification('Location Set Complete', 'Latitude and longitude have been set to current location', 'success');
            await this.loadLocations();
        } catch (error) {
            showNotification('Location Set Failed', error.message, 'error');
        }
    }

    /**
     * 자주 방문하는 방문자 목록 로드
     */
    async loadFrequentVisitors() {
        try {
            this.frequentVisitors = await apiRequest('/frequent-visitors');
            this.renderFrequentVisitors();
        } catch (error) {
            console.error('Failed to load frequent visitors:', error);
        }
    }

    /**
     * 자주 방문하는 방문자 목록 렌더링
     */
    renderFrequentVisitors() {
        const container = document.getElementById('frequent-visitors-list');
        
        if (this.frequentVisitors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-star text-2xl mb-2"></i>
                    <p>등록된 자주 방문자가 없습니다.</p>
                </div>
            `;
        } else {
            container.innerHTML = this.frequentVisitors.map(visitor => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-star text-yellow-500"></i>
                        <span class="font-medium">${visitor.first_name} ${visitor.last_name}</span>
                        <span class="text-sm text-gray-500">${visitor.company || 'No company info'}</span>
                    </div>
                    <button onclick="adminManager.deleteFrequentVisitor(${visitor.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    /**
     * 자주 방문하는 방문자 추가
     */
    async addFrequentVisitor() {
        const firstName = document.getElementById('frequent-first-name').value.trim();
        const lastName = document.getElementById('frequent-last-name').value.trim();
        const company = document.getElementById('frequent-company').value.trim();
        const phone = document.getElementById('frequent-phone').value.trim();
        
        if (!firstName || !lastName) {
            showNotification('입력 오류', '성과 이름은 필수입니다', 'error');
            return;
        }
        
        try {
            await apiRequest('/frequent-visitors', {
                method: 'POST',
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    company: company,
                    phone: phone
                })
            });
            
            showNotification('자주 방문자 추가 완료', `${firstName} ${lastName}님이 추가되었습니다`, 'success');
            
            // 폼 초기화
            document.getElementById('frequent-first-name').value = '';
            document.getElementById('frequent-last-name').value = '';
            document.getElementById('frequent-company').value = '';
            document.getElementById('frequent-phone').value = '';
            
            await this.loadFrequentVisitors();
        } catch (error) {
            showNotification('자주 방문자 추가 실패', error.message, 'error');
        }
    }

    /**
     * 자주 방문하는 방문자 삭제
     */
    async deleteFrequentVisitor(visitorId) {
        if (confirm('이 자주 방문자를 삭제하시겠습니까?')) {
            try {
                await apiRequest(`/frequent-visitors/${visitorId}`, {
                    method: 'DELETE'
                });
                
                showNotification('자주 방문자 삭제 완료', '자주 방문자가 삭제되었습니다', 'success');
                await this.loadFrequentVisitors();
            } catch (error) {
                showNotification('자주 방문자 삭제 실패', error.message, 'error');
            }
        }
    }

    /**
     * 통계 업데이트
     */
    async updateStats() {
        try {
            const stats = await apiRequest('/stats');
            
            document.getElementById('dormitory-count').textContent = stats.dormitory_count || 0;
            document.getElementById('factory-count').textContent = stats.factory_count || 0;
            document.getElementById('total-count').textContent = stats.total_count || 0;
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }
}

// 관리자 매니저 인스턴스 생성
window.adminManager = new AdminManager();
