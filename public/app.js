// app.js

// Initial Application State
const STATE_KEY = 'finai_budget_state';
const DEFAULT_STATE = {
  currency: '₹',
  income: 0,
  otherIncome: 0,
  expenses: {
    housing: 0,
    food: 0,
    transportation: 0,
    utilities: 0,
    healthcare: 0,
    education: 0,
    entertainment: 0,
    shopping: 0,
    investments: 0,
    savings: 0,
    miscellaneous: 0
  },
  debt: 0,
  currentSavings: 0,
  savingsGoal: 0,
  financialGoals: '',
  setupStep: 1, // 1: Income, 2: Housing, 3: Food, 4: Transport, 5: Utilities, 6: Healthcare, 7: Education, 8: Entertainment, 9: Shopping, 10: Debt, 11: Savings & Goal, 12: Financial Goals, 13: Completed
  chatHistory: []
};

let state = JSON.parse(localStorage.getItem(STATE_KEY)) || { ...DEFAULT_STATE };

// Category Metadata
const categoryMeta = {
  housing: { label: 'Housing (Rent/EMI)', icon: 'fa-house', color: '#ff7043', suggestedPct: 25 },
  food: { label: 'Food & Groceries', icon: 'fa-utensils', color: '#ffb74d', suggestedPct: 12 },
  transportation: { label: 'Transportation', icon: 'fa-car', color: '#4db6ac', suggestedPct: 8 },
  utilities: { label: 'Utilities & Bills', icon: 'fa-bolt', color: '#81c784', suggestedPct: 7 },
  healthcare: { label: 'Healthcare & Medical', icon: 'fa-suitcase-medical', color: '#e57373', suggestedPct: 5 },
  education: { label: 'Education', icon: 'fa-graduation-cap', color: '#ba68c8', suggestedPct: 5 },
  entertainment: { label: 'Entertainment', icon: 'fa-gamepad', color: '#f06292', suggestedPct: 8 },
  shopping: { label: 'Shopping', icon: 'fa-bag-shopping', color: '#ff8a65', suggestedPct: 5 },
  investments: { label: 'Investments', icon: 'fa-chart-line', color: '#64b5f6', suggestedPct: 10 },
  savings: { label: 'Savings Account', icon: 'fa-piggy-bank', color: '#81c784', suggestedPct: 10 },
  miscellaneous: { label: 'Miscellaneous', icon: 'fa-asterisk', color: '#a1887f', suggestedPct: 5 }
};

// Conversational Prompts Map
const prompts = {
  1: {
    question: "Let's start with your income details. <strong>What is your total monthly income?</strong> (Include your base salary plus any other income sources like freelance work or rent).",
    suggestions: ["₹30,000", "₹50,000", "₹1,00,000", "✨ Load Demo Data"],
    placeholder: "e.g., 50000 or salary 60000 + 5000 freelance"
  },
  2: {
    question: "Got it! Next, what are your <strong>monthly Housing expenses (Rent or EMI)?</strong>",
    suggestions: ["₹10,000", "₹15,000", "₹25,000", "Skip/0"],
    placeholder: "e.g., 12000 or 0 if own home"
  },
  3: {
    question: "Understood. How much do you spend on average per month on <strong>Food & Groceries?</strong>",
    suggestions: ["₹5,000", "₹8,000", "₹12,000", "₹15,000"],
    placeholder: "e.g., 7000 or 250/day"
  },
  4: {
    question: "Great. What are your monthly <strong>Transportation expenses?</strong> (Include fuel, public transport, vehicle maintenance, taxi services, etc.)",
    suggestions: ["₹2,000", "₹4,000", "₹6,000", "Skip/0"],
    placeholder: "e.g., 3000"
  },
  5: {
    question: "Got that down. What are your average monthly <strong>Utility bills?</strong> (Electricity, water, gas, internet, mobile bills, etc.)",
    suggestions: ["₹2,500", "₹4,000", "₹6,000"],
    placeholder: "e.g., 3500"
  },
  6: {
    question: "Understood. How much do you allocate or spend monthly on <strong>Healthcare & Medical</strong> expenses? (Insurance premiums, medicines, checkups)",
    suggestions: ["₹1,000", "₹2,000", "₹4,000", "Skip/0"],
    placeholder: "e.g., 2000"
  },
  7: {
    question: "Next, do you have monthly <strong>Education expenses?</strong> (Self courses, kids' school fees, tutorials, books)",
    suggestions: ["₹2,000", "₹5,000", "Skip/0"],
    placeholder: "e.g., 3000"
  },
  8: {
    question: "Now for leisure: what is your monthly budget for <strong>Entertainment & Dinouts?</strong> (Movies, streaming subscriptions, outings, clubs)",
    suggestions: ["₹2,000", "₹4,000", "₹6,000", "Skip/0"],
    placeholder: "e.g., 2500"
  },
  9: {
    question: "Got it. How much do you spend monthly on <strong>Shopping?</strong> (Clothing, gadgets, home decor, personal care, etc.)",
    suggestions: ["₹2,000", "₹4,000", "₹6,000", "Skip/0"],
    placeholder: "e.g., 3000"
  },
  10: {
    question: "Next, what is your total monthly payment toward <strong>Loans, Debts, or Credit Cards?</strong>",
    suggestions: ["₹5,000", "₹10,000", "₹15,000", "None"],
    placeholder: "e.g., 5000 or 0"
  },
  11: {
    question: "Excellent. Let's talk about savings. <strong>What is your current total savings?</strong> And, what is your <strong>monthly savings goal?</strong> (e.g. 'I have 50000 saved, and want to save 15000/month')",
    suggestions: ["Goal: ₹10,000", "Goal: ₹20,000", "Goal: 20% of Income"],
    placeholder: "e.g., saved 50000, goal 10000"
  },
  12: {
    question: "Finally, what are your major <strong>financial goals?</strong> (e.g. Buy a car, house down payment, emergency fund, travel, retirement)",
    suggestions: ["Emergency Fund", "Buy a Car", "Travel Plan", "Retirement Fund"],
    placeholder: "e.g., House downpayment in 3 years"
  }
};

