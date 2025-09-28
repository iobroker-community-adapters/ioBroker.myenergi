# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

**myenergi Adapter Context:** This adapter connects ioBroker to myenergi devices including Zappi EV chargers, Eddi immersion heater controllers, and Harvi wireless energy monitors. The adapter communicates with myenergi devices through the myenergi cloud API using digest authentication. It provides real-time monitoring of energy consumption, generation, and device status, as well as control functionality for compatible devices like charge mode switching and boost activation.

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        // Get states for validation
                        const states = await harness.states.getKeysAsync('your-adapter.0.*');
                        
                        console.log(`Found ${states.length} states`);
                        
                        if (states.length === 0) {
                            return reject(new Error(`Expected states to be created after adapter run, but found 0 states. This might indicate:`));
                        }

                        console.log('✅ Success: States were created!');
                        resolve();
                    } catch (e) {
                        console.error('❌ Test failed with error:', e);
                        reject(e);
                    }
                });
            }).timeout(120000); // 2 minutes timeout
        });
    }
});
```

**Key Integration Testing Patterns**:
1. **Always use promisified database access**: Wrap callback-style methods in Promises
2. **Use proper timeouts**: Set realistic timeouts (120+ seconds) for API-dependent tests
3. **Configure before starting**: Set native configuration before calling `startAdapterAndWait()`
4. **Wait for processing**: Allow adequate time for API calls and data processing
5. **Validate state creation**: Check that expected states are created and populated
6. **Handle authentication**: For API-based adapters, provide valid test credentials or mock responses

#### myenergi-Specific Integration Testing
```javascript
// Example configuration for myenergi adapter testing
Object.assign(obj.native, {
    username: 'test-serial-number',  // Hub serial number
    password: 'test-api-key',        // API key
    interval: 1,                     // Polling interval in minutes
    // Add other myenergi-specific config
});
```

## Adapter Structure

### Main Adapter Class
Follow the standard ioBroker adapter structure:

```typescript
class MyenergiAdapter extends utils.Adapter {
  private updateInterval: any = null;
  private json2iob: Json2iob;
  private hub: MyEnergi;
  
  constructor(options: Partial<utils.AdapterOptions> = {}) {
    super({
      ...options,
      name: "myenergi",
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }

  private async onReady(): Promise<void> {
    // Initialize connection and start polling
  }

  private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
    // Handle state changes for device control
  }

  private onUnload(callback: () => void): void {
    // Clean up resources
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    // Close connections, clean up resources
    callback();
  } catch (e) {
    callback();
  }
}
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo_password");
                
                await harness.changeAdapterConfig("your-adapter", {
                    native: {
                        username: "demo@provider.com",
                        password: encryptedPassword,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```

## myenergi API-Specific Best Practices

### Authentication and Connection Management
- The myenergi API uses HTTP digest authentication with hub serial number as username and API key as password
- Always validate credentials before attempting API calls
- Implement proper error handling for authentication failures (401 Unauthorized)
- Cache authentication state but be prepared to re-authenticate on demand

### Device Data Handling
- Parse JSON responses from myenergi API carefully, handling missing or null values
- Use the Json2iob helper class for consistent object/state creation
- Map myenergi device properties to meaningful ioBroker state names using descriptions
- Handle different device types (Zappi, Eddi, Harvi) with appropriate data structures

### Polling and Updates
- Respect myenergi API rate limits with appropriate polling intervals (minimum 30 seconds recommended)
- Implement exponential backoff for API failures
- Update only changed values to minimize ioBroker database writes
- Provide user-configurable polling interval with reasonable defaults

### Control Commands
- Implement proper validation for control commands (mode changes, boost activation)
- Handle command acknowledgment and status feedback
- Provide clear error messages for unsupported operations
- Ensure state changes are properly reflected after successful commands

## Error Handling and Logging

- Use adapter logging methods (this.log.error, this.log.warn, this.log.info, this.log.debug)
- Provide informative error messages for common issues (network errors, authentication failures)
- Set connection state appropriately based on API availability
- Implement graceful degradation when API is temporarily unavailable