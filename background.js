// ===== ARQUIVO 5: background.js =====
chrome.runtime.onInstalled.addListener(function() {
  console.log('Visa Form Multi-Profile Filler installed successfully!');
  
  // Inicializar storage se necessário
  chrome.storage.local.get(['profiles', 'currentIndex'], function(result) {
    if (!result.profiles) {
      chrome.storage.local.set({profiles: []});
    }
    if (result.currentIndex === undefined) {
      chrome.storage.local.set({currentIndex: 0});
    }
  });
});