// UI Selectors
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const inputSuggestions = document.getElementById('input-suggestions');
const stepBadge = document.getElementById('step-badge-ui');
const currencySelector = document.getElementById('currency');
const resetBtn = document.getElementById('reset-btn');

// Dashboard Selectors
const displayIncome = document.getElementById('display-income');
const displayOtherIncome = document.getElementById('display-other-income');
const displayExpenses = document.getElementById('display-expenses');
const displayExpensePercentage = document.getElementById('display-expense-percentage');
const displayBalance = document.getElementById('display-balance');
const displaySavingsRate = document.getElementById('display-savings-rate');
const setupPercent = document.getElementById('setup-percent');
const setupProgressFill = document.getElementById('setup-progress-fill');
const donutSegmentFill = document.getElementById('donut-segment-fill');
const donutCenterValue = document.getElementById('donut-center-value');
const chartLegend = document.getElementById('chart-legend');
const displayGoalValue = document.getElementById('display-goal-value');
const displayGoalStatus = document.getElementById('display-goal-status');
const goalProgressFill = document.getElementById('goal-progress-fill');
const projectedMonthly = document.getElementById('projected-monthly');
const projectedYearly = document.getElementById('projected-yearly');
const recommendationsList = document.getElementById('recommendations-list');
const budgetTableBody = document.getElementById('budget-table-body');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const dataStatusBadge = document.getElementById('data-status-badge');

// Tab Selection Logic
document.querySelectorAll('.sidebar-nav li').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    item.classList.add('active');
    
    const tabName = item.getAttribute('data-tab');
    const headerTitle = document.getElementById('page-title');
    const headerSubtitle = document.getElementById('page-subtitle');
    
    if (tabName === 'assistant') {
      headerTitle.textContent = 'AI Budget Planner';
      headerSubtitle.textContent = 'Conversational financial planning powered by AI';
      document.getElementById('chat-section').style.display = 'flex';
    } else if (tabName === 'dashboard') {
      headerTitle.textContent = 'Financial Dashboard';
      headerSubtitle.textContent = 'Interactive overview of your cashflow & charts';
      document.getElementById('chat-section').style.display = 'none';
    } else if (tabName === 'planner') {
      headerTitle.textContent = 'Interactive Budget Sheet';
      headerSubtitle.textContent = 'Tweak allocation details directly to suit your needs';
      document.getElementById('chat-section').style.display = 'none';
      setTimeout(() => {
        const tableCard = document.querySelector('.table-card');
        if (tableCard) tableCard.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (tabName === 'tips') {
      headerTitle.textContent = 'Smart Financial Tips';
      headerSubtitle.textContent = 'Actionable financial best practices & rules of thumb';
      document.getElementById('chat-section').style.display = 'none';
      setTimeout(() => {
        const recCard = document.querySelector('.recommendations-card');
        if (recCard) recCard.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  });
});

// App Initialization
function init() {
  setupAuthUI();
  
  if (state.chatHistory.length === 0) {
    addAgentMessage("Hello! I'm your AI Budget Planning Assistant. I'll help you create a personalized budget and improve your financial planning.");
    askNextQuestion();
  } else {
    renderChatHistory();
    updateDashboard();
  }
  
  // Setup Currency change
  currencySelector.value = state.currency;
  currencySelector.addEventListener('change', (e) => {
    state.currency = e.target.value;
    saveState();
    updateDashboard();
    showNotification("Currency updated to " + state.currency);
  });
  
  // Setup Reset Button
  resetBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset your budget plan? This will clear all data.")) {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      state.chatHistory = [];
      saveState();
      chatMessages.innerHTML = '';
      addAgentMessage("Hello! I'm your AI Budget Planning Assistant. I'll help you create a personalized budget and improve your financial planning.");
      askNextQuestion();
      updateDashboard();
      showNotification("State reset successfully!");
    }
  });
  
  // Setup chat form submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    chatInput.value = '';
    handleUserResponse(text);
  });

  // Handle quick replies dynamically (event delegation on chatMessages)
  chatMessages.addEventListener('click', (e) => {
    if (e.target.classList.contains('quick-reply-btn')) {
      const val = e.target.getAttribute('data-value');
      if (val) {
        addUserMessage(val);
        handleUserResponse(val);
      }
    }
  });

  // Verify and sync token on load
  const token = localStorage.getItem('finai_auth_token');
  if (token) {
    loadStateFromCloud();
  }
}

