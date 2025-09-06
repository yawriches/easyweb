/**
 * Dynamic Button Link Manager
 * Loads button configuration from config.json and updates button links
 */

class ButtonManager {
    constructor() {
        this.configPath = './config.json';
        this.init();
    }

    /**
     * Initialize the button manager
     */
    async init() {
        try {
            await this.loadConfig();
            this.updateButtons();
            this.setupConfigWatcher();
        } catch (error) {
            console.error('Failed to initialize ButtonManager:', error);
        }
    }

    /**
     * Load configuration from JSON file
     */
    async loadConfig() {
        try {
            const response = await fetch(this.configPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.config = await response.json();
            console.log('Configuration loaded successfully:', this.config);
        } catch (error) {
            console.error('Error loading configuration:', error);
            // Fallback to default configuration
            this.config = {
                buttons: {
                    primary: { text: "Get Started", url: "#" },
                    secondary: { text: "Learn More", url: "#" },
                    accent: { text: "Join Now", url: "#" }
                }
            };
        }
    }

    /**
     * Update button links and text based on configuration
     */
    updateButtons() {
        const buttons = this.config.buttons;
        
        Object.keys(buttons).forEach(buttonType => {
            const buttonElement = document.querySelector(`.btn.${buttonType}`);
            if (buttonElement) {
                const buttonConfig = buttons[buttonType];
                
                // Update URL
                buttonElement.href = buttonConfig.url;
                
                // Update text content
                buttonElement.textContent = buttonConfig.text;
                
                // Add title attribute for accessibility
                if (buttonConfig.description) {
                    buttonElement.title = buttonConfig.description;
                }
                
                console.log(`Updated ${buttonType} button:`, {
                    text: buttonConfig.text,
                    url: buttonConfig.url
                });
            } else {
                console.warn(`Button with class '${buttonType}' not found`);
            }
        });
    }

    /**
     * Setup configuration file watcher (for development)
     * Note: This uses polling since file system events aren't available in browsers
     */
    setupConfigWatcher() {
        // Check for config updates every 5 seconds
        setInterval(async () => {
            try {
                const response = await fetch(this.configPath + '?t=' + Date.now());
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
    // Create global instance
    window.buttonManager = new ButtonManager();
    
    // Add some helpful console methods for debugging
    console.log('ButtonManager initialized. Available methods:');
    console.log('- buttonManager.reload() - Manually reload configuration');
    console.log('- buttonManager.getConfig() - Get current configuration');
    console.log('- buttonManager.updateButtonConfig(type, config) - Update specific button');
});

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ButtonManager;
}
