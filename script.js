// Pressure unit conversion constants (relative to Pascal Pa)
const PRESSURE_UNITS = {
  pa: {
    name: "Pa (pascals)",
    toPascal: 1,
    fromPascal: 1,
  },
  bar: {
    name: "bar",
    toPascal: 100000,
    fromPascal: 1 / 100000,
  },
  psi: {
    name: "psi (pounds per square inch)",
    toPascal: 6894.757,
    fromPascal: 1 / 6894.757,
  },
  kpa: {
    name: "kPa (kilopascals)",
    toPascal: 1000,
    fromPascal: 1 / 1000,
  },
  mpa: {
    name: "MPa (megapascals)",
    toPascal: 1000000,
    fromPascal: 1 / 1000000,
  },
  gpa: {
    name: "GPa (gigapascals)",
    toPascal: 1000000000,
    fromPascal: 1 / 1000000000,
  },
  hpa: {
    name: "hPa (hectopascals)",
    toPascal: 100,
    fromPascal: 1 / 100,
  },
  atm: {
    name: "atm (standard atmospheres)",
    toPascal: 101325,
    fromPascal: 1 / 101325,
  },
  at: {
    name: "at (technical atmospheres)",
    toPascal: 98066.5,
    fromPascal: 1 / 98066.5,
  },
  torr: {
    name: "Torr",
    toPascal: 133.322,
    fromPascal: 1 / 133.322,
  },
  mmhg: {
    name: "mmHg (millimeters of mercury)",
    toPascal: 133.322,
    fromPascal: 1 / 133.322,
  },
  inhg: {
    name: "inHg (inches of mercury)",
    toPascal: 3386.389,
    fromPascal: 1 / 3386.389,
  },
  knm2: {
    name: "kN/m² (kilonewtons per square meter)",
    toPascal: 1000,
    fromPascal: 1 / 1000,
  },
  lbft2: {
    name: "lb/ft² (pounds per square foot)",
    toPascal: 47.88026,
    fromPascal: 1 / 47.88026,
  },
  tm2: {
    name: "t/m² (tons per square meter)",
    toPascal: 9806.65,
    fromPascal: 1 / 9806.65,
  },
};

// DOM elements
const inputValue = document.getElementById("input-value");
const outputValue = document.getElementById("output-value");
const swapBtn = document.getElementById("swap-btn");
const inputLabel = document.getElementById("input-label");
const outputLabel = document.getElementById("output-label");
const inputUnit = document.getElementById("input-unit");
const outputUnit = document.getElementById("output-unit");
const formulaDisplay = document.getElementById("formula-display");

// Current selected units
let currentInputUnit = "bar";
let currentOutputUnit = "psi";

// Initialize converter
function init() {
  updateUI();
  addEventListeners();
  setupAnalyticsTracking();
  setupCollapsibleSections();

  // Set initial focus
  inputValue.focus();
}

// Add event listeners
function addEventListeners() {
  // Input value change events
  inputValue.addEventListener("input", handleInputChange);

  // Unit selection change events
  inputUnit.addEventListener("change", handleInputUnitChange);
  outputUnit.addEventListener("change", handleOutputUnitChange);

  // Swap button click event
  swapBtn.addEventListener("click", handleSwap);

  // Enter key handling
  inputValue.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inputValue.blur();
      if (this.value) {
        trackEvent("conversion_completed", {
          completion_method: "enter_key",
          conversion_type: `${currentInputUnit}_to_${currentOutputUnit}`,
        });
      }
    }
  });

  // Track when user finishes input
  inputValue.addEventListener("blur", function () {
    if (this.value && outputValue.value) {
      trackEvent("conversion_completed", {
        completion_method: "input_blur",
        conversion_type: `${currentInputUnit}_to_${currentOutputUnit}`,
      });
    }
  });

  // Clear output when input is empty
  inputValue.addEventListener("input", function () {
    if (this.value === "") {
      outputValue.value = "";
    }
  });

  // Prevent wheel events on number inputs
  inputValue.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );

  outputValue.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );

  // Copy button functionality
  const copyBtn = document.getElementById("copyResult");
  if (copyBtn) {
    copyBtn.addEventListener("click", handleCopy);
  }

  // Quick value buttons functionality
  setupQuickValueButtons();

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Ctrl/Cmd + S to swap units
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSwap();
    }
    // Esc to clear all fields
    if (e.key === "Escape") {
      inputValue.value = "";
      outputValue.value = "";
      inputValue.focus();
    }
    // Ctrl/Cmd + C to copy result (only when output field is focused)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "c" &&
      outputValue.value &&
      document.activeElement === outputValue
    ) {
      e.preventDefault();
      handleCopy();
    }
  });
}