// Save & Sync State
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  syncStateToCloud();
}

async function syncStateToCloud() {
  const token = localStorage.getItem('finai_auth_token');
  if (!token) return;
  
  try {
    await fetch('/api/budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currency: state.currency,
        income: state.income,
        otherIncome: state.otherIncome,
        expenses: state.expenses,
        debt: state.debt,
        currentSavings: state.currentSavings,
        savingsGoal: state.savingsGoal,
        financialGoals: state.financialGoals
      })
    });
  } catch (err) {
    console.warn("Cloud sync failed:", err.message);
  }
}

async function loadStateFromCloud() {
  const token = localStorage.getItem('finai_auth_token');
  if (!token) return;
  
  try {
    const response = await fetch('/api/budget', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.budget) {
        state.currency = data.budget.currency || '₹';
        state.income = data.budget.income || 0;
        state.otherIncome = data.budget.otherIncome || 0;
        state.expenses = data.budget.expenses || { ...DEFAULT_STATE.expenses };
        state.debt = data.budget.debt || 0;
        state.currentSavings = data.budget.currentSavings || 0;
        state.savingsGoal = data.budget.savingsGoal || 0;
        state.financialGoals = data.budget.financialGoals || '';
        state.setupStep = 13;
        
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        updateDashboard();
        addAgentMessage("☁️ <strong>Synced with Cloud!</strong> I have loaded your saved budget plan from the secure database.");
      }
    }
  } catch (err) {
    console.error("Cloud load failed:", err);
  }
}

// Chat UI Utilities
function addAgentMessage(htmlContent) {
  const msg = document.createElement('div');
  msg.className = 'message agent';
  msg.innerHTML = `
    <div class="message-content">
      <p>${htmlContent}</p>
      <span class="time">${getCurrentTimeString()}</span>
    </div>
  `;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  state.chatHistory.push({ sender: 'agent', content: htmlContent });
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function addUserMessage(text) {
  const msg = document.createElement('div');
  msg.className = 'message user';
  msg.innerHTML = `
    <div class="message-content">
      <p>${escapeHTML(text)}</p>
      <span class="time">${getCurrentTimeString()}</span>
    </div>
  `;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  state.chatHistory.push({ sender: 'user', content: text });
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function renderChatHistory() {
  chatMessages.innerHTML = '';
  state.chatHistory.forEach(msg => {
    const div = document.createElement('div');
    div.className = `message ${msg.sender}`;
    div.innerHTML = `
      <div class="message-content">
        <p>${msg.content}</p>
        <span class="time">Saved</span>
      </div>
    `;
    chatMessages.appendChild(div);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function getCurrentTimeString() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showNotification(message, isSuccess = true) {
  notificationMessage.textContent = message;
  const icon = document.getElementById('notification-icon');
  if (isSuccess) {
    icon.className = 'fa-solid fa-circle-check';
    icon.style.color = 'var(--color-income)';
  } else {
    icon.className = 'fa-solid fa-triangle-exclamation';
    icon.style.color = 'var(--color-expense)';
  }
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 3500);
}

// Conversation Parser logic
function handleUserResponse(text) {
  const step = state.setupStep;
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('demo') || lowercaseText.includes('auto') || lowercaseText.includes('fill')) {
    autoFillDemo();
    return;
  }
  
  switch (step) {
    case 1:
      const baseIncome = extractFirstNumber(text);
      if (isNaN(baseIncome) || baseIncome <= 0) {
        addAgentMessage("I couldn't quite catch your income amount. Please enter a valid number (e.g. 50000 or 75000).");
        return;
      }
      const multipleNumbers = extractAllNumbers(text);
      state.income = baseIncome;
      state.otherIncome = multipleNumbers.length > 1 ? multipleNumbers.slice(1).reduce((a, b) => a + b, 0) : 0;
      state.setupStep = 2;
      break;
      
    case 2:
      const housingVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(housingVal)) {
        addAgentMessage("Please provide a monthly housing payment or enter '0' if you don't have housing rent/EMI.");
        return;
      }
      state.expenses.housing = housingVal;
      state.setupStep = 3;
      break;
      
    case 3:
      const foodVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(foodVal)) {
        addAgentMessage("Please enter a typical monthly spending on food/groceries.");
        return;
      }
      state.expenses.food = foodVal;
      state.setupStep = 4;
      break;
      
    case 4:
      const transportVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(transportVal)) {
        addAgentMessage("Please specify your monthly transportation costs or enter '0' if none.");
        return;
      }
      state.expenses.transportation = transportVal;
      state.setupStep = 5;
      break;
      
    case 5:
      const utilitiesVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(utilitiesVal)) {
        addAgentMessage("Please enter your average monthly utility bills (electricity, phone, internet, water).");
        return;
      }
      state.expenses.utilities = utilitiesVal;
      state.setupStep = 6;
      break;
      
    case 6:
      const healthcareVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(healthcareVal)) {
        addAgentMessage("Please specify healthcare/medical expenses or insurance costs (or enter '0').");
        return;
      }
      state.expenses.healthcare = healthcareVal;
      state.setupStep = 7;
      break;
      
    case 7:
      const educationVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(educationVal)) {
        addAgentMessage("Please list monthly education spending or fees (or enter '0').");
        return;
      }
      state.expenses.education = educationVal;
      state.setupStep = 8;
      break;
      
    case 8:
      const entertainmentVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(entertainmentVal)) {
        addAgentMessage("Please specify monthly leisure/entertainment expenses (or enter '0').");
        return;
      }
      state.expenses.entertainment = entertainmentVal;
      state.setupStep = 9;
      break;
      
    case 9:
      const shoppingVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(shoppingVal)) {
        addAgentMessage("Please list average monthly shopping/lifestyle expenses (or enter '0').");
        return;
      }
      state.expenses.shopping = shoppingVal;
      state.setupStep = 10;
      break;
      
    case 10:
      const debtVal = isSkipOrZero(text) ? 0 : extractFirstNumber(text);
      if (isNaN(debtVal)) {
        addAgentMessage("Please list credit card/loan EMI payments (or enter '0').");
        return;
      }
      state.debt = debtVal;
      state.setupStep = 11;
      break;
      
    case 11:
      const numbers = extractAllNumbers(text);
      if (numbers.length === 0) {
        addAgentMessage("Please specify your current savings or monthly savings goal (e.g. 'I want to save 10000').");
        return;
      }
      if (numbers.length === 1) {
        state.savingsGoal = numbers[0];
      } else {
        state.currentSavings = numbers[0];
        state.savingsGoal = numbers[1];
      }
      state.setupStep = 12;
      break;
      
    case 12:
      state.financialGoals = text;
      state.setupStep = 13;
      break;
      
    default:
      handleUpdateConversational(text);
      return;
  }
  
  saveState();
  updateDashboard();
  askNextQuestion();
}

