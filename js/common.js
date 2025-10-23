/**
 * 방문자 관리 시스템 - 공통 JavaScript 유틸리티
 */

// 전역 변수
window.VisitorSystem = {
    config: {
        apiBaseUrl: '/api',
        defaultLocation: {
            latitude: 37.566500,
            longitude: 126.978000
        }
    },
    data: {
        currentVisitors: [],
        locations: [],
        frequentVisitors: [],
        currentLocation: null,
        detectedCategory: null
    }
};

/**
 * 알림 표시
 */
function showNotification(title, message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    notification.innerHTML = `
        <div class="notification-header">
            <i class="notification-icon ${icons[type]}" style="color: ${colors[type]}"></i>
            <span class="notification-title">${title}</span>
            <button class="notification-close" onclick="hideNotification(this)">&times;</button>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // 애니메이션으로 표시
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 자동 숨김
    setTimeout(() => {
        hideNotification(notification.querySelector('.notification-close'));
    }, duration);
}

/**
 * 알림 숨김
 */
function hideNotification(closeBtn) {
    const notification = closeBtn.closest('.notification');
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * 모달 표시
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 모달 숨김
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * 모달 외부 클릭 시 닫기
 */
function setupModalCloseOnOutsideClick() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/**
 * API 요청 헬퍼 (Supabase 기반)
 */
async function apiRequest(endpoint, options = {}) {
    const method = options.method || 'GET';
    const path = endpoint.replace('/api', '');
    
    console.log(`apiRequest called: ${method} ${endpoint}`);
    
    try {
        // Supabase 클라이언트가 초기화될 때까지 대기
        if (!window.supabaseClient || !window.supabaseClient.isInitialized) {
            console.log('Waiting for Supabase client initialization...');
            await new Promise(resolve => {
                const checkClient = () => {
                    if (window.supabaseClient && window.supabaseClient.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkClient, 100);
                    }
                };
                checkClient();
            });
        }
        
        // 쿼리 파라미터 제거하여 경로만 추출
        const cleanPath = path.split('?')[0];
        
        console.log(`Processing API request: ${method} ${cleanPath}`);
        
        switch (cleanPath) {
            case '/visitors':
                if (method === 'GET') {
                    return await getVisitorsFromSupabase();
                } else if (method === 'POST') {
                    const data = JSON.parse(options.body || '{}');
                    return await addVisitorToSupabase(data);
                }
                break;
                
            case '/visit-logs':
                if (method === 'GET') {
                    const url = new URL(window.location.origin + endpoint);
                    const filters = {
                        category: url.searchParams.get('category'),
                        visitor_search: url.searchParams.get('visitor_search'),
                        location_search: url.searchParams.get('location_search'),
                        purpose: url.searchParams.get('purpose'),
                        start_date: url.searchParams.get('start_date'),
                        end_date: url.searchParams.get('end_date'),
                        sort: url.searchParams.get('sort')
                    };
                    return await getVisitLogsFromSupabase(filters);
                }
                break;
                
            case '/locations':
                if (method === 'GET') {
                    return await getLocationsFromSupabase();
                } else if (method === 'POST') {
                    const data = JSON.parse(options.body || '{}');
                    return await addLocationToSupabase(data);
                }
                break;
                
            case '/frequent-visitors':
                if (method === 'GET') {
                    return await getFrequentVisitorsFromSupabase();
                } else if (method === 'POST') {
                    const data = JSON.parse(options.body || '{}');
                    return await addFrequentVisitorToSupabase(data);
                }
                break;
                
            case '/stats':
                if (method === 'GET') {
                    return await getStatsFromSupabase();
                }
                break;
                
            default:
                // 체크아웃이나 기타 동적 경로 처리
                console.log(`Checking dynamic path: ${cleanPath}`);
                if (cleanPath.startsWith('/visitors/') && cleanPath.endsWith('/checkout') && method === 'POST') {
                    const visitorId = parseInt(cleanPath.split('/')[2]);
                    console.log(`Checkout path matched! Visitor ID: ${visitorId}`);
                    return await checkoutVisitorFromSupabase(visitorId);
                }
                
                if (cleanPath.startsWith('/locations/') && method === 'PUT') {
                    const locationId = parseInt(cleanPath.split('/')[2]);
                    const data = JSON.parse(options.body || '{}');
                    return await updateLocationInSupabase(locationId, data);
                }
                
                if (cleanPath.startsWith('/locations/') && method === 'DELETE') {
                    const locationId = parseInt(cleanPath.split('/')[2]);
                    return await deleteLocationFromSupabase(locationId);
                }
                
                if (cleanPath.startsWith('/frequent-visitors/') && method === 'DELETE') {
                    const visitorId = parseInt(cleanPath.split('/')[2]);
                    return await deleteFrequentVisitorFromSupabase(visitorId);
                }
                break;
        }
        
        console.log(`No matching endpoint found for: ${cleanPath}`);
        throw new Error(`API endpoint not found: ${cleanPath}`);
        
    } catch (error) {
        console.error('Supabase API Error:', error);
        throw error;
    }
}

/**
 * 현재 위치 가져오기
 */
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('GPS is not supported by this browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                resolve(location);
            },
            (error) => {
                let errorMessage = 'Unable to get location';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timeout';
                        break;
                }
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

/**
 * 두 지점 간의 거리 계산 (Haversine 공식)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * 가장 가까운 위치 찾기
 */
function findNearestLocation(userLat, userLng, locations) {
    if (!locations || locations.length === 0) {
        return null;
    }
    
    let nearestLocation = null;
    let minDistance = Infinity;
    
    for (const location of locations) {
        const distance = calculateDistance(
            userLat, userLng,
            location.latitude, location.longitude
        );
        
        if (distance <= location.radius && distance < minDistance) {
            minDistance = distance;
            nearestLocation = location;
        }
    }
    
    return nearestLocation;
}

/**
 * 위치 감지 및 카테고리 설정
 */
async function detectLocationAndCategory() {
    try {
        // 현재 위치 가져오기
        const currentLocation = await getCurrentLocation();
        window.VisitorSystem.data.currentLocation = currentLocation;
        
        // 위치 목록 가져오기
        const locations = await apiRequest('/locations');
        window.VisitorSystem.data.locations = locations;
        
        // 가장 가까운 위치 찾기
        const nearestLocation = findNearestLocation(
            currentLocation.latitude,
            currentLocation.longitude,
            locations
        );
        
        if (nearestLocation) {
            window.VisitorSystem.data.detectedCategory = nearestLocation.category;
            return {
                success: true,
                location: nearestLocation,
                category: nearestLocation.category
            };
        } else {
            return {
                success: false,
                message: 'No registered locations nearby'
            };
        }
    } catch (error) {
        console.error('Location detection error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * 위치 상태 업데이트
 */
function updateLocationStatus(message, status = 'loading') {
    const statusElement = document.getElementById('location-status');
    const badgeElement = document.getElementById('location-badge');
    
    if (statusElement) {
        statusElement.textContent = message;
    }
    
    if (badgeElement) {
        badgeElement.className = 'location-badge';
        
        switch (status) {
            case 'loading':
                badgeElement.classList.add('badge-warning');
                badgeElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
                badgeElement.style.display = 'block';
                break;
            case 'success':
                badgeElement.classList.add('badge-success');
                badgeElement.innerHTML = '<i class="fas fa-check-circle"></i> Location Detected';
                badgeElement.style.display = 'block';
                break;
            case 'error':
                badgeElement.classList.add('badge-error');
                badgeElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Location Error';
                badgeElement.style.display = 'block';
                break;
            case 'warning':
                badgeElement.classList.add('badge-warning');
                badgeElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Manual Selection Required';
                badgeElement.style.display = 'block';
                break;
        }
    }
}

/**
 * 통계 업데이트
 */
async function updateStats() {
    try {
        const stats = await apiRequest('/stats');
        
        const dormitoryCountEl = document.getElementById('dormitory-count');
        const factoryCountEl = document.getElementById('factory-count');
        const totalCountEl = document.getElementById('total-count');
        
        if (dormitoryCountEl) dormitoryCountEl.textContent = stats.dormitory_count || 0;
        if (factoryCountEl) factoryCountEl.textContent = stats.factory_count || 0;
        if (totalCountEl) totalCountEl.textContent = stats.total_count || 0;
        
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

/**
 * 현재 방문자 목록 로드
 */
async function loadCurrentVisitors() {
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
        
        window.VisitorSystem.data.currentVisitors = visitors || [];
        return visitors || [];
    } catch (error) {
        console.error('Failed to load current visitors:', error);
        return [];
    }
}

/**
 * 자주 방문하는 방문자 목록 로드
 */
async function loadFrequentVisitors() {
    try {
        const visitors = await apiRequest('/frequent-visitors');
        window.VisitorSystem.data.frequentVisitors = visitors;
        return visitors;
    } catch (error) {
        console.error('Failed to load frequent visitors:', error);
        return [];
    }
}

/**
 * 날짜 포맷팅
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 시간 포맷팅
 */
function formatTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 폼 데이터 수집
 */
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value.trim();
    }
    
    return data;
}

/**
 * 폼 초기화
 */
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/**
 * 로딩 상태 표시
 */
function showLoading(elementId, text = '로딩 중...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="loading"></div> ${text}`;
    }
}

