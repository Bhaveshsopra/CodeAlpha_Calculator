(() => {
  "use strict";

  const display = document.getElementById("display");
  const expression = document.getElementById("expression");
  const message = document.getElementById("message");
  const keypad = document.getElementById("keypad");

  let current = "0";
  let stored = null;
  let operator = null;
  let waitingForOperand = false;
  let justCalculated = false;
  let errorState = false;

  const operatorSymbols = { "+": "+", "−": "−", "×": "×", "÷": "÷" };

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Error";
    if (Object.is(value, -0)) value = 0;
    const rounded = Number.parseFloat(value.toPrecision(11));
    const string = String(rounded);
    return string.length > 15 ? rounded.toExponential(6) : string;
  }

  function animateDisplay() {
    display.classList.remove("bump");
    // Reflow restarts the tiny number-pop animation.
    void display.offsetWidth;
    display.classList.add("bump");
  }

  function render(animate = true) {
    display.textContent = current;
    expression.textContent = stored !== null && operator
      ? `${formatNumber(stored)} ${operatorSymbols[operator]}${waitingForOperand ? "" : ` ${current}`}`
      : (justCalculated && expression.dataset.result ? expression.dataset.result : "\u00a0");
    if (animate) animateDisplay();
  }

  function setMessage(text) {
    message.textContent = text;
  }

  function clearAll() {
    current = "0";
    stored = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = false;
    errorState = false;
    expression.dataset.result = "";
    setMessage("Cleared — ready for a new calculation");
    render();
  }

  function inputDigit(digit) {
    if (errorState) clearAll();
    if (waitingForOperand || justCalculated) {
      current = digit;
      waitingForOperand = false;
      justCalculated = false;
      if (stored === null) expression.dataset.result = "";
    } else {
      current = current === "0" ? digit : (current.length < 16 ? current + digit : current);
    }
    setMessage("Use the keypad or your keyboard");
    render();
  }

  function inputDecimal() {
    if (errorState) clearAll();
    if (waitingForOperand || justCalculated) {
      current = "0.";
      waitingForOperand = false;
      justCalculated = false;
    } else if (!current.includes(".")) {
      current += ".";
    }
    setMessage("Decimal point added");
    render();
  }

  function calculate(a, op, b) {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function chooseOperator(nextOperator) {
    if (errorState) return;
    const inputValue = Number(current);
    if (operator && !waitingForOperand) {
      const result = calculate(stored, operator, inputValue);
      if (!Number.isFinite(result)) {
        showError("Cannot divide by zero");
        return;
      }
      current = formatNumber(result);
      stored = result;
    } else {
      stored = inputValue;
    }
    operator = nextOperator;
    waitingForOperand = true;
    justCalculated = false;
    expression.dataset.result = "";
    setMessage("Choose a number");
    render();
  }

  function equals() {
    if (errorState || operator === null || stored === null) return;
    const left = stored;
    const right = waitingForOperand ? stored : Number(current);
    const op = operator;
    const result = calculate(left, op, right);
    if (!Number.isFinite(result)) {
      showError("Cannot divide by zero");
      return;
    }
    const resultText = formatNumber(result);
    expression.dataset.result = `${formatNumber(left)} ${operatorSymbols[op]} ${formatNumber(right)} =`;
    current = resultText;
    stored = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = true;
    setMessage("Result calculated");
    render();
  }

  function showError(text) {
    current = "Error";
    stored = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = false;
    errorState = true;
    expression.dataset.result = "";
    setMessage(text);
    render();
  }

  function deleteLast() {
    if (errorState || justCalculated || waitingForOperand) {
      current = "0";
      errorState = false;
      justCalculated = false;
      waitingForOperand = false;
    } else {
      current = current.length > 1 ? current.slice(0, -1) : "0";
      if (current === "-") current = "0";
    }
    setMessage("Last digit deleted");
    render();
  }

  function toggleSign() {
    if (errorState) return;
    if (Number(current) !== 0) current = current.startsWith("-") ? current.slice(1) : `-${current}`;
    render();
  }

  function percent() {
    if (errorState) return;
    current = formatNumber(Number(current) / 100);
    waitingForOperand = false;
    justCalculated = false;
    setMessage("Converted to percent");
    render();
  }

  function handleAction(action) {
    switch (action) {
      case "clear": clearAll(); break;
      case "delete": deleteLast(); break;
      case "decimal": inputDecimal(); break;
      case "equals": equals(); break;
      case "sign": toggleSign(); break;
      case "percent": percent(); break;
    }
  }

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.number !== undefined) inputDigit(button.dataset.number);
    else if (button.dataset.operator) chooseOperator(button.dataset.operator);
    else if (button.dataset.action) handleAction(button.dataset.action);
  });

  document.addEventListener("keydown", (event) => {
    if (/^\d$/.test(event.key)) {
      inputDigit(event.key);
      event.preventDefault();
    } else if (event.key === "." || event.key === ",") {
      inputDecimal();
      event.preventDefault();
    } else if (event.key === "+") {
      chooseOperator("+");
      event.preventDefault();
    } else if (event.key === "-") {
      chooseOperator("−");
      event.preventDefault();
    } else if (event.key === "*") {
      chooseOperator("×");
      event.preventDefault();
    } else if (event.key === "/") {
      chooseOperator("÷");
      event.preventDefault();
    } else if (event.key === "Enter" || event.key === "=") {
      equals();
      event.preventDefault();
    } else if (event.key === "Backspace") {
      deleteLast();
      event.preventDefault();
    } else if (event.key === "Escape" || event.key.toLowerCase() === "c") {
      clearAll();
      event.preventDefault();
    } else if (event.key === "%") {
      percent();
      event.preventDefault();
    }
  });

  render(false);
})();