// Conversation Question Engine
function askNextQuestion() {
  const step = state.setupStep;
  
  if (step === 13) {
    generateFinalAnalysis();
    return;
  }
  
  const stepPrompt = prompts[step];
  if (!stepPrompt) return;
  
  stepBadge.textContent = `Step 2: Collect Info (${step}/12)`;
  chatInput.placeholder = stepPrompt.placeholder;
  renderSuggestions(stepPrompt.suggestions);
  
  setTimeout(() => {
    addAgentMessage(stepPrompt.question);
  }, 400);
}

// Auto-fill Demo Data Helper
function autoFillDemo() {
  state.currency = '₹';
  state.income = 60000;
  state.otherIncome = 5000;
  state.expenses = {
    housing: 15000,
    food: 8000,
    transportation: 4000,
    utilities: 3500,
    healthcare: 2000,
    education: 1500,
    entertainment: 5000,
    shopping: 4500,
    investments: 5000,
    savings: 10000,
    miscellaneous: 1500
  };
  state.debt = 3000;
  state.currentSavings = 45000;
  state.savingsGoal = 15000;
  state.financialGoals = "Buy a new laptop (₹80k) & create an emergency fund";
  state.setupStep = 13;
  
  saveState();
  updateDashboard();
  
  addAgentMessage("✨ <strong>Demo profile loaded successfully!</strong> I've populated the planner with sample financial values. Let's analyze your results below.");
  generateFinalAnalysis();
  showNotification("Demo data populated");
}

// Conversational Updates Handler
function handleUpdateConversational(text) {
  const lowercaseText = text.toLowerCase();
  let matched = false;
  
  if (lowercaseText.includes('income') || lowercaseText.includes('salary')) {
    const num = extractFirstNumber(text);
    if (!isNaN(num)) {
      state.income = num;
      matched = true;
      addAgentMessage(`Understood! I've updated your <strong>Monthly Income</strong> to ${formatVal(num)}. Recalculating your budget...`);
    }
  }
  
  if (lowercaseText.includes('goal')) {
    const num = extractFirstNumber(text);
    if (!isNaN(num)) {
      state.savingsGoal = num;
      matched = true;
      addAgentMessage(`Got it! I've updated your <strong>Monthly Savings Goal</strong> to ${formatVal(num)}.`);
    }
  }

  for (const cat in categoryMeta) {
    const catLabel = categoryMeta[cat].label.toLowerCase();
    const cleanLabel = cat.toLowerCase();
    if (lowercaseText.includes(cleanLabel) || lowercaseText.includes(catLabel.split(' ')[0])) {
      const num = extractFirstNumber(text);
      if (!isNaN(num)) {
        state.expenses[cat] = num;
        matched = true;
        addAgentMessage(`Done! Your <strong>${categoryMeta[cat].label}</strong> expense has been set to ${formatVal(num)}.`);
      }
    }
  }
  
  if (matched) {
    saveState();
    updateDashboard();
    generateFinalAnalysis();
  } else {
    // Contact Gemini API on backend
    callServerChatbot(text);
  }
}