// Handle input value change
function handleInputChange(e) {
  const value = parseFloat(e.target.value);

  // Clear output if input is empty or invalid
  if (isNaN(value) || e.target.value === "") {
    outputValue.value = "";
    return;
  }

  // Perform conversion
  const result = convertPressure(value, currentInputUnit, currentOutputUnit);

  // Display result
  outputValue.value = formatResult(result);

  // Analytics tracking
  trackEvent("calculator_used", {
    conversion_type: `${currentInputUnit}_to_${currentOutputUnit}`,
    input_value: value,
    output_value: result,
  });
}

// Handle input unit change
function handleInputUnitChange(e) {
  currentInputUnit = e.target.value;
  updateUI();

  // Recalculate if there's an input value
  if (inputValue.value && inputValue.value !== "") {
    handleInputChange({ target: inputValue });
  }

  trackEvent("unit_changed", {
    unit_type: "input",
    new_unit: currentInputUnit,
  });
}

// Handle output unit change
function handleOutputUnitChange(e) {
  currentOutputUnit = e.target.value;
  updateUI();

  // Recalculate if there's an input value
  if (inputValue.value && inputValue.value !== "") {
    handleInputChange({ target: inputValue });
  }

  trackEvent("unit_changed", {
    unit_type: "output",
    new_unit: currentOutputUnit,
  });
}

// Pressure conversion function
function convertPressure(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }

  // Convert to Pascal first, then to target unit
  const pascalValue = value * PRESSURE_UNITS[fromUnit].toPascal;
  const result = pascalValue * PRESSURE_UNITS[toUnit].fromPascal;

  return result;
}

// Format result
function formatResult(value) {
  // For very small values, use more decimal places
  if (Math.abs(value) < 0.001) {
    return value.toFixed(8);
  }
  // For values less than 1, use 6 decimal places
  else if (Math.abs(value) < 1) {
    return value.toFixed(6);
  }
  // For values less than 100, use 4 decimal places
  else if (Math.abs(value) < 100) {
    return value.toFixed(4);
  }
  // For values less than 10000, use 3 decimal places
  else if (Math.abs(value) < 10000) {
    return value.toFixed(3);
  }
  // For larger values, use 2 decimal places
  else {
    return value.toFixed(2);
  }
}

// Handle swap button click
function handleSwap() {
  // Add animation effect
  swapBtn.style.transform = "rotate(180deg) scale(1.1)";

  // Swap units
  const tempUnit = currentInputUnit;
  currentInputUnit = currentOutputUnit;
  currentOutputUnit = tempUnit;

  // Update dropdown selections
  inputUnit.value = currentInputUnit;
  outputUnit.value = currentOutputUnit;

  // Swap values
  const inputVal = inputValue.value;
  const outputVal = outputValue.value;

  if (inputVal && outputVal) {
    inputValue.value = outputVal;
    outputValue.value = inputVal;
  } else {
    // Clear all fields
    inputValue.value = "";
    outputValue.value = "";
  }

  // Update UI
  updateUI();

  // Focus on input
  inputValue.focus();

  // Analytics tracking
  trackEvent("swap_conversion", {
    new_conversion_type: `${currentInputUnit}_to_${currentOutputUnit}`,
    had_values: !!(inputVal && outputVal),
  });

  // Reset button animation
  setTimeout(() => {
    swapBtn.style.transform = "";
  }, 300);
}