/**
 * 로딩 상태 숨김
 */
function hideLoading(elementId, originalContent = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = originalContent;
    }
}

/**
 * 페이지 초기화
 */
function initializePage() {
    // 모달 외부 클릭 시 닫기 설정
    setupModalCloseOnOutsideClick();
    
    // 위치 감지는 사용자가 체크인/체크아웃 버튼을 클릭할 때만 실행
    updateLocationStatus('Click Check-in or Check-out to detect location', 'warning');
}

/**
 * 자동 체크아웃 처리 (공장용)
 */
async function processAutoCheckout() {
    try {
        // Supabase 클라이언트 확인
        if (!window.supabaseClient || !window.supabaseClient.client) {
            console.log('Supabase not initialized, skipping auto checkout');
            return;
        }

        console.log('Processing auto checkout for factory visitors...');
        
        // 공장에 체크인된 방문자 중 00:00 이후 체크아웃되지 않은 방문자 조회
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const { data: factoryVisitors, error } = await window.supabaseClient.client
            .from('visitors')
            .select('*')
            .eq('category', 'factory')
            .is('checkout_time', null)
            .lt('checkin_time', today.toISOString());
        
        if (error) {
            console.error('Error fetching factory visitors for auto checkout:', error);
            return;
        }

        if (!factoryVisitors || factoryVisitors.length === 0) {
            console.log('No factory visitors to auto checkout');
            return;
        }

        console.log(`Found ${factoryVisitors.length} factory visitors to auto checkout`);

        // 각 방문자를 자동 체크아웃
        for (const visitor of factoryVisitors) {
            try {
                const checkoutTime = today.toISOString(); // 00:00으로 설정
                
                const { error: updateError } = await window.supabaseClient.client
                    .from('visitors')
                    .update({ checkout_time: checkoutTime })
                    .eq('id', visitor.id);
                
                if (updateError) {
                    console.error(`Failed to auto checkout visitor ${visitor.id}:`, updateError);
                } else {
                    console.log(`Auto checked out visitor: ${visitor.first_name} ${visitor.last_name}`);
                }
            } catch (visitorError) {
                console.error(`Error auto checking out visitor ${visitor.id}:`, visitorError);
            }
        }

        console.log('Auto checkout process completed');
    } catch (error) {
        console.error('Auto checkout process failed:', error);
    }
}