// Network Request to AI Chatbot Endpoint
async function callServerChatbot(userMessage) {
  // Add a beautiful typing indicator
  const typingBubble = document.createElement('div');
  typingBubble.className = 'message agent typing-indicator';
  typingBubble.innerHTML = `
    <div class="message-content" style="display: flex; align-items: center; gap: 0.5rem; color: var(--accent-blue);">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>FinAI is thinking...</span>
    </div>
  `;
  chatMessages.appendChild(typingBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const recentHistory = state.chatHistory.slice(-8);
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        history: recentHistory
      })
    });
    
    typingBubble.remove();
    
    if (!response.ok) throw new Error("Server communication failed.");
    
    const data = await response.json();
    addAgentMessage(data.reply);
  } catch (err) {
    typingBubble.remove();
    addAgentMessage("I ran into an issue connecting with the Gemini API server. Here's a tip: follow the <strong>50/30/20 rule</strong> to maintain a solid balance! Let me know what specific budget tweaks you want to make.");
    console.error("Gemini sync failed:", err);
  }
}

// Generate the final rich analysis inside the chatbot
function generateFinalAnalysis() {
  stepBadge.textContent = "Complete";
  chatInput.placeholder = "Ask general financial questions or adjust details...";
  renderSuggestions(["Adjust Income", "Update Food", "Show Savings Plan", "Reset Plan"]);
  
  const totalInc = state.income + state.otherIncome;
  const totalExp = calculateTotalExpenses();
  const balance = totalInc - totalExp;
  const savingsPct = totalInc > 0 ? Math.round((balance / totalInc) * 100) : 0;
  
  let analysisHtml = `
    <strong>🎉 Budget Setup Finalized!</strong><br><br>
    Based on your information, here is your initial overview:<br>
    • <strong>Total Income:</strong> ${formatVal(totalInc)}<br>
    • <strong>Total Scheduled Expenses:</strong> ${formatVal(totalExp)}<br>
    • <strong>Net Monthly Savings:</strong> ${formatVal(balance)} (${savingsPct}% of income)<br><br>
    <em>Top spending categories:</em> ${getTopCategoriesText()}<br><br>
    I have updated your <strong>Financial Dashboard</strong> with detailed breakdowns, interactive budget suggestions, savings timeline projections, and recommendations. Take a look at the panels on the right!
  `;
  
  addAgentMessage(analysisHtml);
}

// Render input suggestion chips
function renderSuggestions(list) {
  inputSuggestions.innerHTML = '';
  if (!list || list.length === 0) {
    inputSuggestions.style.display = 'none';
    return;
  }
  
  list.forEach(item => {
    const chip = document.createElement('div');
    chip.className = 'suggestion-chip';
    chip.textContent = item;
    chip.addEventListener('click', () => {
      let sendVal = item;
      if (item === 'Skip/0' || item === 'None') sendVal = '0';
      else if (item.startsWith('Goal: ')) sendVal = item.replace('Goal: ', '');
      
      addUserMessage(sendVal);
      handleUserResponse(sendVal);
    });
    inputSuggestions.appendChild(chip);
  });
  inputSuggestions.style.display = 'flex';
}

// Math Utility Parsers
function extractFirstNumber(text) {
  const cleanText = text.replace(/,/g, '');
  const matchK = cleanText.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (matchK) return parseFloat(matchK[1]) * 1000;
  
  const matchNum = cleanText.match(/\d+/);
  return matchNum ? parseInt(matchNum[0], 10) : NaN;
}

function extractAllNumbers(text) {
  const cleanText = text.replace(/,/g, '');
  const regex = /(\d+(?:\.\d+)?)\s*k\b|\b\d+\b/gi;
  let matches = [];
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    if (match[0].toLowerCase().endsWith('k')) {
      matches.push(parseFloat(match[1]) * 1000);
    } else {
      matches.push(parseInt(match[0], 10));
    }
  }
  return matches;
}

function isSkipOrZero(text) {
  const t = text.toLowerCase();
  return t.includes('skip') || t === '0' || t.includes('none') || t.includes('no');
}

// Calculations & Dashboard Updates
function calculateTotalExpenses() {
  let total = 0;
  for (const cat in state.expenses) {
    total += state.expenses[cat];
  }
  return total + state.debt;
}

function formatVal(num) {
  return state.currency + Number(num).toLocaleString('en-IN');
}

