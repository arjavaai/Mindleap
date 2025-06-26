
// Utility functions to ensure consistent rendering across environments

export const ensureIconsLoaded = () => {
  // Ensure lucide-react icons are properly loaded
  const checkIconsReady = () => {
    const iconElements = document.querySelectorAll('[data-lucide]');
    if (iconElements.length === 0) {
      console.log('No lucide icons found - this is expected if using React components');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkIconsReady);
  } else {
    checkIconsReady();
  }
};

export const validateCSSVariables = () => {
  // Check if CSS variables are properly loaded
  const testElement = document.createElement('div');
  testElement.style.color = 'hsl(var(--foreground))';
  document.body.appendChild(testElement);
  
  const computedStyle = window.getComputedStyle(testElement);
  const foregroundColor = computedStyle.color;
  
  document.body.removeChild(testElement);
  
  if (foregroundColor === 'hsl(var(--foreground))') {
    console.warn('CSS variables not loaded properly');
    return false;
  }
  
  return true;
};

export const ensureFontsLoaded = () => {
  // Check if Poppins font is loaded
  if (document.fonts && document.fonts.check) {
    const fontLoaded = document.fonts.check('1em Poppins');
    if (!fontLoaded) {
      console.log('Poppins font loading...');
      document.fonts.load('1em Poppins').then(() => {
        console.log('Poppins font loaded successfully');
      }).catch(() => {
        console.warn('Failed to load Poppins font');
      });
    }
  }
};

export const initializeEnvironment = () => {
  ensureIconsLoaded();
  validateCSSVariables();
  ensureFontsLoaded();
  
  // Add environment class to body for debugging
  document.body.classList.add('env-initialized');
  
  console.log('Environment initialization complete');
};
