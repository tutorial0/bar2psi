// Conversion constants
const BAR_TO_PSI = 14.50377;
const PSI_TO_BAR = 1 / BAR_TO_PSI;

// State to track current conversion direction
let isBarToPsi = true;

// DOM elements
const inputValue = document.getElementById("input-value");
const outputValue = document.getElementById("output-value");
const swapBtn = document.getElementById("swap-btn");
const inputLabel = document.getElementById("input-label");
const outputLabel = document.getElementById("output-label");
const inputUnit = document.getElementById("input-unit");
const outputUnit = document.getElementById("output-unit");
const formulaDisplay = document.getElementById("formula-display");

// Initialize the converter
function init() {
  updateUI();
  addEventListeners();
  setupAnalyticsTracking();

  // Set initial focus
  inputValue.focus();
}

// Add event listeners
function addEventListeners() {
  // Input event for real-time conversion
  inputValue.addEventListener("input", handleInputChange);

  // Swap button click
  swapBtn.addEventListener("click", handleSwap);

  // Enter key handling
  inputValue.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inputValue.blur();
      if (this.value) {
        trackEvent("conversion_completed", {
          completion_method: "enter_key",
          conversion_type: isBarToPsi ? "bar_to_psi" : "psi_to_bar",
        });
      }
    }
  });

  // Track when user finishes input (blur event)
  inputValue.addEventListener("blur", function () {
    if (this.value && outputValue.value) {
      trackEvent("conversion_completed", {
        completion_method: "input_blur",
        conversion_type: isBarToPsi ? "bar_to_psi" : "psi_to_bar",
      });
    }
  });

  // Clear output when input is empty
  inputValue.addEventListener("input", function () {
    if (this.value === "") {
      outputValue.value = "";
    }
  });
}

// Handle input change and perform conversion
function handleInputChange(e) {
  const value = parseFloat(e.target.value);

  // Clear output if input is empty or invalid
  if (isNaN(value) || e.target.value === "") {
    outputValue.value = "";
    return;
  }

  // Perform conversion
  let result;
  if (isBarToPsi) {
    result = convertBarToPsi(value);
  } else {
    result = convertPsiToBar(value);
  }

  // Display result with appropriate precision
  outputValue.value = formatResult(result);

  // Analytics tracking - conversion used
  trackEvent("calculator_used", {
    conversion_type: isBarToPsi ? "bar_to_psi" : "psi_to_bar",
    input_value: value,
    output_value: result,
  });
}

// Convert bar to PSI
function convertBarToPsi(bar) {
  return bar * BAR_TO_PSI;
}

// Convert PSI to bar
function convertPsiToBar(psi) {
  return psi * PSI_TO_BAR;
}

// Format result to appropriate decimal places
function formatResult(value) {
  // For very small numbers, use more decimal places
  if (Math.abs(value) < 0.001) {
    return value.toFixed(6);
  }
  // For numbers less than 1, use 4 decimal places
  else if (Math.abs(value) < 1) {
    return value.toFixed(4);
  }
  // For numbers less than 100, use 3 decimal places
  else if (Math.abs(value) < 100) {
    return value.toFixed(3);
  }
  // For larger numbers, use 2 decimal places
  else {
    return value.toFixed(2);
  }
}

// Handle swap button click
function handleSwap() {
  // Add animation class
  swapBtn.style.transform = "rotate(180deg) scale(1.1)";

  // Toggle conversion direction
  isBarToPsi = !isBarToPsi;

  // Swap values if both fields have values
  const inputVal = inputValue.value;
  const outputVal = outputValue.value;

  if (inputVal && outputVal) {
    inputValue.value = outputVal;
    outputValue.value = inputVal;
  } else {
    // Clear both fields
    inputValue.value = "";
    outputValue.value = "";
  }

  // Update UI
  updateUI();

  // Focus on input
  inputValue.focus();

  // Analytics tracking - swap button clicked
  trackEvent("swap_conversion", {
    new_conversion_type: isBarToPsi ? "bar_to_psi" : "psi_to_bar",
    had_values: !!(inputVal && outputVal),
  });

  // Reset button animation after a delay
  setTimeout(() => {
    swapBtn.style.transform = "";
  }, 300);
}

// Update UI based on current conversion direction
function updateUI() {
  if (isBarToPsi) {
    // Bar to PSI mode
    inputLabel.textContent = "Pressure in Bar";
    outputLabel.textContent = "Pressure in PSI";
    inputUnit.textContent = "bar";
    outputUnit.textContent = "psi";
    formulaDisplay.innerHTML = "<strong>Formula:</strong> PSI = Bar × 14.50377";

    // Update placeholder
    inputValue.placeholder = "Enter bar value";
    outputValue.placeholder = "PSI result";
  } else {
    // PSI to Bar mode
    inputLabel.textContent = "Pressure in PSI";
    outputLabel.textContent = "Pressure in Bar";
    inputUnit.textContent = "psi";
    outputUnit.textContent = "bar";
    formulaDisplay.innerHTML = "<strong>Formula:</strong> Bar = PSI ÷ 14.50377";

    // Update placeholder
    inputValue.placeholder = "Enter PSI value";
    outputValue.placeholder = "Bar result";
  }
}