function getTopCategoriesText() {
  const sorted = Object.keys(state.expenses)
    .filter(cat => state.expenses[cat] > 0)
    .sort((a, b) => state.expenses[b] - state.expenses[a]);
  
  if (sorted.length === 0) return 'None';
  return sorted.slice(0, 3).map(cat => `<strong>${categoryMeta[cat].label}</strong> (${formatVal(state.expenses[cat])})`).join(', ');
}

function updateDashboard() {
  const totalInc = state.income + state.otherIncome;
  const totalExp = calculateTotalExpenses();
  const balance = totalInc - totalExp;
  const expensePct = totalInc > 0 ? Math.round((totalExp / totalInc) * 100) : 0;
  const savingsPct = totalInc > 0 ? Math.round((balance / totalInc) * 100) : 0;
  
  displayIncome.textContent = formatVal(state.income);
  displayOtherIncome.textContent = `Other sources: ${formatVal(state.otherIncome)}`;
  displayExpenses.textContent = formatVal(totalExp);
  displayExpensePercentage.textContent = `Expense Rate: ${expensePct}%`;
  
  displayBalance.textContent = formatVal(balance);
  displaySavingsRate.textContent = `Savings Rate: ${savingsPct}%`;
  
  const percent = Math.min(Math.round((state.setupStep / 13) * 100), 100);
  setupPercent.textContent = `${percent}%`;
  setupProgressFill.style.width = `${percent}%`;
  
  if (state.setupStep === 13) {
    dataStatusBadge.textContent = 'Active Plan';
    dataStatusBadge.className = 'badge active';
  } else {
    dataStatusBadge.textContent = 'Awaiting Setup';
    dataStatusBadge.className = 'badge';
  }
  
  updateDonutChart(totalExp);
  updateSavingsGoals(balance);
  updateRecommendationsAndInsights(totalInc, totalExp, balance, savingsPct);
  updateBudgetTable(totalInc);
}

