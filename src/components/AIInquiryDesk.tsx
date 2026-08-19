import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, Clock, CheckCircle2, AlertTriangle, 
  MessageSquare, Settings, RefreshCw, Zap, Shield, Phone, 
  Store, Package, Truck, CreditCard, ChevronRight, BarChart2,
  FileText, Search, UserCheck, ExternalLink, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { AIInquiryLog, AIInquiryRule, AIInquiryStats } from '../types';

interface AIInquiryDeskProps {
  onNavigateToTCode?: (tcode: string) => void;
}

export const AIInquiryDesk: React.FC<AIInquiryDeskProps> = ({ onNavigateToTCode }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'logs' | 'rules' | 'telemetry'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [senderType, setSenderType] = useState<'customer' | 'sales_rep'>('customer');
  const [senderName, setSenderName] = useState('Ahmed Super Store');
  const [channel, setChannel] = useState<'web_chat' | 'whatsapp' | 'sms'>('whatsapp');
  const [isLoading, setIsLoading] = useState(false);
  
  // Conversation History
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'bot';
    text: string;
    intent?: string;
    tools?: string[];
    responseTime?: number;
    timestamp: string;
    actionData?: any;
  }>>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "👋 Welcome to the **Karachi DMS 24/7 Automated Inquiry Desk**!\n\nI can instantly answer routine inquiries from retail customers and field sales reps without human intervention:\n- 📊 **Ledger & Outstanding Balance**\n- 📦 **Live Order Tracking & Status**\n- 🏷️ **Product Stock & Pricing List**\n- 🚚 **Delivery Vehicle & Driver Dispatch**\n- 💳 **Bank Payment & IBAN Details**\n- 📝 **Automated Draft Order Booking**\n\nTry clicking any quick prompt below or type your inquiry in English or Roman Urdu!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Logs & Rules & Stats
  const [logs, setLogs] = useState<AIInquiryLog[]>([]);
  const [rules, setRules] = useState<AIInquiryRule[]>([]);
  const [stats, setStats] = useState<AIInquiryStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>('ALL');

  // Rule Form State
  const [editingRule, setEditingRule] = useState<Partial<AIInquiryRule> | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    fetchRules();
    fetchStats();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/ai/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to load logs:", e);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/ai/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (e) {
      console.error("Failed to load rules:", e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/ai/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = Date.now().toString();
    const newMsg = {
      id: userMsgId,
      sender: 'user' as const,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incoming_message: text,
          sender_type: senderType,
          sender_name: senderName,
          channel: channel
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.response || "I was unable to retrieve a response at this time.",
          intent: data.detected_intent,
          tools: data.tools_used,
          responseTime: data.response_time_ms,
          actionData: data.action_data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Refresh telemetry & logs
      fetchLogs();
      fetchStats();

    } catch (err: any) {
      console.error("Error calling AI inquiry:", err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `⚠️ **System Notice**: Error processing inquiry. ${err.message || 'Please check backend logs.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule?.keyword_pattern || !editingRule?.quick_template) return;

    try {
      const res = await fetch('/api/ai/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule)
      });
      if (res.ok) {
        setEditingRule(null);
        fetchRules();
      }
    } catch (e) {
      console.error("Failed to save rule:", e);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm("Are you sure you want to remove this automated policy rule?")) return;
    try {
      const res = await fetch(`/api/ai/rules/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRules();
    } catch (e) {
      console.error("Failed to delete rule:", e);
    }
  };

  const handleFeedback = async (logId: number, rating: number) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId, rating })
      });
      fetchLogs();
    } catch (e) {
      console.error("Feedback error:", e);
    }
  };

  const quickPrompts = [
    { label: "💳 Ledger Balance (Hyper Link)", query: "What is the current ledger balance and credit limit for Hyper Link Super Market?", icon: CreditCard },
    { label: "🏷️ White Sugar Stock & Rate", query: "Check current available stock and trade rate for White Sugar 1kg", icon: Package },
    { label: "📦 Track Order #ORD-0001", query: "What is the status and delivery dispatch for Order #ORD-0001?", icon: Store },
    { label: "🚚 Delivery Schedule & Driver", query: "When will the next delivery arrive and who is the driver?", icon: Truck },
    { label: "🏦 Bank Account for Payment", query: "Please send official Meezan Bank account details for invoice payment transfer", icon: FileText },
    { label: "📝 Book Draft Order (Brown Sugar)", query: "Book a new order for shop ID 1 with 20 units of PR-SUGAR-B", icon: Zap }
  ];

  const filteredLogs = logs.filter(l => {
    const matchesSearch = !searchTerm || 
      l.incoming_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ai_response.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.sender_name && l.sender_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesIntent = selectedIntentFilter === 'ALL' || l.detected_intent === selectedIntentFilter;
    return matchesSearch && matchesIntent;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="ai-inquiry-desk-container">
      {/* Top Header & T-Code Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  AI Automated Inquiry Desk
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE 24/7 • T-Code: AI01 / INQ01
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Zero-human-intervention automated engine for customer & sales rep inquiries (Ledgers, Orders, Pricing, Dispatch & Policies)
              </p>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
            <div className="text-right px-3 border-r border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Handled</p>
              <p className="text-xl font-bold text-emerald-400">{stats?.total_inquiries || logs.length || 18}</p>
            </div>
            <div className="text-right px-3 border-r border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Auto-Resolved</p>
              <p className="text-xl font-bold text-white">100%</p>
            </div>
            <div className="text-right px-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Avg Latency</p>
              <p className="text-xl font-bold text-cyan-400">{stats?.avg_response_time_ms ? `${stats.avg_response_time_ms}ms` : '32ms'}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Live Inquiry Simulator
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            Audit Telemetry Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            Knowledge & Business Policies ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Channel & API Integration
          </button>
        </div>
      </div>

      {/* TAB 1: Live Interactive Inquiry Sandbox */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel: Simulator Context Settings */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Inquiry Origin Simulation
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Sender Profile</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSenderType('customer');
                      setSenderName('Hyper Link Super Market');
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                      senderType === 'customer'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏪 Retail Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSenderType('sales_rep');
                      setSenderName('Muhammad Adnan (Booker)');
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                      senderType === 'sales_rep'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🛵 Sales Rep
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Simulated Channel</label>
                <select
                  value={channel}
                  onChange={(e: any) => setChannel(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="whatsapp">🟢 WhatsApp Business Bot</option>
                  <option value="web_chat">🌐 Retailer Web Portal Chat</option>
                  <option value="sms">📱 SMS / Text Gateway</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Sender Identifier</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Shop Name / Booker"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span>Engine Status</span>
                    <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Model:</span>
                    <span className="font-mono text-[11px] text-slate-800">Gemini 3.7 + SQLite</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tooling:</span>
                    <span className="font-semibold text-emerald-700">8 Real-time DMS Tools</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Test Prompts */}
            <div className="bg-slate-900 rounded-2xl p-4 text-white border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Instant Test Scenarios
                </p>
              </div>
              <div className="space-y-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.query)}
                    className="w-full text-left p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/40 border border-slate-700/60 text-xs text-slate-200 transition group flex items-center justify-between"
                  >
                    <span className="truncate pr-2 font-medium">{p.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Chat Stream */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
            {/* Chat Top Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  AI
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Automated DMS Assistant
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Zero Human Intervention
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Channel: {channel === 'whatsapp' ? '🟢 WhatsApp Business' : '🌐 Web Portal'} • Inquiring as: <span className="font-semibold text-slate-700">{senderName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMessages([messages[0]])}
                  className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
                  title="Clear conversation"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-slate-100/30 text-[11px] opacity-80">
                      <span className="font-semibold">
                        {m.sender === 'user' ? senderName : '🤖 FBM Virtual Dispatcher'}
                      </span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed">
                      {m.text}
                    </div>

                    {/* Metadata pill for bot responses */}
                    {m.sender === 'bot' && (m.intent || m.responseTime !== undefined) && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[10px]">
                        {m.intent && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                            Intent: {m.intent}
                          </span>
                        )}
                        {m.tools && m.tools.length > 0 && (
                          <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-md font-mono">
                            Tool: {m.tools.join(', ')}
                          </span>
                        )}
                        {m.responseTime !== undefined && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                            ⚡ {m.responseTime}ms
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm text-sm text-slate-600 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium text-slate-600">Querying DMS Database & computing response...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask any question (e.g. 'What is my ledger balance?', 'Check White Sugar stock', 'Where is Order #1?')..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Real-time Inquiry Telemetry Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Automated Inquiry Telemetry & Audit Trail
              </h2>
              <p className="text-sm text-slate-500">
                All customer and sales rep interactions answered automatically by the AI engine
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={selectedIntentFilter}
                onChange={(e) => setSelectedIntentFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Intents</option>
                <option value="LEDGER_BALANCE">LEDGER_BALANCE</option>
                <option value="ORDER_STATUS">ORDER_STATUS</option>
                <option value="STOCK_PRICING">STOCK_PRICING</option>
                <option value="DELIVERY_STATUS">DELIVERY_STATUS</option>
                <option value="PAYMENT_INFO">PAYMENT_INFO</option>
                <option value="GENERAL_INQUIRY">GENERAL_INQUIRY</option>
              </select>

              <button
                onClick={fetchLogs}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                title="Refresh Logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Log ID & Time</th>
                  <th className="py-3 px-4">Channel / Sender</th>
                  <th className="py-3 px-4">Incoming Message</th>
                  <th className="py-3 px-4">Intent & Tool</th>
                  <th className="py-3 px-4">AI Auto Response</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Status & Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No automated inquiry logs recorded matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        <div className="font-bold text-slate-700">#{log.id}</div>
                        <div className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{log.sender_name || 'Customer'}</div>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          {log.channel === 'whatsapp' ? '🟢 WhatsApp' : log.channel === 'web_chat' ? '🌐 Web Chat' : log.channel}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 max-w-xs truncate" title={log.incoming_message}>
                        "{log.incoming_message}"
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold block w-max">
                          {log.detected_intent}
                        </span>
                        {log.tool_calls_executed && (
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {log.tool_calls_executed.replace(/[\[\]"]/g, '')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm">
                        <p className="line-clamp-2 text-[11px] leading-relaxed" title={log.ai_response}>
                          {log.ai_response}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                        <span className="text-emerald-700 font-semibold">{log.response_time_ms}ms</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            ✓ {log.status}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleFeedback(log.id, 5)}
                              className={`p-1 rounded hover:bg-emerald-50 ${log.feedback_rating === 5 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(log.id, 1)}
                              className={`p-1 rounded hover:bg-rose-50 ${log.feedback_rating === 1 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}
                              title="Needs review"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Business Knowledge & Policy Rules */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Business Knowledge Base & Policy Management
              </h2>
              <p className="text-sm text-slate-500">
                Define quick-reply policies (Bank accounts, dispatch schedules, return rules, and credit terms) that the AI dispenses automatically
              </p>
            </div>

            <button
              onClick={() => setEditingRule({ keyword_pattern: '', intent_category: 'GENERAL', quick_template: '', is_active: 1 })}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
            >
              + Add New Business Policy
            </button>
          </div>

          {/* Rule Editor Modal / Inline Form */}
          {editingRule && (
            <div className="bg-slate-50 border border-emerald-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingRule.id ? 'Edit Business Policy Rule' : 'Create New Automated Policy Rule'}
              </h3>
              <form onSubmit={handleSaveRule} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Trigger Keywords (Regex / Pipe-separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. bank|account|transfer|payment method"
                      value={editingRule.keyword_pattern || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, keyword_pattern: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Intent Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PAYMENT_INFO, DELIVERY_POLICY, RETURN_TERMS"
                      value={editingRule.intent_category || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, intent_category: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Official Response Template</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter the official policy text to be served automatically to inquiries..."
                    value={editingRule.quick_template || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, quick_template: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                  >
                    Save Policy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-emerald-300 transition space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-100 text-emerald-800 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                    {r.intent_category}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingRule(r)}
                      className="text-xs text-slate-500 hover:text-emerald-600 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRule(r.id)}
                      className="text-xs text-slate-400 hover:text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">Trigger Pattern:</p>
                  <p className="text-xs font-mono bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-700">
                    {r.keyword_pattern}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">Automated Reply Template:</p>
                  <p className="text-xs text-slate-700 bg-slate-50/50 p-2 rounded border border-slate-100 whitespace-pre-wrap leading-relaxed">
                    {r.quick_template}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Channel & Webhook Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              WhatsApp & External Channel Webhook Integration
            </h2>
            <p className="text-sm text-slate-500">
              Connect external messaging gateways (WhatsApp Cloud API, SMS Gateways, Twilio, Dialogflow) directly to Karachi DMS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                WhatsApp Webhook Ingestion Endpoint
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure your WhatsApp Business Cloud API or Twilio Webhook to POST incoming messages to this server:
              </p>

              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                POST /api/ai/webhook
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Supported JSON payload format:</p>
                <pre className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] overflow-x-auto text-slate-800 font-mono">
{`{
  "From": "+923001234567",
  "Body": "What is my ledger balance for Shop 1?",
  "ProfileName": "Ahmed Store"
}`}
                </pre>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                DMS Security & Access Safeguards
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Read-Only Safety:</strong> Inquiries check live SQLite balances, stock, and orders without altering ledger records.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Draft Order Isolation:</strong> Automated booking requests create <em>Pending</em> draft orders for accountant review.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Credit Limit Warnings:</strong> AI proactively reminds retailers when credit limit threshold is breached.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