// Utility function to validate input
function validateInput(value) {
  // Allow positive numbers and decimals
  return /^\d*\.?\d*$/.test(value);
}

// Handle paste events to validate pasted content
inputValue.addEventListener("paste", function (e) {
  // Allow default paste behavior, then validate
  setTimeout(() => {
    const value = this.value;
    if (!validateInput(value)) {
      this.value = value.replace(/[^\d.]/g, "");
    }
    handleInputChange({ target: this });
  }, 0);
});

// Prevent invalid characters from being typed
inputValue.addEventListener("keypress", function (e) {
  const char = String.fromCharCode(e.which);
  const currentValue = this.value;

  // Allow backspace, delete, tab, escape, enter
  if (
    [8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    (e.keyCode === 65 && e.ctrlKey === true) ||
    (e.keyCode === 67 && e.ctrlKey === true) ||
    (e.keyCode === 86 && e.ctrlKey === true) ||
    (e.keyCode === 88 && e.ctrlKey === true)
  ) {
    return;
  }

  // Allow only numbers and one decimal point
  if (!/[\d.]/.test(char) || (char === "." && currentValue.includes("."))) {
    e.preventDefault();
  }
});

// Add keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + S to swap
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    trackEvent("keyboard_shortcut_used", {
      shortcut: "swap_conversion",
      key_combination: (e.ctrlKey ? "ctrl" : "cmd") + "+s",
    });
    handleSwap();
  }

  // Escape to clear
  if (e.key === "Escape") {
    trackEvent("keyboard_shortcut_used", {
      shortcut: "clear_fields",
      key_combination: "escape",
    });
    inputValue.value = "";
    outputValue.value = "";
    inputValue.focus();
  }
});

// Copy result functionality
outputValue.addEventListener("click", function () {
  if (this.value) {
    this.select();
    try {
      navigator.clipboard.writeText(this.value).then(function () {
        // Show a brief feedback
        const originalBg = outputValue.style.backgroundColor;
        outputValue.style.backgroundColor = "#d4edda";
        setTimeout(() => {
          outputValue.style.backgroundColor = originalBg;
        }, 200);

        // Analytics tracking - result copied
        trackEvent("result_copied", {
          conversion_type: isBarToPsi ? "bar_to_psi" : "psi_to_bar",
          copied_value: outputValue.value,
        });
      });
    } catch (err) {
      // Fallback for older browsers
      document.execCommand("copy");
      // Analytics tracking - result copied (fallback)
      trackEvent("result_copied", {
        conversion_type: isBarToPsi ? "bar_to_psi" : "psi_to_bar",
        copied_value: this.value,
        copy_method: "fallback",
      });
    }
  }
});

// Add tooltip for copy functionality
outputValue.title = "Click to copy result";

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Apply debouncing to input for better performance with rapid typing
const debouncedInputChange = debounce(handleInputChange, 100);

// Add some example conversions for quick access
function addQuickExamples() {
  const examples = [
    { label: "1 bar", value: 1, isBar: true },
    { label: "2.5 bar", value: 2.5, isBar: true },
    { label: "100 PSI", value: 100, isBar: false },
    { label: "50 PSI", value: 50, isBar: false },
  ];

  // This could be expanded to add quick example buttons
  // For now, we'll keep the interface clean
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// Add some helpful console messages for developers
console.log("Bar2PSI Converter loaded successfully!");
console.log("Keyboard shortcuts:");
console.log("- Ctrl/Cmd + S: Swap conversion direction");
console.log("- Escape: Clear all fields");
console.log("- Click output field to copy result");

// Analytics tracking functions
function trackEvent(eventName, parameters = {}) {
  // Check if gtag is available
  if (typeof gtag === "function") {
    gtag("event", eventName, {
      event_category: "pressure_converter",
      event_label: eventName,
      ...parameters,
    });
    console.log("Analytics event tracked:", eventName, parameters);
  } else {
    console.log("Analytics not available, would track:", eventName, parameters);
  }
}

function setupAnalyticsTracking() {
  // Track page scroll to bottom
  let hasScrolledToBottom = false;

  function checkScrollToBottom() {
    if (hasScrolledToBottom) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Consider "bottom" as 90% of the page to account for different screen sizes
    if (scrollTop + windowHeight >= documentHeight * 0.9) {
      hasScrolledToBottom = true;
      trackEvent("scrolled_to_bottom", {
        page_height: documentHeight,
        scroll_percentage: Math.round(
          ((scrollTop + windowHeight) / documentHeight) * 100
        ),
      });
    }
  }

  // Throttled scroll event listener
  let scrollTimeout;
  window.addEventListener("scroll", function () {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(checkScrollToBottom, 100);
  });

  // Track page load
  trackEvent("page_loaded", {
    timestamp: new Date().toISOString(),
  });
}

// Export functions for testing (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    convertBarToPsi,
    convertPsiToBar,
    formatResult,
    BAR_TO_PSI,
    PSI_TO_BAR,
    trackEvent,
  };
}