// Handle copy result to clipboard
function handleCopy() {
  const resultValue = outputValue.value;

  if (!resultValue) {
    return;
  }

  // Try to use the modern Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(resultValue)
      .then(function () {
        showCopySuccess();
      })
      .catch(function () {
        // Fallback to older method
        fallbackCopy(resultValue);
      });
  } else {
    // Fallback for older browsers or non-secure contexts
    fallbackCopy(resultValue);
  }

  // Analytics tracking
  trackEvent("result_copied", {
    value: resultValue,
    unit: currentOutputUnit,
    copy_method: navigator.clipboard ? "modern" : "fallback",
  });
}

// Fallback copy method for older browsers
function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
    showCopySuccess();
  } catch (err) {
    console.error("Failed to copy text: ", err);
    showCopyError();
  } finally {
    document.body.removeChild(textArea);
  }
}

// Show copy success feedback
function showCopySuccess() {
  const copyBtn = document.getElementById("copyResult");
  if (copyBtn) {
    const originalTitle = copyBtn.title;
    copyBtn.title = "Copied!";
    copyBtn.style.background = "#28a745";

    setTimeout(() => {
      copyBtn.title = originalTitle;
      copyBtn.style.background = "";
    }, 2000);
  }
}

// Show copy error feedback
function showCopyError() {
  const copyBtn = document.getElementById("copyResult");
  if (copyBtn) {
    const originalTitle = copyBtn.title;
    copyBtn.title = "Copy failed";
    copyBtn.style.background = "#dc3545";

    setTimeout(() => {
      copyBtn.title = originalTitle;
      copyBtn.style.background = "";
    }, 2000);
  }
}

// Update UI display
function updateUI() {
  // Update labels
  inputLabel.textContent = `Input Pressure Value (${PRESSURE_UNITS[currentInputUnit].name})`;
  outputLabel.textContent = `Conversion Result (${PRESSURE_UNITS[currentOutputUnit].name})`;

  // Update placeholders
  inputValue.placeholder = `Enter ${PRESSURE_UNITS[currentInputUnit].name} value`;
  outputValue.placeholder = `${PRESSURE_UNITS[currentOutputUnit].name} result`;

  // Update conversion formula display
  updateFormula();
}

// Update conversion formula display
function updateFormula() {
  const fromUnit = PRESSURE_UNITS[currentInputUnit];
  const toUnit = PRESSURE_UNITS[currentOutputUnit];

  if (currentInputUnit === currentOutputUnit) {
    formulaDisplay.innerHTML = `<strong>Conversion Formula:</strong> Same unit, no conversion needed`;
    return;
  }

  // Calculate conversion factor
  const conversionFactor = fromUnit.toPascal * toUnit.fromPascal;

  let formulaText;
  if (conversionFactor >= 1000) {
    formulaText = `${toUnit.name} = ${
      fromUnit.name
    } × ${conversionFactor.toExponential(3)}`;
  } else if (conversionFactor >= 1) {
    formulaText = `${toUnit.name} = ${
      fromUnit.name
    } × ${conversionFactor.toFixed(6)}`;
  } else if (conversionFactor >= 0.001) {
    formulaText = `${toUnit.name} = ${
      fromUnit.name
    } × ${conversionFactor.toFixed(6)}`;
  } else {
    formulaText = `${toUnit.name} = ${
      fromUnit.name
    } × ${conversionFactor.toExponential(3)}`;
  }

  formulaDisplay.innerHTML = `<strong>Conversion Formula:</strong> ${formulaText}`;
}

// Validate input
function validateInput(value) {
  // Allow positive numbers and decimals
  return /^\d*\.?\d*$/.test(value);
}

// Handle paste events
inputValue.addEventListener("paste", function (e) {
  // Delayed validation of pasted content
  setTimeout(() => {
    const value = this.value;
    if (!validateInput(value)) {
      // Remove invalid characters
      this.value = value.replace(/[^0-9.]/g, "");
      // Ensure only one decimal point
      const parts = this.value.split(".");
      if (parts.length > 2) {
        this.value = parts[0] + "." + parts.slice(1).join("");
      }
    }

    // Trigger conversion
    handleInputChange({ target: this });
  }, 10);
});

