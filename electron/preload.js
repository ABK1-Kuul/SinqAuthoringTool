const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appBridge', {
  // Get framework version
  getFrameworkVersion: () => ipcRenderer.invoke('wizard:getFrameworkVersion'),
  
  // Test SMTP connection
  testSmtp: (smtpConfig) => ipcRenderer.invoke('wizard:testSmtp', smtpConfig),
  
  // Start installation process
  startInstallation: (config, progressCallback) => {
    // Set up progress listener
    const progressHandler = (event, progress) => {
      if (progressCallback) {
        progressCallback(progress);
      }
    };
    
    ipcRenderer.on('installation:progress', progressHandler);
    
    // Return promise that resolves when installation completes
    return ipcRenderer.invoke('wizard:startInstallation', config)
      .finally(() => {
        // Clean up listener
        ipcRenderer.removeListener('installation:progress', progressHandler);
      });
  },
  
  // Launch main application
  launchApp: () => ipcRenderer.invoke('wizard:launchApp'),
});
