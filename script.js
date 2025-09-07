/**
 * Dynamic Button Link Manager
 * Loads button configuration from config.json and updates button links
 */
class ButtonManager {
    constructor() {
        this.SHEETDB_API = 'https://sheetdb.io/api/v1/ixretu8my1aw8';
        this.buttons = {
            primary: { 
                text: "Get Started", 
                url: "#", 
                column: "btn1",
                displayText: "Get Started"
            },
            secondary: { 
                text: "Learn More", 
                url: "#", 
                column: "btn2",
                displayText: "Learn More"
            },
            accent: { 
                text: "Join Now", 
                url: "#", 
                column: "btn3",
                displayText: "Join Now"
            }
        };
        this.init();
    }

    /**
     * Initialize the button manager
     */
    async init() {
        try {
            await this.loadButtonData();
            // Only update buttons if we're not on the admin page
            if (!window.location.pathname.endsWith('admin.html')) {
                this.updateButtons();
                // Check for updates every 5 minutes
                setInterval(() => this.loadButtonData(), 5 * 60 * 1000);
            }
        } catch (error) {
            console.error('Failed to initialize ButtonManager:', error);
            this.loadFromLocalStorage();
        }
        
        // Add click handlers only if buttons exist
        if (!window.location.pathname.endsWith('admin.html')) {
            document.querySelectorAll('.btn').forEach(button => {
                const type = button.className.split(' ')[1];
                if (this.buttons[type]) {
                    button.href = this.buttons[type].url;
                    button.textContent = this.buttons[type].text;
                    button.addEventListener('click', (e) => {
                        if (this.buttons[type].url === '#') {
                            e.preventDefault();
                            console.log(`Button ${type} clicked but no URL set`);
                        }
                    });
                }
            });
        }
    }

    /**
     * Load button data from Google Sheets
     */
    /**
     * Normalize button names for matching
     * @param {string} name - The name to normalize
     * @returns {string} The normalized name
     */
    normalizeButtonName(name) {
        return name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    }
    