// Debounce function
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

// Analytics tracking function
function trackEvent(eventName, parameters = {}) {
  if (typeof gtag !== "undefined") {
    gtag("event", eventName, parameters);
  }
  console.log("Event:", eventName, parameters);
}

// Setup analytics tracking
function setupAnalyticsTracking() {
  // Page view tracking
  if (typeof gtag !== "undefined") {
    gtag("config", "G-T69E3XS5ZT", {
      page_title: "Pressure Unit Converter",
      page_location: window.location.href,
    });
  }

  // Scroll tracking
  let hasScrolledToBottom = false;
  function checkScrollToBottom() {
    if (
      !hasScrolledToBottom &&
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 100
    ) {
      hasScrolledToBottom = true;
      trackEvent("scroll_to_bottom");
    }
  }

  // Use debounced scroll check
  const debouncedScrollCheck = debounce(checkScrollToBottom, 250);
  window.addEventListener("scroll", debouncedScrollCheck, { passive: true });

  // Page time tracking
  let startTime = Date.now();
  let tracked30s = false;
  let tracked60s = false;

  setInterval(() => {
    const timeSpent = Date.now() - startTime;

    if (!tracked30s && timeSpent > 30000) {
      tracked30s = true;
      trackEvent("time_on_page", { duration: "30_seconds" });
    }

    if (!tracked60s && timeSpent > 60000) {
      tracked60s = true;
      trackEvent("time_on_page", { duration: "60_seconds" });
    }
  }, 5000);
}

// Initialize when page loads
// Setup collapsible sections
function setupCollapsibleSections() {
  const collapsibleHeaders = document.querySelectorAll(".collapsible-header");

  collapsibleHeaders.forEach((header) => {
    const button = header.querySelector(".collapse-btn");
    const content = header.nextElementSibling;

    if (button && content) {
      header.addEventListener("click", function () {
        toggleCollapse(button, content);
      });

      button.addEventListener("click", function (e) {
        e.stopPropagation(); // Prevent double trigger
      });
    }
  });
}

function toggleCollapse(button, content) {
  const isExpanded = button.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    // Collapse
    button.setAttribute("aria-expanded", "false");
    content.style.display = "none";
    content.classList.remove("show");
  } else {
    // Expand
    button.setAttribute("aria-expanded", "true");
    content.style.display = "block";
    content.classList.add("show");
  }

  // Analytics tracking
  trackEvent("section_toggled", {
    section: content.closest(".collapsible").querySelector("h2").textContent,
    action: isExpanded ? "collapsed" : "expanded",
  });
}

// Setup quick value buttons
function setupQuickValueButtons() {
  const quickValueButtons = document.querySelectorAll(".quick-value-btn");

  quickValueButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const value = parseFloat(this.getAttribute("data-value"));
      const unit = this.getAttribute("data-unit");

      // Set the input value and unit
      inputValue.value = value;

      // Set the correct input and output units
      if (unit === "bar") {
        // User clicked a bar value, convert to PSI
        inputUnit.value = "bar";
        outputUnit.value = "psi";
        currentInputUnit = "bar";
        currentOutputUnit = "psi";
      } else if (unit === "psi") {
        // User clicked a PSI value, convert to bar
        inputUnit.value = "psi";
        outputUnit.value = "bar";
        currentInputUnit = "psi";
        currentOutputUnit = "bar";
      }

      // Update UI and perform conversion
      updateUI();

      // Perform the conversion
      const result = convertPressure(
        value,
        currentInputUnit,
        currentOutputUnit
      );
      outputValue.value = formatResult(result);

      // Add visual feedback
      button.style.transform = "scale(0.95)";
      setTimeout(() => {
        button.style.transform = "";
      }, 150);

      // Track analytics
      trackEvent("quick_value_conversion", {
        input_value: value,
        input_unit: currentInputUnit,
        output_unit: currentOutputUnit,
        result_value: result,
      });

      // Focus on input for further editing if needed
      inputValue.focus();
      inputValue.select();
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