function updateDonutChart(totalExp) {
  chartLegend.innerHTML = '';
  
  if (totalExp === 0) {
    donutSegmentFill.style.strokeDashoffset = 251.2;
    donutCenterValue.textContent = '0%';
    chartLegend.innerHTML = '<p class="no-data-msg">No expense data logged yet. Converse with FinAI to populate details.</p>';
    return;
  }
  
  donutSegmentFill.style.strokeDashoffset = 0;
  donutCenterValue.textContent = `${Math.min(100, Math.round((totalExp / (state.income + state.otherIncome || 1)) * 100))}%`;
  
  const sorted = Object.keys(state.expenses)
    .filter(cat => state.expenses[cat] > 0)
    .sort((a, b) => state.expenses[b] - state.expenses[a]);
    
  if (state.debt > 0) sorted.push('debt');
  
  sorted.forEach(cat => {
    let name, val, color;
    if (cat === 'debt') {
      name = 'Debt / Loan EMI';
      val = state.debt;
      color = '#ff1744';
    } else {
      name = categoryMeta[cat].label;
      val = state.expenses[cat];
      color = categoryMeta[cat].color;
    }
    
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-color-label">
        <span class="legend-color-dot" style="background-color: ${color}"></span>
        <span>${name}</span>
      </div>
      <span class="legend-value">${formatVal(val)}</span>
    `;
    chartLegend.appendChild(item);
  });
}

function updateSavingsGoals(monthlySavings) {
  displayGoalValue.textContent = state.savingsGoal > 0 ? formatVal(state.savingsGoal) : '—';
  
  if (state.setupStep < 13 || monthlySavings <= 0) {
    displayGoalStatus.textContent = 'Awaiting budget details';
    goalProgressFill.style.width = '0%';
    projectedMonthly.textContent = '—';
    projectedYearly.textContent = '—';
    return;
  }
  
  projectedMonthly.textContent = formatVal(monthlySavings);
  projectedYearly.textContent = formatVal(monthlySavings * 12);
  
  if (state.savingsGoal > 0) {
    const goalPct = Math.min(100, Math.round((monthlySavings / state.savingsGoal) * 100));
    goalProgressFill.style.width = `${goalPct}%`;
    displayGoalStatus.textContent = goalPct >= 100 ? `🎉 Goal reached! Saving ${goalPct}% of target.` : `Reaching ${goalPct}% of monthly target.`;
  } else {
    displayGoalStatus.textContent = 'No target savings goal specified.';
    goalProgressFill.style.width = '0%';
  }
}

function updateRecommendationsAndInsights(totalInc, totalExp, balance, savingsPct) {
  recommendationsList.innerHTML = '';
  
  if (state.setupStep < 13) {
    recommendationsList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-receipt"></i>
        <p>Provide your budget details to generate smart insights & recommendations.</p>
      </div>
    `;
    return;
  }
  
  let insights = [];
  
  if (balance < 0) {
    insights.push({
      type: 'warning',
      title: 'Monthly Cash Deficit!',
      text: `Your monthly expenses exceed income by ${formatVal(Math.abs(balance))}. Reduce entertainment or shopping immediately.`
    });
  }
  
  if (state.debt > 0) {
    insights.push({
      type: 'warning',
      title: 'Active Debt Payments',
      text: `You have ${formatVal(state.debt)} in active EMIs. Prioritize card/loan repayment using the Avalanche method.`
    });
  }
  
  if (savingsPct < 20 && balance >= 0) {
    insights.push({
      type: 'tip',
      title: 'Boost Savings rate to 20%',
      text: `Your current rate is ${savingsPct}%. Allocate at least 20% (${formatVal(totalInc * 0.2)}) toward emergency savings.`
    });
  } else if (savingsPct >= 20) {
    insights.push({
      type: 'success',
      title: 'Healthy Savings Rate!',
      text: `Great! Saving ${savingsPct}% of income builds rapid financial protection.`
    });
  }
  
  const housingPct = totalInc > 0 ? (state.expenses.housing / totalInc) * 100 : 0;
  if (housingPct > 30) {
    insights.push({
      type: 'warning',
      title: 'High Housing Costs',
      text: `Housing consumes ${Math.round(housingPct)}% of income (recommended limit is 30%).`
    });
  }
  
  const leisureVal = state.expenses.entertainment + state.expenses.shopping;
  const leisurePct = totalInc > 0 ? (leisureVal / totalInc) * 100 : 0;
  if (leisurePct > 15) {
    insights.push({
      type: 'warning',
      title: 'Elevated Leisure Spending',
      text: `Leisure spending is at ${Math.round(leisurePct)}%. Consider capping wants to 15% to boost investments.`
    });
  }
  
  const avgEssentials = state.expenses.housing + state.expenses.food + state.expenses.utilities;
  const emergencyTargetMin = avgEssentials * 3;
  if (state.currentSavings > 0) {
    if (state.currentSavings < emergencyTargetMin) {
      insights.push({
        type: 'tip',
        title: 'Emergency Fund Check',
        text: `Your current savings cover less than 3 months of basic needs (${formatVal(emergencyTargetMin)}).`
      });
    } else {
      insights.push({
        type: 'success',
        title: 'Emergency Fund Ready!',
        text: `You have over 3 months of essential emergency backup. Ready to start investing!`
      });
    }
  }
  
  insights.push({
    type: 'tip',
    title: 'Follow the 50/30/20 Rule',
    text: 'Allocate 50% to Needs (bills, groceries), 30% to Wants (dining, cinema), and 20% to Savings or debt paydown.'
  });
  
  insights.forEach(ins => {
    const card = document.createElement('div');
    card.className = `insight-card ${ins.type}`;
    let iconClass = ins.type === 'warning' ? 'fa-circle-exclamation' : (ins.type === 'success' ? 'fa-circle-check' : 'fa-lightbulb');
    card.innerHTML = `
      <i class="fa-solid ${iconClass} insight-icon"></i>
      <div class="insight-text">
        <h4>${ins.title}</h4>
        <p>${ins.text}</p>
      </div>
    `;
    recommendationsList.appendChild(card);
  });
}

function updateBudgetTable(totalInc) {
  budgetTableBody.innerHTML = '';
  
  if (state.setupStep < 13 || totalInc === 0) {
    budgetTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5" style="text-align: center; padding: 2rem;">No data entries. Converse with the agent to create your budget sheet.</td>
      </tr>
    `;
    return;
  }
  
  for (const cat in categoryMeta) {
    const meta = categoryMeta[cat];
    const actualVal = state.expenses[cat] || 0;
    const suggestedVal = Math.round(totalInc * (meta.suggestedPct / 100));
    
    let statusClass = 'optimal';
    let statusText = 'Optimal';
    
    if (actualVal > suggestedVal) {
      statusClass = 'over';
      statusText = 'Over limit';
    } else if (actualVal < suggestedVal && actualVal > 0) {
      statusClass = 'under';
      statusText = 'Under limit';
    } else if (actualVal === 0) {
      statusClass = 'optimal';
      statusText = 'Zeroed';
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <i class="fa-solid ${meta.icon}" style="color: ${meta.color}; margin-right: 0.5rem; width: 16px;"></i>
        <strong>${meta.label}</strong>
      </td>
      <td>${meta.suggestedPct}%</td>
      <td>${formatVal(suggestedVal)}</td>
      <td class="actual-input-cell">
        <input type="number" class="cell-input" data-category="${cat}" value="${actualVal}" min="0">
      </td>
      <td>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </td>
    `;
    
    budgetTableBody.appendChild(tr);
  }
  
  document.querySelectorAll('.cell-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const cat = e.target.getAttribute('data-category');
      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
      
      state.expenses[cat] = val;
      saveState();
      updateDashboard();
      
      addAgentMessage(`📝 <em>[System Notice]</em> I noticed you updated <strong>${categoryMeta[cat].label}</strong> to ${formatVal(val)} via the Interactive Budget Sheet. I have recalculated your planning snapshot.`);
      showNotification(`${categoryMeta[cat].label} updated!`);
    });
  });
}

