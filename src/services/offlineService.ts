// Offline data management service using Capacitor SQLite
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'CivicLensOfflineDB';
const DB_VERSION = 2; // Incremented for new tables

interface Report {
    id: string;
    [key: string]: any;
}

interface SyncMetadata {
    lastSyncTime: number;
    reportCount: number;
    store: string;
}

interface UserProfile {
    user_id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    image_url?: string;
}

interface WeatherData {
    latitude: number;
    longitude: number;
    temperature: number;
    condition: string;
    location_name: string;
}

interface LocationHistory {
    latitude: number;
    longitude: number;
    address: string;
}

interface ReportStats {
    pending_count: number;
    resolved_count: number;
    rejected_count: number;
    total_count: number;
}

// SQLite connection
let sqliteConnection: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;

// Initialize SQLite database
const initDB = async (): Promise<SQLiteDBConnection> => {
    if (db) return db;

    try {
        // Initialize SQLite connection
        sqliteConnection = new SQLiteConnection(CapacitorSQLite);

        // Web Platform: Ensure jeep-sqlite is present and ready
        if (Capacitor.getPlatform() === 'web') {
            // Dynamically import loader to avoid import errors on native
            const { defineCustomElements } = await import('jeep-sqlite/loader');
            defineCustomElements(window);

            let jeepEl = document.querySelector('jeep-sqlite');

            if (!jeepEl) {
                console.log('⚠️ jeep-sqlite element not found, injecting dynamically...');
                jeepEl = document.createElement('jeep-sqlite');
                document.body.appendChild(jeepEl);
            }

            // Wait for element to be ready
            await customElements.whenDefined('jeep-sqlite');

            // Short wait to ensure DOM update
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Check if database exists, if not create it
        const ret = await sqliteConnection.checkConnectionsConsistency();
        const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result;

        if (isConn) {
            db = await sqliteConnection.retrieveConnection(DB_NAME, false);
        } else {
            db = await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
        }

        await db.open();

        // Get current database version
        let currentVersion = 1;
        try {
            const versionResult = await db.query(`SELECT value FROM appSettings WHERE key = 'db_version'`);
            if (versionResult && versionResult.values && versionResult.values.length > 0) {
                currentVersion = parseInt(versionResult.values[0].value);
            }
        } catch (e) {
            // Table doesn't exist yet, it's a fresh install
        }

        // Create base tables (version 1)
        const createBaseTablesSQL = `
            CREATE TABLE IF NOT EXISTS homeReports (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS nearbyAlerts (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS myReports (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS mapReports (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                lastSyncTime INTEGER,
                reportCount INTEGER,
                store TEXT
            );
        `;

        await db.execute(createBaseTablesSQL);

        // Migration to version 2 - Add new tables
        if (currentVersion < 2) {
            console.log('🔄 Migrating database to version 2...');

            const createNewTablesSQL = `
                CREATE TABLE IF NOT EXISTS userProfile (
                    user_id TEXT PRIMARY KEY,
                    full_name TEXT,
                    email TEXT,
                    phone_number TEXT,
                    image_url TEXT,
                    created_at INTEGER,
                    updated_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS weatherCache (
                    location_key TEXT PRIMARY KEY,
                    latitude REAL,
                    longitude REAL,
                    temperature REAL,
                    condition TEXT,
                    location_name TEXT,
                    cached_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS locationHistory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    latitude REAL,
                    longitude REAL,
                    address TEXT,
                    timestamp INTEGER
                );

                CREATE TABLE IF NOT EXISTS appSettings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS reportStats (
                    id INTEGER PRIMARY KEY,
                    pending_count INTEGER,
                    resolved_count INTEGER,
                    rejected_count INTEGER,
                    total_count INTEGER,
                    last_updated INTEGER
                );
            `;

            await db.execute(createNewTablesSQL);

            // Create indexes for better performance
            const createIndexesSQL = `
                CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON locationHistory(timestamp DESC);
                CREATE INDEX IF NOT EXISTS idx_weather_cache_time ON weatherCache(cached_at);
            `;

            await db.execute(createIndexesSQL);

            // Update database version
            await db.execute(`
                INSERT OR REPLACE INTO appSettings (key, value, updated_at) 
                VALUES ('db_version', '2', ${Date.now()})
            `);

            console.log('✅ Database migrated to version 2');
        }

        console.log('✅ SQLite database initialized successfully');
        return db;
    } catch (error) {
        console.error('❌ Error initializing SQLite database:', error);
        throw error;
    }
};

// Generic function to cache reports to a specific table
const cacheToStore = async (tableName: string, reports: Report[]): Promise<void> => {
    try {
        const database = await initDB();

        // Clear existing reports in this table
        await database.execute(`DELETE FROM ${tableName}`);

        // Insert new reports
        if (reports.length > 0) {
            const values = reports.map(report =>
                `('${report.id}', '${JSON.stringify(report).replace(/'/g, "''")}', ${Date.now()})`
            ).join(',');

            const insertSQL = `INSERT INTO ${tableName} (id, data, created_at) VALUES ${values}`;
            await database.execute(insertSQL);
        }

        // Update metadata
        const metadataSQL = `
            INSERT OR REPLACE INTO metadata (key, lastSyncTime, reportCount, store) 
            VALUES ('sync_${tableName}', ${Date.now()}, ${reports.length}, '${tableName}')
        `;
        await database.execute(metadataSQL);

        console.log(`✅ Cached ${reports.length} reports to ${tableName}`);
    } catch (error) {
        console.error(`❌ Error caching to ${tableName}:`, error);
        throw error;
    }
};

// Generic function to get cached reports from a specific table
const getFromStore = async (tableName: string): Promise<Report[]> => {
    try {
        const database = await initDB();

        const result = await database.query(`SELECT data FROM ${tableName}`);

        if (result && result.values && result.values.length > 0) {
            const reports = result.values.map((row: any) => JSON.parse(row.data));
            console.log(`📖 Retrieved ${reports.length} reports from ${tableName}`);
            return reports;
        }

        return [];
    } catch (error) {
        console.error(`❌ Error getting from ${tableName}:`, error);
        return [];
    }
};

// ============= REPORT CACHING FUNCTIONS =============

// Home Reports
export const cacheHomeReports = async (reports: Report[]): Promise<void> => {
    return cacheToStore('homeReports', reports);
};

export const getCachedHomeReports = async (): Promise<Report[]> => {
    return getFromStore('homeReports');
};

// Nearby Alerts
export const cacheNearbyAlerts = async (reports: Report[]): Promise<void> => {
    return cacheToStore('nearbyAlerts', reports);
};

export const getCachedNearbyAlerts = async (): Promise<Report[]> => {
    return getFromStore('nearbyAlerts');
};

// My Reports
export const cacheMyReports = async (reports: Report[]): Promise<void> => {
    return cacheToStore('myReports', reports);
};

export const getCachedMyReports = async (): Promise<Report[]> => {
    return getFromStore('myReports');
};

// Map Reports
export const cacheMapReports = async (reports: Report[]): Promise<void> => {
    return cacheToStore('mapReports', reports);
};

export const getCachedMapReports = async (): Promise<Report[]> => {
    return getFromStore('mapReports');
};

// Legacy functions for backward compatibility
export const cacheReports = cacheNearbyAlerts;
export const getCachedReports = getCachedNearbyAlerts;

// Get a single cached report by ID from any table
export const getCachedReportById = async (id: string): Promise<Report | null> => {
    try {
        const tables = ['homeReports', 'nearbyAlerts', 'myReports', 'mapReports'];
        const database = await initDB();

        for (const tableName of tables) {
            const result = await database.query(
                `SELECT data FROM ${tableName} WHERE id = ?`,
                [id]
            );

            if (result && result.values && result.values.length > 0) {
                return JSON.parse(result.values[0].data);
            }
        }

        return null;
    } catch (error) {
        console.error('Error getting cached report:', error);
        return null;
    }
};

// ============= USER PROFILE FUNCTIONS =============

export const cacheUserProfile = async (profile: UserProfile): Promise<void> => {
    try {
        const database = await initDB();
        const now = Date.now();

        const sql = `
            INSERT OR REPLACE INTO userProfile 
            (user_id, full_name, email, phone_number, image_url, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await database.run(sql, [
            profile.user_id,
            profile.full_name || '',
            profile.email || '',
            profile.phone_number || '',
            profile.image_url || '',
            now,
            now
        ]);

        console.log('✅ Cached user profile');
    } catch (error) {
        console.error('❌ Error caching user profile:', error);
    }
};

export const getCachedUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const database = await initDB();
        const result = await database.query(`SELECT * FROM userProfile WHERE user_id = ?`, [userId]);

        if (result && result.values && result.values.length > 0) {
            const row = result.values[0];
            return {
                user_id: row.user_id,
                full_name: row.full_name,
                email: row.email,
                phone_number: row.phone_number,
                image_url: row.image_url
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Error getting cached user profile:', error);
        return null;
    }
};

// ============= WEATHER CACHE FUNCTIONS =============

export const cacheWeatherData = async (weather: WeatherData): Promise<void> => {
    try {
        const database = await initDB();
        const locationKey = `${weather.latitude.toFixed(4)}_${weather.longitude.toFixed(4)}`;

        const sql = `
            INSERT OR REPLACE INTO weatherCache 
            (location_key, latitude, longitude, temperature, condition, location_name, cached_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await database.run(sql, [
            locationKey,
            weather.latitude,
            weather.longitude,
            weather.temperature,
            weather.condition,
            weather.location_name,
            Date.now()
        ]);

        console.log('✅ Cached weather data');
    } catch (error) {
        console.error('❌ Error caching weather:', error);
    }
};

export const getCachedWeatherData = async (latitude: number, longitude: number): Promise<WeatherData | null> => {
    try {
        const database = await initDB();
        const locationKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;

        // Weather cache valid for 1 hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        const result = await database.query(
            `SELECT * FROM weatherCache WHERE location_key = ? AND cached_at > ?`,
            [locationKey, oneHourAgo]
        );

        if (result && result.values && result.values.length > 0) {
            const row = result.values[0];
            console.log('📖 Retrieved cached weather data');
            return {
                latitude: row.latitude,
                longitude: row.longitude,
                temperature: row.temperature,
                condition: row.condition,
                location_name: row.location_name
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Error getting cached weather:', error);
        return null;
    }
};

// ============= LOCATION HISTORY FUNCTIONS =============

export const addLocationHistory = async (location: LocationHistory): Promise<void> => {
    try {
        const database = await initDB();

        const sql = `
            INSERT INTO locationHistory (latitude, longitude, address, timestamp) 
            VALUES (?, ?, ?, ?)
        `;

        await database.run(sql, [
            location.latitude,
            location.longitude,
            location.address,
            Date.now()
        ]);

        // Keep only last 20 locations
        await database.execute(`
            DELETE FROM locationHistory 
            WHERE id NOT IN (
                SELECT id FROM locationHistory ORDER BY timestamp DESC LIMIT 20
            )
        `);

        console.log('✅ Added location to history');
    } catch (error) {
        console.error('❌ Error adding location history:', error);
    }
};

export const getLocationHistory = async (limit: number = 10): Promise<LocationHistory[]> => {
    try {
        const database = await initDB();
        const result = await database.query(
            `SELECT latitude, longitude, address FROM locationHistory ORDER BY timestamp DESC LIMIT ?`,
            [limit]
        );

        if (result && result.values && result.values.length > 0) {
            return result.values.map((row: any) => ({
                latitude: row.latitude,
                longitude: row.longitude,
                address: row.address
            }));
        }

        return [];
    } catch (error) {
        console.error('❌ Error getting location history:', error);
        return [];
    }
};

// ============= REPORT STATISTICS FUNCTIONS =============

export const cacheReportStats = async (stats: ReportStats): Promise<void> => {
    try {
        const database = await initDB();

        const sql = `
            INSERT OR REPLACE INTO reportStats 
            (id, pending_count, resolved_count, rejected_count, total_count, last_updated) 
            VALUES (1, ?, ?, ?, ?, ?)
        `;

        await database.run(sql, [
            stats.pending_count,
            stats.resolved_count,
            stats.rejected_count || 0,
            stats.total_count,
            Date.now()
        ]);

        console.log('✅ Cached report statistics');
    } catch (error) {
        console.error('❌ Error caching report stats:', error);
    }
};

export const getCachedReportStats = async (): Promise<ReportStats | null> => {
    try {
        const database = await initDB();
        const result = await database.query(`SELECT * FROM reportStats WHERE id = 1`);

        if (result && result.values && result.values.length > 0) {
            const row = result.values[0];
            return {
                pending_count: row.pending_count,
                resolved_count: row.resolved_count,
                rejected_count: row.rejected_count,
                total_count: row.total_count
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Error getting cached report stats:', error);
        return null;
    }
};

// ============= APP SETTINGS FUNCTIONS =============

export const saveSetting = async (key: string, value: string): Promise<void> => {
    try {
        const database = await initDB();
        const sql = `INSERT OR REPLACE INTO appSettings (key, value, updated_at) VALUES (?, ?, ?)`;
        await database.run(sql, [key, value, Date.now()]);
        console.log(`✅ Saved setting: ${key}`);
    } catch (error) {
        console.error('❌ Error saving setting:', error);
    }
};

export const getSetting = async (key: string): Promise<string | null> => {
    try {
        const database = await initDB();
        const result = await database.query(`SELECT value FROM appSettings WHERE key = ?`, [key]);

        if (result && result.values && result.values.length > 0) {
            return result.values[0].value;
        }

        return null;
    } catch (error) {
        console.error('❌ Error getting setting:', error);
        return null;
    }
};

// ============= UTILITY FUNCTIONS =============

// Get last sync metadata
export const getLastSyncTime = async (tableName?: string): Promise<number | null> => {
    try {
        const database = await initDB();
        const key = tableName ? `sync_${tableName}` : 'sync_nearbyAlerts';

        const result = await database.query(
            `SELECT lastSyncTime FROM metadata WHERE key = ?`,
            [key]
        );

        if (result && result.values && result.values.length > 0) {
            return result.values[0].lastSyncTime;
        }

        return null;
    } catch (error) {
        console.error('Error getting last sync time:', error);
        return null;
    }
};

// Clear all cached data
export const clearOfflineCache = async (): Promise<void> => {
    try {
        const database = await initDB();

        await database.execute(`
            DELETE FROM homeReports;
            DELETE FROM nearbyAlerts;
            DELETE FROM myReports;
            DELETE FROM mapReports;
            DELETE FROM metadata;
            DELETE FROM userProfile;
            DELETE FROM weatherCache;
            DELETE FROM locationHistory;
            DELETE FROM reportStats;
        `);

        console.log('✅ Cleared all offline cache');
    } catch (error) {
        console.error('Error clearing offline cache:', error);
        throw error;
    }
};

// Close database connection (call when app closes)
export const closeDatabase = async (): Promise<void> => {
    try {
        if (db) {
            await db.close();
            db = null;
        }
        if (sqliteConnection) {
            await sqliteConnection.closeConnection(DB_NAME, false);
        }
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('Error closing database:', error);
    }
};
