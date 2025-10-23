// Supabase Configuration File
class DatabaseConfig {
    constructor() {
        // Supabase settings
        this.supabaseUrl = 'https://xqjyhoxtahfvfvedoljz.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxanlob3h0YWhmdmZ2ZWRvbGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzM3MzMsImV4cCI6MjA2MTcwOTczM30.unZyS_3aBRq2F0vv62jquTAy7cX40mE5nZYDRajhNqw';
        
        // Database table names
        this.tables = {
            visitors: 'visitors',
            visitLogs: 'visit_logs',
            locations: 'locations',
            frequentVisitors: 'frequent_visitors'
        };
        
        // Local storage keys
        this.storageKeys = {
            currentVisitors: 'visitorSystem_currentVisitors',
            visitLogs: 'visitorSystem_visitLogs',
            locations: 'visitorSystemLocations',
            frequentVisitors: 'visitorSystemFrequentVisitors'
        };
        
        // Sync settings
        this.sync = {
            enabled: true, // Set to true to sync with Supabase
            autoSync: true, // Auto sync enabled
            syncInterval: 30000, // Sync every 30 seconds
            batchSize: 50 // Number of records to process at once
        };
    }
    
    // Initialize Supabase client
    initSupabase() {
        // Wait for Supabase to load
        if (typeof supabase === 'undefined') {
            console.warn('Supabase not loaded yet. Retrying in a moment...');
            return null;
        }
        
        try {
            const client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('Supabase client created successfully');
            return client;
        } catch (error) {
            console.error('Failed to create Supabase client:', error);
            return null;
        }
    }
    
    // Update configuration
    updateConfig(newConfig) {
        Object.assign(this, newConfig);
        localStorage.setItem('visitorSystem_config', JSON.stringify(this));
    }
    
    // Load configuration
    loadConfig() {
        const savedConfig = localStorage.getItem('visitorSystem_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            Object.assign(this, config);
        }
    }
    
    // Save configuration
    saveConfig() {
        localStorage.setItem('visitorSystem_config', JSON.stringify(this));
    }
}

// Global configuration instance
window.dbConfig = new DatabaseConfig();
window.dbConfig.loadConfig();