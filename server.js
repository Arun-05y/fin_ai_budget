// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'finai-secure-token-secret-key-12345';
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Local JSON Database
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], budgets: [] }, null, 2));
}

// Database Helpers
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], budgets: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Gemini AI Config
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully.');
  } catch (err) {
    console.error('Error initializing Gemini AI SDK:', err.message);
  }
} else {
  console.log('No GEMINI_API_KEY found in environment. Chatbot will run in local rule-based/hybrid intelligence mode.');
}

const SYSTEM_PROMPT = `
You are FinAI, an intelligent Budget Planning Agent designed to help users create monthly/yearly budgets.
Your role is to:
1. Welcome the user politely.
2. Collect financial details step-by-step: Monthly income, other income, rent/EMI, food, transportation, utilities, healthcare, education, entertainment, shopping, debt/loans, current savings, monthly savings goal, financial goals.
3. Highlight top spending categories.
4. Recommend ways to reduce expenses (reduce subscriptions, limit entertainment, cook more).
5. Generate a budget table mapping income, rent, food, transport, utilities, shopping, entertainment, healthcare, savings, investments, and remaining balance.
6. Provide a savings plan (monthly/yearly projection & goal timeline).
7. Give smart insights (e.g. average comparison, emergency fund duration).
8. Recommend 50/30/20 rule and other practical tips.

Guidelines:
- Present currency values clearly.
- Keep advice practical and personalized.
- Be supportive, professional, and non-judgmental.
- If income or expenses change, recalculate immediately.
- Never make assumptions; ask for clarification if values are missing.
`;

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// --- Auth Endpoints ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), username, password: hashedPassword };
    db.users.push(newUser);
    writeDB(db);

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: newUser.username, message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const db = readDB();
  const user = db.users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- Budget Endpoints ---

// Get User Budget
app.get('/api/budget', authenticateToken, (req, res) => {
  const db = readDB();
  const budget = db.budgets.find(b => b.userId === req.user.id);
  if (!budget) {
    return res.json({ budget: null });
  }
  res.json({ budget });
});

// Save/Update User Budget
app.post('/api/budget', authenticateToken, (req, res) => {
  const db = readDB();
  const index = db.budgets.findIndex(b => b.userId === req.user.id);
  
  const budgetData = {
    userId: req.user.id,
    currency: req.body.currency || '₹',
    income: req.body.income || 0,
    otherIncome: req.body.otherIncome || 0,
    expenses: req.body.expenses || {},
    debt: req.body.debt || 0,
    currentSavings: req.body.currentSavings || 0,
    savingsGoal: req.body.savingsGoal || 0,
    financialGoals: req.body.financialGoals || '',
    updatedAt: new Date().toISOString()
  };

  if (index !== -1) {
    db.budgets[index] = budgetData;
  } else {
    db.budgets.push(budgetData);
  }
  
  writeDB(db);
  res.json({ message: 'Budget saved successfully', budget: budgetData });
});

// --- AI Chatbot Endpoint ---

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  // If Gemini API Key is active, query Google Gemini SDK
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Map history to Gemini's format: { role: 'user'|'model', parts: [{ text: string }] }
      const contents = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I will act as FinAI, the professional Budget Planning Agent following your strict instructions.' }] }
      ];

      if (history && Array.isArray(history)) {
        history.forEach(h => {
          const role = h.sender === 'user' ? 'user' : 'model';
          contents.push({ role, parts: [{ text: h.content }] });
        });
      }

      // Add the final user message
      contents.push({ role: 'user', parts: [{ text: message }] });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const responseText = response.text();

      return res.json({ reply: responseText });
    } catch (err) {
      console.error('Gemini API call failed, falling back to local chat engine:', err.message);
    }
  }

  // Local Chat / Intelligent response engine (mock AI)
  // Highly dynamic response matcher based on budget planning prompt steps
  const reply = generateLocalIntelligenceReply(message, history);
  res.json({ reply });
});

// Smart Rule-based agent simulator for local environment
function generateLocalIntelligenceReply(message, history) {
  const text = message.toLowerCase();
  
  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
    return "Hello! I'm your AI Budget Planning Assistant. I'll help you create a personalized budget and improve your financial planning. What is your total monthly income to get started?";
  }
  
  if (text.includes('demo') || text.includes('auto') || text.includes('fill')) {
    return "✨ <strong>Demo profile loaded successfully!</strong> I've populated the planner with sample financial values. Let's analyze your results on the dashboard.";
  }

  if (text.includes('rule') || text.includes('50/30/20')) {
    return "The **50/30/20 Rule** suggests splitting your income into:<br>• **50% Needs**: Housing, utilities, food, healthcare.<br>• **30% Wants**: Entertainment, shopping, dining out.<br>• **20% Savings**: Savings goals, emergency funds, debt payment.";
  }

  if (text.includes('emergency') || text.includes('fund')) {
    return "An **Emergency Fund** should cover 3 to 6 months of your essential living expenses. Keep it in a liquid, high-yield account so it is easily accessible in times of unexpected job loss or medical events.";
  }

  // Generic supportive agent response maintaining context
  return "Got it! I am processing this update. Your budget calculations and interactive sheet on the right have been synchronized. What other financial adjustments or savings goals can I help you map out?";
}

// Default static file serving route for fallback HTML5 History API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Budget Planning Agent Server running at http://localhost:${PORT}`);
});