/**
 * 페이지 로드 시 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // 자동 체크아웃 처리 (공장용)
    processAutoCheckout();
});

// Supabase API 함수들
async function getVisitorsFromSupabase() {
    const { data, error } = await window.supabaseClient.client
        .from('visitors')
        .select('*')
        .is('checkout_time', null)
        .order('checkin_time', { ascending: false });
    
    if (error) throw error;
    return data || [];
}

async function addVisitorToSupabase(visitorData) {
    // Supabase 클라이언트 확인
    if (!window.supabaseClient || !window.supabaseClient.client) {
        throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await window.supabaseClient.client
        .from('visitors')
        .insert([{
            first_name: visitorData.first_name,
            last_name: visitorData.last_name,
            company: visitorData.company,
            phone: visitorData.phone,
            purpose: visitorData.purpose,
            category: visitorData.category,
            location_name: visitorData.location_name,
            checkin_time: new Date().toISOString(),
            checkout_time: null
        }])
        .select()
        .single();
    
    if (error) throw error;
    
    // visit_logs 테이블은 더 이상 사용하지 않음 (visitors 테이블에서 직접 조회)
    // 필요시 나중에 별도 로그 테이블을 만들 수 있음
    
    return data;
}

async function checkoutVisitorFromSupabase(visitorId) {
    const checkoutTime = new Date().toISOString();
    
    console.log(`Checking out visitor ${visitorId} at ${checkoutTime}`);
    
    // 방문자 체크아웃
    const { data: visitor, error: visitorError } = await window.supabaseClient.client
        .from('visitors')
        .update({ checkout_time: checkoutTime })
        .eq('id', visitorId)
        .select()
        .single();
    
    if (visitorError) {
        console.error('Checkout error:', visitorError);
        throw visitorError;
    }
    
    console.log('Checkout successful:', visitor);
    
    // visit_logs 테이블은 더 이상 사용하지 않음 (visitors 테이블에서 직접 조회)
    // 필요시 나중에 별도 로그 테이블을 만들 수 있음
    
    return visitor;
}

async function getVisitLogsFromSupabase(filters = {}) {
    // Supabase 클라이언트 확인
    if (!window.supabaseClient || !window.supabaseClient.client) {
        throw new Error('Supabase client not initialized');
    }
    
    console.log('Loading visit logs from visitors table with filters:', filters);
    
    let query = window.supabaseClient.client
        .from('visitors')
        .select('*');
    
    // 필터 적용
    if (filters.category && filters.category !== 'all') {
        console.log('Applying category filter:', filters.category);
        query = query.eq('category', filters.category);
    }
    
    if (filters.visitor_search) {
        console.log('Applying visitor search filter:', filters.visitor_search);
        query = query.or(`first_name.ilike.%${filters.visitor_search}%,last_name.ilike.%${filters.visitor_search}%`);
    }
    
    if (filters.location_search) {
        console.log('Applying location search filter:', filters.location_search);
        query = query.ilike('location_name', `%${filters.location_search}%`);
    }
    
    if (filters.purpose && filters.purpose !== 'all') {
        console.log('Applying purpose filter:', filters.purpose);
        query = query.eq('purpose', filters.purpose);
    }
    
    if (filters.start_date) {
        console.log('Applying start date filter:', filters.start_date);
        query = query.gte('checkin_time', filters.start_date);
    }
    
    if (filters.end_date) {
        const endDate = new Date(filters.end_date);
        endDate.setHours(23, 59, 59, 999);
        console.log('Applying end date filter:', endDate.toISOString());
        query = query.lte('checkin_time', endDate.toISOString());
    }
    
    // 정렬
    const sortField = filters.sort === 'name' ? 'first_name' : 
                     filters.sort === 'location' ? 'location_name' : 'checkin_time';
    const ascending = filters.sort === 'oldest';
    
    console.log('Applying sort:', sortField, ascending ? 'asc' : 'desc');
    query = query.order(sortField, { ascending });
    
    const { data, error } = await query;
    if (error) {
        console.error('Visit logs query error:', error);
        throw error;
    }
    
    console.log('Visit logs loaded from visitors table:', data?.length || 0, 'records');
    
    // 디버깅: 데이터가 없으면 테이블 상태 확인
    if (!data || data.length === 0) {
        console.log('No visit logs found. Checking visitors table status...');
        const { data: allData, error: allError } = await window.supabaseClient.client
            .from('visitors')
            .select('*')
            .limit(5);
        
        if (allError) {
            console.error('Error checking visitors table:', allError);
        } else {
            console.log('Total records in visitors table:', allData?.length || 0);
            if (allData && allData.length > 0) {
                console.log('Sample record:', allData[0]);
            }
        }
    }
    
    return data || [];
}

async function getLocationsFromSupabase() {
    const { data, error } = await window.supabaseClient.client
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
}

async function addLocationToSupabase(locationData) {
    const { data, error } = await window.supabaseClient.client
        .from('locations')
        .insert([{
            name: locationData.name,
            category: locationData.category,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            radius: locationData.radius
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function updateLocationInSupabase(locationId, updates) {
    const { data, error } = await window.supabaseClient.client
        .from('locations')
        .update(updates)
        .eq('id', locationId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function deleteLocationFromSupabase(locationId) {
    const { error } = await window.supabaseClient.client
        .from('locations')
        .delete()
        .eq('id', locationId);
    
    if (error) throw error;
    return true;
}

async function getFrequentVisitorsFromSupabase() {
    const { data, error } = await window.supabaseClient.client
        .from('frequent_visitors')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
}

async function addFrequentVisitorToSupabase(visitorData) {
    const { data, error } = await window.supabaseClient.client
        .from('frequent_visitors')
        .insert([{
            first_name: visitorData.first_name,
            last_name: visitorData.last_name,
            company: visitorData.company,
            phone: visitorData.phone
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function deleteFrequentVisitorFromSupabase(visitorId) {
    const { error } = await window.supabaseClient.client
        .from('frequent_visitors')
        .delete()
        .eq('id', visitorId);
    
    if (error) throw error;
    return true;
}

async function getStatsFromSupabase() {
    const { data: visitors, error: visitorsError } = await window.supabaseClient.client
        .from('visitors')
        .select('category')
        .is('checkout_time', null);
    
    if (visitorsError) throw visitorsError;
    
    const dormitoryCount = visitors.filter(v => v.category === 'dormitory').length;
    const factoryCount = visitors.filter(v => v.category === 'factory').length;
    const totalCount = visitors.length;
    
    return {
        dormitory_count: dormitoryCount,
        factory_count: factoryCount,
        total_count: totalCount
    };
}

/**
 * 전역 함수로 내보내기
 */
window.showNotification = showNotification;
window.hideNotification = hideNotification;
window.showModal = showModal;
window.hideModal = hideModal;
window.apiRequest = apiRequest;
window.getCurrentLocation = getCurrentLocation;
window.updateLocationStatus = updateLocationStatus;
window.updateStats = updateStats;
window.loadCurrentVisitors = loadCurrentVisitors;
window.loadFrequentVisitors = loadFrequentVisitors;
window.formatDateTime = formatDateTime;
window.formatTime = formatTime;
window.getFormData = getFormData;
window.resetForm = resetForm;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
