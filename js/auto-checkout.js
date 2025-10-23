/**
 * 자동 체크아웃 시스템
 */

class AutoCheckoutSystem {
    constructor() {
        this.checkoutTime = '01:00'; // 매일 오전 1시
        this.isRunning = false;
        this.lastCheckoutDate = null; // 마지막 체크아웃 날짜 추적
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        console.log('Auto checkout system initialized');
        this.startAutoCheckout();
    }

    /**
     * 자동 체크아웃 시작
     */
    startAutoCheckout() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('Starting auto checkout monitoring...');
        
        // 1분마다 시간 확인
        setInterval(() => {
            this.checkScheduledCheckout();
        }, 60000); // 1분 = 60000ms
    }

    /**
     * 예정된 체크아웃 시간 확인
     */
    checkScheduledCheckout() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM 형식
        const currentDate = now.toDateString(); // YYYY-MM-DD 형식
        
        // 오전 1시이고, 오늘 아직 체크아웃하지 않았을 때만 실행
        if (currentTime === this.checkoutTime && this.lastCheckoutDate !== currentDate) {
            console.log(`Scheduled checkout time reached: ${currentTime} on ${currentDate}`);
            this.performAutoCheckout();
            this.lastCheckoutDate = currentDate; // 체크아웃 완료 날짜 기록
        }
    }

    /**
     * 자동 체크아웃 실행
     */
    async performAutoCheckout() {
        try {
            console.log('Performing automatic checkout...');
            
            // Supabase 클라이언트 확인
            if (!window.supabaseClient || !window.supabaseClient.client) {
                console.log('Supabase not available, skipping auto checkout');
                return;
            }

            const checkoutTime = new Date().toISOString();
            
            // Factory 카테고리의 체크인된 방문자만 체크아웃 (Dormitory 제외)
            const { data: updatedVisitors, error } = await window.supabaseClient.client
                .from('visitors')
                .update({ checkout_time: checkoutTime })
                .eq('category', 'factory') // Factory만 대상
                .is('checkout_time', null)
                .select();

            if (error) {
                console.error('Auto checkout error:', error);
                return;
            }

            const count = updatedVisitors?.length || 0;
            console.log(`Auto checkout completed: ${count} factory visitors checked out at 01:00`);
            
            // 알림 표시 (페이지가 열려있는 경우)
            if (typeof showNotification === 'function') {
                showNotification(
                    'Auto Checkout (01:00)', 
                    `${count} factory visitors have been automatically checked out`, 
                    'info'
                );
            }

        } catch (error) {
            console.error('Auto checkout failed:', error);
        }
    }

    /**
     * 수동으로 즉시 체크아웃 실행
     */
    async manualCheckoutAll() {
        try {
            console.log('Manual checkout all visitors...');
            await this.performAutoCheckout();
        } catch (error) {
            console.error('Manual checkout failed:', error);
        }
    }
}

// 자동 체크아웃 시스템 시작
window.autoCheckoutSystem = new AutoCheckoutSystem();