    async loadConfig() {
        try {
            // Try to load from SheetDB first
            console.log('Loading data from SheetDB...');
            const response = await fetch(this.SHEETDB_API);
            if (!response.ok) {
                throw new Error(`Failed to load from SheetDB: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('SheetDB response:', data);
            
            if (data && data.length > 0) {
                // Track if we found any updates
                let hasUpdates = false;
                
                // Get the first row which contains our button URLs
                const row = data[0];
                console.log('Processing row:', row);
                
                // Update each button's URL from the corresponding column
                Object.values(this.buttons).forEach(button => {
                    if (row[button.column] !== undefined) {
                        console.log(`Updating ${button.text} URL from column ${button.column}:`, row[button.column]);
                        button.url = row[button.column];
                        hasUpdates = true;
                    } else {
                        console.warn(`Column ${button.column} not found in SheetDB`);
                    }
                });
                
                if (hasUpdates) {
                    // Save to localStorage for offline use
                    localStorage.setItem('buttonData', JSON.stringify(this.buttons));
                    console.log('Updated buttons from SheetDB:', this.buttons);
                    return true;
                }
                
                console.log('No button data found in SheetDB');
                return false;
            }
            
            console.log('No data found in SheetDB');
            return false;
        } catch (error) {
            console.error('Error loading config from SheetDB:', error);
            return this.loadFromLocalStorage();
        }
    }
    
    loadButtonData = async () => {
        try {
            // First try to load from SheetDB
            const response = await fetch(`${this.SHEETDB_API}?sheet=Sheet1`);
            if (response.ok) {
                const data = await response.json();
                console.log('Raw data from SheetDB:', data);
                
                if (data && data.length > 0) {
                    // Get the first row which contains all button data
                    const row = data[0];
                    
                    // Update each button's URL based on its column mapping
                    Object.entries(this.buttons).forEach(([buttonType, button]) => {
                        const columnName = button.column; // btn1, btn2, btn3
                        if (row[columnName] !== undefined && row[columnName] !== '') {
                            this.buttons[buttonType].url = row[columnName];
                            console.log(`Updated ${buttonType} (${columnName}) URL to:`, row[columnName]);
                        } else {
                            console.log(`No URL found for ${buttonType} (${columnName})`);
                        }
                    });
                    
                    // Save to localStorage as fallback
                    localStorage.setItem('buttonData', JSON.stringify(this.buttons));
                    console.log('Updated button data:', this.buttons);
                }
            } else {
                console.warn('Failed to fetch from SheetDB, trying localStorage');
                // Fallback to localStorage if SheetDB fails
                const savedData = localStorage.getItem('buttonData');
                if (savedData) {
                    this.buttons = JSON.parse(savedData);
                    console.log('Loaded button data from localStorage:', this.buttons);
                }
            }
            
            // Only update buttons if not on admin page
            if (!window.location.pathname.endsWith('admin.html')) {
                this.updateButtons();
            }
            return true;
        } catch (error) {
            console.error('Error loading button data:', error);
            return false;
        }
    }
    
    /**
     * Process the data from Google Sheets into a button configuration object
     */
    processSheetData(rows) {
        if (!rows || rows.length < 2) return {};
        
        const buttonData = {};
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row && row.length >= 3) {
                const buttonType = row[0].toLowerCase();
                buttonData[buttonType] = {
                    text: row[1] || '',
                    url: row[2] || '#',
                    lastUpdated: row[3] || new Date().toISOString()
                };
            }
        }
        
        return buttonData;
    }
    
    /**
     * Load button data from localStorage as fallback
     */
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('buttonData');
            if (savedData) {
                this.buttons = JSON.parse(savedData);
                this.updateButtons();
                return true;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        return false;
    }

    /**
     * Update button links and text based on configuration
     */
    updateButtons() {
        if (!this.buttons) {
            console.warn('No button configuration found');
            return;
        }
        
        console.log('Updating buttons with data:', this.buttons);
        
        // Update button elements in the DOM
        Object.entries(this.buttons).forEach(([type, data]) => {
            console.log(`Looking for button: ${type}`);
            
            // Try to find buttons with both 'btn' and type class, or just the type class
            let buttons = document.querySelectorAll(`.btn.${type}`);
            if (buttons.length === 0) {
                buttons = document.querySelectorAll(`.${type}`);
                console.log(`Found ${buttons.length} buttons with class '${type}'`);
            } else {
                console.log(`Found ${buttons.length} buttons with classes 'btn ${type}'`);
            }
            
            if (buttons.length > 0) {
                buttons.forEach(button => {
                    console.log(`Updating ${type} button:`, button);
                    if (data.url) {
                        button.href = data.url;
                        console.log(`Set ${type} URL to:`, data.url);
                    }
                    if (data.displayText) {
                        button.textContent = data.displayText;
                        console.log(`Set ${type} text to:`, data.displayText);
                    } else if (data.text) {
                        button.textContent = data.text;
                        console.log(`Set ${type} text to:`, data.text);
                    }
                    if (data.description) {
                        button.title = data.description;
                    }
                });
            } else {
                console.warn(`Button with class '${type}' not found in the DOM`);
            }
        });
    }

    /**
     * Get the current button configuration
     * @returns {Object} The current button configuration
     */
    getConfig() {
        return this.buttons;
    }
    
    /**
     * Update a specific button's URL
     * @param {string} buttonType - The type of button (primary, secondary, accent)
     * @param {Object} updates - The new button configuration
     */
    async updateButton(buttonType, updates) {
        if (!this.buttons[buttonType]) {
            console.error(`Button type '${buttonType}' not found`);
            return false;
        }
        
        console.log(`Updating button ${buttonType} with:`, updates);
        
        // Update local button data first
        this.buttons[buttonType] = { ...this.buttons[buttonType], ...updates };
        this.buttons[buttonType].lastUpdated = new Date().toISOString();
        
        // Update the DOM
        this.updateButtons();
        
        try {
            const button = this.buttons[buttonType];
            const url = updates.url || button.url;
            const column = button.column; // btn1, btn2, or btn3
            
            console.log(`Updating ${button.text} (${column}) with URL: ${url}`);
            
            // First, fetch the current data to get the row ID
            console.log('Fetching current data from SheetDB...');
            const findResponse = await fetch(this.SHEETDB_API);
            const responseText = await findResponse.text();
            
            if (!findResponse.ok) {
                throw new Error(`Failed to fetch data from SheetDB: ${findResponse.status} ${responseText}`);
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Existing SheetDB data:', data);
            } catch (e) {
                console.error('Error parsing SheetDB response:', e);
                throw new Error('Invalid JSON response from SheetDB');
            }
            
            if (!data || data.length === 0) {
                // If no data exists, create a new row with all button URLs
                console.log('No existing data found, creating new row...');
                const payload = {
                    data: [{
                        btn1: this.buttons.primary.url,
                        btn2: this.buttons.secondary.url,
                        btn3: this.buttons.accent.url
                    }]
                };
                
                console.log('Sending POST request to create new row:', payload);
                const createResponse = await fetch(this.SHEETDB_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const createResult = await createResponse.text();
                console.log('Create row response:', createResult);
                
                if (!createResponse.ok) {
                    throw new Error(`Failed to create new row in SheetDB: ${createResponse.status} ${createResult}`);
                }
                
                console.log('Successfully created new row with all button URLs');
            } else {
                // Since we're working with a single row, we'll update it directly
                // Get the first row (index 0) which contains our button URLs
                const row = data[0];
                if (!row) {
                    console.error('No data row found for update');
                    throw new Error('No data row found for update');
                }
                
                // Get the internal ID that SheetDB uses (usually the first key in the row)
                const rowKey = Object.keys(row)[0];
                if (!rowKey) {
                    console.error('Could not determine row key for update');
                    throw new Error('Could not determine row key for update');
                }
                
                // Update the URL in the row data
                const updatedRow = { ...row, [column]: url };
                
                // Create the update URL using the row key
                const updateUrl = `${this.SHEETDB_API}/id/${encodeURIComponent(rowKey)}`;
                
                // Create payload with the entire updated row
                const payload = {
                    data: updatedRow
                };
                
                console.log(`Updating ${column} in row ${rowId} with:`, payload);
                const updateResponse = await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const updateResult = await updateResponse.text();
                console.log('Update row response:', updateResult);
                
                if (!updateResponse.ok) {
                    throw new Error(`Failed to update SheetDB: ${updateResponse.status} ${updateResult}`);
                }
                
                console.log(`Successfully updated ${column} in SheetDB`);
            }
            
            // Save to localStorage on success
            localStorage.setItem('buttonData', JSON.stringify(this.buttons));
            console.log('Successfully updated button data');
            return true;
            
        } catch (error) {
            console.error('Error updating SheetDB:', error);
            // Save to localStorage as fallback
            localStorage.setItem('buttonData', JSON.stringify(this.buttons));
            console.log('Saved to localStorage as fallback');
            return false;
        }
    }

    /**
     * Start polling for configuration updates
     * @private
     */
    startPolling() {
        setInterval(async () => {
            try {
                const response = await fetch('config.json' + '?t=' + Date.now());
                if (response.ok) {
                    const newConfig = await response.json();
                    
                    // Check if configuration has changed
                    if (JSON.stringify(newConfig) !== JSON.stringify(this.config)) {
                        console.log('Configuration updated, reloading buttons...');
                        this.config = newConfig;
                        this.updateButtons();
                    }
                }
            } catch (error) {
                // Silently fail for polling errors to avoid console spam
            }
        }, 5000);
    }

    /**
     * Manually reload configuration (useful for testing)
     */
    async reload() {
        console.log('Manually reloading configuration...');
        await this.loadConfig();
        this.updateButtons();
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Update a specific button configuration
     */
    updateButtonConfig(buttonType, newConfig) {
        if (this.config.buttons[buttonType]) {
            this.config.buttons[buttonType] = { ...this.config.buttons[buttonType], ...newConfig };
            this.updateButtons();
            console.log(`Updated ${buttonType} button configuration:`, newConfig);
        } else {
            console.error(`Button type '${buttonType}' not found in configuration`);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Only initialize on non-admin pages
        if (!window.location.pathname.endsWith('admin.html')) {
            // Create global instance
            window.buttonManager = new ButtonManager();
            
            // Expose methods for testing
            window.reloadConfig = () => buttonManager.reload();
            window.getConfig = () => buttonManager.getConfig();
            window.updateButtonConfig = (type, config) => buttonManager.updateButtonConfig(type, config);
            
            console.log('ButtonManager initialized. Available methods:');
            console.log('- buttonManager.reload() - Manually reload configuration');
            console.log('- buttonManager.getConfig() - Get current configuration');
            console.log('- buttonManager.updateButtonConfig(type, config) - Update specific button');
        }
    } catch (error) {
        console.error('Failed to initialize ButtonManager:', error);
    }
});

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ButtonManager;
}