// User Authentication Section Handler
function setupAuthUI() {
  const loginContainer = document.getElementById('login-container');
  
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const authForm = document.getElementById('auth-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  
  const btnGuestMode = document.getElementById('btn-guest-mode');
  const sidebarBtnSync = document.getElementById('sidebar-btn-sync');
  
  const btnLogout = document.getElementById('btn-logout');
  
  const authUnlogged = document.getElementById('auth-unlogged');
  const authLogged = document.getElementById('auth-logged');
  const loggedUsername = document.getElementById('logged-username');
  
  let currentAuthMode = 'login'; // 'login' or 'register'
  
  // Toggle password visibility
  btnTogglePassword.addEventListener('click', () => {
    const isPassword = loginPasswordInput.type === 'password';
    loginPasswordInput.type = isPassword ? 'text' : 'password';
    btnTogglePassword.innerHTML = `<i class="fa-solid ${isPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
  });
  
  // Switch to Login tab
  tabLoginBtn.addEventListener('click', () => {
    currentAuthMode = 'login';
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    authSubmitBtn.innerHTML = `<span>Sign In</span> <i class="fa-solid fa-right-to-bracket"></i>`;
  });
  
  // Switch to Register tab
  tabRegisterBtn.addEventListener('click', () => {
    currentAuthMode = 'register';
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    authSubmitBtn.innerHTML = `<span>Create Account</span> <i class="fa-solid fa-user-plus"></i>`;
  });
  
  // Helper to enter App (Guest or Logged In)
  function enterApp(isGuest = false) {
    loginContainer.classList.add('hidden');
    
    if (isGuest) {
      if (authUnlogged) authUnlogged.style.display = 'block';
      if (authLogged) authLogged.style.display = 'none';
      showNotification("Running in local Guest mode.");
    } else {
      if (authUnlogged) authUnlogged.style.display = 'none';
      if (authLogged) authLogged.style.display = 'flex';
      const username = localStorage.getItem('finai_auth_user');
      if (loggedUsername) loggedUsername.textContent = username || 'User';
    }
  }
  
  // Guest Mode
  btnGuestMode.addEventListener('click', () => {
    enterApp(true);
  });
  
  // Sidebar Sync Button (re-opens Auth Screen)
  if (sidebarBtnSync) {
    sidebarBtnSync.addEventListener('click', () => {
      loginContainer.classList.remove('hidden');
      loginUsernameInput.focus();
    });
  }
  
  // Auth Submit (Login / Register)
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    
    if (!username || !password) {
      showNotification("Please enter username and password.", false);
      return;
    }
    
    // Disable inputs and show loading state
    authSubmitBtn.disabled = true;
    const origContent = authSubmitBtn.innerHTML;
    authSubmitBtn.innerHTML = `<span>Connecting...</span> <i class="fa-solid fa-circle-notch fa-spin"></i>`;
    
    const endpoint = currentAuthMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      authSubmitBtn.disabled = false;
      authSubmitBtn.innerHTML = origContent;
      
      if (!response.ok) {
        showNotification(data.message || data.detail || `${currentAuthMode} failed`, false);
        return;
      }
      
      localStorage.setItem('finai_auth_token', data.token);
      localStorage.setItem('finai_auth_user', data.username);
      
      loginUsernameInput.value = '';
      loginPasswordInput.value = '';
      
      showNotification(currentAuthMode === 'login' ? `Welcome back, ${data.username}!` : "Registration successful!");
      enterApp(false);
      
      if (currentAuthMode === 'login') {
        await loadStateFromCloud();
      } else {
        syncStateToCloud();
      }
      
    } catch (error) {
      authSubmitBtn.disabled = false;
      authSubmitBtn.innerHTML = origContent;
      showNotification("Could not connect to authentication server.", false);
      console.error(error);
    }
  });
  
  // Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('finai_auth_token');
      localStorage.removeItem('finai_auth_user');
      
      // Clear state or reset back to default
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      state.chatHistory = [];
      saveState();
      
      chatMessages.innerHTML = '';
      addAgentMessage("Hello! I'm your AI Budget Planning Assistant. I'll help you create a personalized budget and improve your financial planning.");
      askNextQuestion();
      updateDashboard();
      
      if (authUnlogged) authUnlogged.style.display = 'block';
      if (authLogged) authLogged.style.display = 'none';
      
      loginContainer.classList.remove('hidden');
      showNotification("Logged out successfully.");
    });
  }
  
  // Initial check on load
  const token = localStorage.getItem('finai_auth_token');
  const savedUser = localStorage.getItem('finai_auth_user');
  
  if (token && savedUser) {
    enterApp(false);
  } else {
    // Show login page initially
    loginContainer.classList.remove('hidden');
  }
}

// Load App
document.addEventListener('DOMContentLoaded', init);
