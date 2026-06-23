"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Search,
  Plus,
  Compass,
  Layout,
  BookOpen,
  User,
  LogOut,
  ChevronRight,
  BookMarked,
  Tags,
  Sliders,
  Sparkles,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Trash2,
  Bookmark,
  Share2,
  Clock,
  Eye,
  Settings,
  ChevronLeft,
  X,
  RefreshCw,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  FolderLock,
  ThumbsUp,
  Award,
  Zap,
  Info
} from "lucide-react";

// Types
interface Article {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  tags: string[];
  wordCount: number;
  readabilityScore: number;
  isBookmarked: boolean;
  category: string;
}

interface UserSession {
  uid: string;
  email: string;
  displayName: string;
}

function generateUniqueId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 9);
  const time = Date.now().toString(36);
  return `${prefix}-${time}-${rand}`;
}

export default function EnhanceAISaaS() {
  // Theme state: minimalistic bright white design is enforced, using blue, green, orange accents
  const [currentView, setCurrentView] = useState<"LANDING" | "AUTH" | "DASHBOARD" | "EDITOR">("LANDING");
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  
  // Auth Form Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Articles & Database State
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "wordCount" | "title">("newest");
  const [selectedTag, setSelectedTag] = useState<string>("All");

  // Editor states
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorCategory, setEditorCategory] = useState("Technology");
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isEditorSaving, setIsEditorSaving] = useState(false);
  const [ghostSuggestion, setGhostSuggestion] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [enableAutocomplete, setEnableAutocomplete] = useState(true);

  // AI Assistant drawer/sidebar states
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const [aiTone, setAiTone] = useState("Clear and Professional");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiOutputResult, setAiOutputResult] = useState("");
  const [selectedActionText, setSelectedActionText] = useState("");

  // UI Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

  // References
  const textEditorRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and Sync LocalStorage
  useEffect(() => {
    const initTimer = setTimeout(() => {
      // Load local auth
      const storedUser = localStorage.getItem("enhance_ai_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setCurrentView("DASHBOARD");
      }

      // Load initial articles database / seed templates
      const storedArticles = localStorage.getItem("enhance_ai_articles");
      if (storedArticles) {
        setArticles(JSON.parse(storedArticles));
      } else {
        const defaultArticles: Article[] = [
          {
            id: "seed-1",
            title: "The Architecture of Clean Writing and Thinking",
            content: "Writing is not just a tool for sharing information; it is the ultimate engine for structured thinking. In this era of rapid mental noise, maintaining a workspace that is minimal, bright, and distraction-free allows deep concepts to flourish. \n\nGrammarly and Evernote taught us that layout counts—but real-time suggestion speeds up creation twofold. When you type 'how to' or 'in this', a gentle gray suggestion should pull your thoughts forward gracefully without interrupting your creative flow. Focus is the only leverage that copywriters have left.",
            status: "published",
            createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
            updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            tags: ["minimalism", "writing", "focus"],
            wordCount: 112,
            readabilityScore: 84,
            isBookmarked: true,
            category: "Creative Writing"
          },
          {
            id: "seed-2",
            title: "How to Build an Organic Tech Newsletter from Scratch",
            content: "The key to building a sustainable audience is not flashy marketing campaigns. The absolute secret lies in consistency and depth. Many creators struggle with starting because staring at a blank canvas induces rapid anxiety.\n\nBy leveraging predictive sentence completion engines, we bypass the cold-start problem. Overcoming writer's block is as simple as letting AI clear the path to your next paragraph. You write the thesis, and Enhance AI helps you finish standard transition sentences with a single finger tap.",
            status: "draft",
            createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
            updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
            tags: ["newsletter", "startup", "growth"],
            wordCount: 92,
            readabilityScore: 71,
            isBookmarked: false,
            category: "Marketing"
          }
        ];
        setArticles(defaultArticles);
        localStorage.setItem("enhance_ai_articles", JSON.stringify(defaultArticles));
      }
    }, 0);

    return () => clearTimeout(initTimer);
  }, []);

  // Sync articles to localStorage whenever state edits
  const saveArticlesToLocal = (updatedList: Article[]) => {
    setArticles(updatedList);
    localStorage.setItem("enhance_ai_articles", JSON.stringify(updatedList));
  };

  // Toast Helper
  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle Auth submission
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all core credentials.", "warning");
      return;
    }

    if (authMode === "SIGNUP" && !displayName) {
      showToast("Please provide a name.", "warning");
      return;
    }

    const sessionUser: UserSession = {
      uid: generateUniqueId("usr"),
      email: email,
      displayName: authMode === "SIGNUP" ? displayName : email.split("@")[0]
    };

    localStorage.setItem("enhance_ai_user", JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);
    showToast(`Welcome back, ${sessionUser.displayName}!`, "success");
    setCurrentView("DASHBOARD");

    // Clear forms
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("enhance_ai_user");
    setCurrentUser(null);
    setCurrentView("LANDING");
    showToast("Signed out successfully from Enhance AI.", "info");
  };

  // Create article action
  const handleCreateArticle = () => {
    const newArticle: Article = {
      id: generateUniqueId("art"),
      title: "Untitled Draft Book",
      content: "Type some initial thoughts here to activate the autocomplete. Press Tab when you see the orange hint to complete the sentence automatically...",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["writing"],
      wordCount: 21,
      readabilityScore: 75,
      isBookmarked: false,
      category: "Technology"
    };

    const updated = [newArticle, ...articles];
    saveArticlesToLocal(updated);
    
    // Open in editor
    openArticleInEditor(newArticle);
    showToast("New clean workspace article created!", "success");
  };

  // Open existing article in editor
  const openArticleInEditor = (art: Article) => {
    setSelectedArticle(art);
    setEditorTitle(art.title);
    setEditorContent(art.content);
    setEditorCategory(art.category);
    setEditorTags(art.tags);
    setGhostSuggestion("");
    setAiOutputResult("");
    setCurrentView("EDITOR");
  };

  // Save current active editor changes
  const saveCurrentArticle = (autosave = false) => {
    if (!selectedArticle) return;
    
    setIsEditorSaving(true);
    const wordsCount = editorContent ? editorContent.trim().split(/\s+/).filter(Boolean).length : 0;
    
    // Calculate simple readability estimate
    const sentences = editorContent ? editorContent.split(/[.!?]+/).filter(Boolean).length : 0;
    const avgSentenceLen = sentences > 0 ? wordsCount / sentences : 10;
    const calcScore = Math.min(100, Math.max(30, Math.round(90 - (avgSentenceLen * 0.7))));

    const updatedArticles = articles.map(art => {
      if (art.id === selectedArticle.id) {
        return {
          ...art,
          title: editorTitle || "Untitled Draft Book",
          content: editorContent,
          wordCount: wordsCount,
          readabilityScore: calcScore,
          category: editorCategory,
          tags: editorTags,
          updatedAt: new Date().toISOString()
        };
      }
      return art;
    });

    saveArticlesToLocal(updatedArticles);
    
    // Maintain local state to avoid jumpiness
    const currentActive = updatedArticles.find(a => a.id === selectedArticle.id);
    if (currentActive) {
      setSelectedArticle(currentActive);
    }

    setTimeout(() => {
      setIsEditorSaving(false);
      if (!autosave) {
        showToast("Article saved and synced smoothly.", "success");
      }
    }, 450);
  };

  // Delete article
  const handleDeleteArticle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this written article permanently?")) {
      const filtered = articles.filter(art => art.id !== id);
      saveArticlesToLocal(filtered);
      showToast("Article removed successfully.", "info");
      if (selectedArticle?.id === id) {
        setCurrentView("DASHBOARD");
      }
    }
  };

  // Toggle bookmarked status
  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = articles.map(a => {
      if (a.id === id) {
        return { ...a, isBookmarked: !a.isBookmarked };
      }
      return a;
    });
    saveArticlesToLocal(updated);
    showToast("Favorites catalog updated.", "success");
  };

  // Trigger publish toggle
  const togglePublishStatus = (art: Article) => {
    const nextStatus: "draft" | "published" = art.status === "draft" ? "published" : "draft";
    const updated = articles.map(a => {
      if (a.id === art.id) {
        return { ...a, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return a;
    });
    saveArticlesToLocal(updated);
    
    // Sync current selected details
    const target = updated.find(a => a.id === art.id);
    if (target) {
      setSelectedArticle(target);
    }
    showToast(`Article status updated to ${nextStatus.toUpperCase()}`, "success");
  };

  // Textarea input value tracker: handles debounce requests for sentence completion
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditorContent(val);

    // Cancel existing timeout
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }

    if (!enableAutocomplete || !val) {
      setGhostSuggestion("");
      return;
    }

    // Capture the last 150 characters to form contextual autocomplete prompt
    const snippet = val.length > 350 ? val.substring(val.length - 350) : val;

    // Trigger prediction after typing stops for 800ms
    autocompleteTimeoutRef.current = setTimeout(() => {
      fetchAutocompleteSuggestion(snippet);
    }, 850);
  };

  // Trigger manual API call or call local mock if key not resolved
  const fetchAutocompleteSuggestion = async (textChunk: string) => {
    setIsSuggesting(true);
    try {
      const response = await fetch("/api/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textChunk, title: editorTitle })
      });
      const data = await response.json();
      if (data.suggestion) {
        setGhostSuggestion(data.suggestion);
      } else {
        setGhostSuggestion("");
      }
    } catch (err) {
      console.error(err);
      setGhostSuggestion("");
    } finally {
      setIsSuggesting(false);
    }
  };

  // Key Down Events: Listen for 'Tab' or 'Right Arrow' key to accept the inline ghost option
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      if (ghostSuggestion) {
        e.preventDefault(); // prevent shifting focus to next input
        acceptSuggestion();
      }
    }
  };

  // Accept/Commit the ghost-suggestion into the main text content
  const acceptSuggestion = () => {
    if (!ghostSuggestion) return;
    const caretPos = textEditorRef.current?.selectionStart || editorContent.length;
    const updated = editorContent + ghostSuggestion;
    setEditorContent(updated);
    setGhostSuggestion("");
    showToast("Sentence autocompleted!", "success");
    // Place cursor back
    setTimeout(() => {
      if (textEditorRef.current) {
        textEditorRef.current.focus();
        textEditorRef.current.selectionStart = textEditorRef.current.selectionEnd = updated.length;
      }
    }, 50);
  };

  // AI assistant tools: Headlines, Tone Optimizing, Outline expander
  const handleAIAssistance = async (action: "improve-tone" | "headlines" | "outline") => {
    setIsAIProcessing(true);
    setAiOutputResult("");
    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: editorContent,
          title: editorTitle,
          tone: aiTone
        })
      });
      const data = await response.json();
      if (data.result) {
        setAiOutputResult(data.result);
        showToast("Enhance AI compiled structured generation!", "success");
      } else {
        showToast("No response from assistant engine.", "warning");
      }
    } catch (err) {
      console.error(err);
      showToast("Could not retrieve AI enhancements.", "warning");
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Replace editor text with the corrected version from AI Output
  const applyAIPositionContent = () => {
    if (!aiOutputResult) return;
    if (confirm("Would you like to replace your active text editor content with this generated version?")) {
      setEditorContent(aiOutputResult);
      showToast("Editor canvas updated with enhanced text.", "success");
    }
  };

  // Handle Tags creation
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    const formatted = tagInput.trim().toLowerCase();
    if (!editorTags.includes(formatted)) {
      setEditorTags([...editorTags, formatted]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagName: string) => {
    setEditorTags(editorTags.filter(t => t !== tagName));
  };

  // Filter & Search drafts
  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === "All" || art.category === filterCategory;
    const matchesStatus = filterStatus === "all" || art.status === filterStatus;
    const matchesTag = selectedTag === "All" || art.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesStatus && matchesTag;
  });

  // Sort list
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    if (sortBy === "wordCount") {
      return b.wordCount - a.wordCount;
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Extract list of all tags present in database
  const allUniqueTags = Array.from(
    new Set(articles.flatMap(a => a.tags))
  );

  // Auto-Save background timer
  useEffect(() => {
    if (currentView === "EDITOR" && selectedArticle) {
      const delaySave = setTimeout(() => {
        saveCurrentArticle(true);
      }, 5000); // Autosave every 5s after inactivity
      return () => clearTimeout(delaySave);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorTitle, editorContent, editorCategory, editorTags, currentView, selectedArticle]);

  return (
    <div id="app-root" className="min-h-screen bg-[#FDFDFD] text-slate-800 font-sans tracking-tight flex flex-col selection:bg-orange-100 selection:text-orange-950">
      
      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg ${
              toast.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              toast.type === "success" ? "bg-emerald-500" : toast.type === "warning" ? "bg-amber-500" : "bg-blue-500"
            }`} />
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <header id="main-nav-bar" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView("LANDING")}>
          {/* Custom logo interlocking block using green blue and orange */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute top-0 left-0 w-5.5 h-5.5 rounded-lg border-2 border-[#2563eb] rotate-6 opacity-85" />
            <div className="absolute bottom-0 right-0 w-5.5 h-5.5 rounded-lg border-2 border-[#10b981] -rotate-12 opacity-85" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded bg-[#f97316]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-1">
              Enhance <span className="text-orange-500 font-bold">AI</span>
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Blogging Catalyst</p>
          </div>
        </div>

        {/* Global Navigation controls based on authentication state */}
        <div className="flex items-center gap-6">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span 
                onClick={() => setCurrentView("DASHBOARD")}
                className={`text-sm cursor-pointer font-medium transition-colors ${currentView === "DASHBOARD" ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-slate-950"}`}
              >
                Dashboard
              </span>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-medium">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-slate-700">{currentUser.displayName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setAuthMode("LOGIN"); setCurrentView("AUTH"); }}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5"
              >
                Log In
              </button>
              <button 
                onClick={() => { setAuthMode("SIGNUP"); setCurrentView("AUTH"); }}
                className="text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-all px-4 py-2 rounded-xl shadow-xs"
              >
                Sign Up Free
              </button>
            </div>
          )}
        </div>
      </header>

      {/* VIEWPORT CONTROLLER */}
      <main className="flex-1 flex flex-col">
        {/* 1. PUBLIC LANDING PAGE */}
        {currentView === "LANDING" && (
          <div id="landing-view" className="flex-1 flex flex-col">
            
            {/* HERO SECTION */}
            <section className="px-6 py-20 text-center max-w-4xl mx-auto flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-semibold mb-6"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Next Generation Autocomplete is Here
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight"
              >
                The AI-assisted writer that <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-orange-500 to-emerald-500">compiles your thoughts.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-slate-600 max-w-2xl mt-6 leading-relaxed"
              >
                Eliminate writer&apos;s block forever. Enhance AI integrates inline, smart ghost-text suggestions that learn the tone and rhythm of your sentences. Inspired by Grammarly and OneNote—but powered by custom intelligent completions.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full"
              >
                <button
                  onClick={() => {
                    if (currentUser) {
                      setCurrentView("DASHBOARD");
                    } else {
                      setAuthMode("SIGNUP");
                      setCurrentView("AUTH");
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Start Typing Now
                  <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#interactive-sandbox"
                  className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl transition-all border border-slate-200"
                >
                  Try Free
                </a>
              </motion.div>
            </section>

            {/* LIVE EXPERIENTIAL PREVIEW SANDBOX */}
            <section id="interactive-sandbox" className="py-12 bg-slate-50 border-y border-slate-100 flex justify-center px-6">
              <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-400 font-mono ml-2">Interactive Preview Editor</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-orange-400" /> Sentence Predictor Active</span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Sandbox Article title</label>
                    <input 
                      type="text" 
                      defaultValue="Growing an Organic Following" 
                      disabled 
                      className="text-xl font-semibold text-slate-900 w-full bg-transparent focus:outline-hidden"
                    />
                  </div>

                  <div className="relative min-h-[160px]">
                    <textarea
                      placeholder="Try typing here: e.g., 'how to' or 'in this' and wait a second to see suggestions..."
                      className="w-full h-full min-h-[150px] text-slate-700 resize-none font-sans text-base leading-relaxed bg-transparent focus:outline-hidden border-none"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (autocompleteTimeoutRef.current) clearTimeout(autocompleteTimeoutRef.current);
                        
                        // Look up simple text match for simulated autocomplete
                        const lower = val.trim().toLowerCase();
                        if (lower.endsWith("how to")) {
                          setGhostSuggestion(" write high converting paragraphs.");
                        } else if (lower.endsWith("in this")) {
                          setGhostSuggestion(" article, we reveal clean content styling secrets.");
                        } else if (lower.endsWith("artificial intelligence")) {
                          setGhostSuggestion(" is transforming the blogosphere.");
                        } else if (val === "") {
                          setGhostSuggestion("");
                        } else {
                          // generic fallback suggestion
                          setGhostSuggestion(" with simple sentences.");
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Tab" && ghostSuggestion) {
                          e.preventDefault();
                          // trigger simulated accept
                          const area = e.currentTarget;
                          const currentText = area.value;
                          area.value = currentText + ghostSuggestion;
                          setGhostSuggestion("");
                          showToast("Autocompleted suggestion!", "success");
                        }
                      }}
                    />
                    
                    {/* Inline absolute suggestion display */}
                    {ghostSuggestion && (
                      <div className="absolute bottom-2 left-2 right-2 bg-orange-50/95 border border-orange-200 rounded-lg p-3 flex items-center justify-between text-xs text-orange-950 font-medium shadow-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                          <span>AI Complete suggestion: <span className="font-semibold text-slate-900">{ghostSuggestion}</span></span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-orange-200 text-orange-900 font-mono text-[10px]">Press TAB ⇥</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-4 leading-normal flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    Our neural autocomplete analyzes the previous paragraph, drafting natural endings. Sign up to customize themes, save draft logs, and leverage the real Google Gemini models.
                  </p>
                </div>
              </div>
            </section>

            {/* THREE COLUMN PILLARS */}
            <section className="py-20 px-6 max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-14">
                Designed for speed, built for beautiful blogs
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Structure blue */}
                <div className="p-8 rounded-2xl border border-slate-100 shadow-xs bg-white hover:border-blue-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
                    <Layout className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 mb-3">Structured Dashboard</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Organize your documents with custom tags, categories, and bookmarks. Search through thousands of words in real-time, taking inspiration from OneNote folders.
                  </p>
                </div>

                {/* Autocomplete orange */}
                <div className="p-8 rounded-2xl border border-slate-100 shadow-xs bg-white hover:border-orange-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 mb-3">Smart Sentence Completer</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Tiptap-inspired inline autocomplete looks ahead as you write. Simply type and hit Tab to seamlessly merge machine intelligence with human storytelling.
                  </p>
                </div>

                {/* Tone Optimizer green */}
                <div className="p-8 rounded-2xl border border-slate-100 shadow-xs bg-white hover:border-emerald-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                    <Sliders className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 mb-3">Dynamic Tone Tuner</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Optimize readability grades on the fly. Refine sentences into clear professional emails, highly casual blogs, or persuasive marketing letters instantly.
                  </p>
                </div>
              </div>
            </section>

            {/* MINIMAL CREDENTIALS CALL TO ACTION */}
            <section className="bg-slate-50 border-t border-slate-100 text-center py-20 px-6">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ready to boost your writing yield?</h2>
                <p className="text-slate-600 mt-4 text-base">Write with absolute focus and save infinite custom articles inside our secure platform.</p>
                <div className="mt-8 flex justify-center gap-4">
                  <button
                    onClick={() => { setAuthMode("SIGNUP"); setCurrentView("AUTH"); }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all"
                  >
                    Get Started Free
                  </button>
                  <button
                    onClick={() => { setAuthMode("LOGIN"); setCurrentView("AUTH"); }}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-all"
                  >
                    Access Existing Account
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2. AUTH SCREEN */}
        {currentView === "AUTH" && (
          <div id="auth-view" className="flex-1 flex items-center justify-center bg-slate-50 p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-10 rounded-2xl border border-slate-200 max-w-md w-full shadow-xs"
            >
              <div className="text-center mb-8">
                <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-950">
                  {authMode === "LOGIN" ? "Welcome back to Enhance AI" : "Join Enhance AI Today"}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {authMode === "LOGIN" ? "Your creative cloud writer is waiting." : "Create premium blog posts at light-speed."}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "SIGNUP" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Your Full Name</label>
                    <input 
                      type="text"
                      placeholder="E.g. J. K. Rowling"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                  <input 
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Password</label>
                  </div>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl mt-6 transition-all shadow-xs cursor-pointer"
                >
                  {authMode === "LOGIN" ? "Sign In to Catalyst" : "Create Account (Free)"}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "LOGIN" ? "SIGNUP" : "LOGIN")}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-all"
                >
                  {authMode === "LOGIN" ? "Don't have an account? Sign up free" : "Already an author? Log in instead"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 3. STRUCTURED DASHBOARD (OneNote + Grammarly inspired) */}
        {currentView === "DASHBOARD" && (
          <div id="dashboard-view" className="flex-1 flex flex-col md:flex-row bg-[#FDFDFD]">
            
            {/* SIDEBAR NAVIGATION PANEL */}
            <aside id="sidebar-panel" className="w-full md:w-64 border-r border-slate-100 p-6 flex flex-col gap-6 bg-white shrink-0">
              <button
                onClick={handleCreateArticle}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Write New Piece
              </button>

              {/* FILTER BY STATUS & CATEGORIES */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Document State</h4>
                  <nav className="flex flex-col gap-1">
                    <button
                      onClick={() => setFilterStatus("all")}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        filterStatus === "all" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-400" /> All Drafts</span>
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-sm border border-slate-100 font-mono text-slate-500">{articles.length}</span>
                    </button>
                    <button
                      onClick={() => setFilterStatus("draft")}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        filterStatus === "draft" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-400" /> In Progress</span>
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-sm border border-slate-100 font-mono text-slate-500">
                        {articles.filter(a => a.status === "draft").length}
                      </span>
                    </button>
                    <button
                      onClick={() => setFilterStatus("published")}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        filterStatus === "published" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Published</span>
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-sm border border-slate-100 font-mono text-slate-500">
                        {articles.filter(a => a.status === "published").length}
                      </span>
                    </button>
                  </nav>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Folders / Topic Catalog</h4>
                  <div className="flex flex-col gap-1">
                    {["All", "Technology", "Creative Writing", "Marketing", "Personal", "Research"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          filterCategory === cat ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          cat === "All" ? "bg-slate-300" :
                          cat === "Technology" ? "bg-blue-500" :
                          cat === "Creative Writing" ? "bg-orange-500" :
                          cat === "Marketing" ? "bg-emerald-500" : "bg-indigo-400"
                        }`} />
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TAG CHIPS */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Tag indexing</h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => setSelectedTag("All")}
                      className={`text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium ${
                        selectedTag === "All" ? "ring-1.5 ring-blue-500 text-blue-700" : ""
                      }`}
                    >
                      all tags
                    </button>
                    {allUniqueTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border text-slate-600 font-medium ${
                          selectedTag === tag ? "bg-orange-50 border-orange-200 text-orange-900 font-bold" : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* DASHBOARD CENTRAL CATALOG & WRITING LIST */}
            <div className="flex-1 p-8 space-y-6">
              
              {/* TOP WORKPLACE BAR: Filter with details */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Your Creative Workspace</h2>
                  <p className="text-slate-500 text-sm">Review, enhance, and create articles with instant autocomplete support.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search title or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-56 transition-all"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-600 focus:outline-hidden"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                    <option value="wordCount">Sort: Word Count</option>
                    <option value="title">Sort: Alphabetical</option>
                  </select>
                </div>
              </div>

              {/* CARD CATALOG */}
              {sortedArticles.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-8">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
                    <BookMarked className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No Articles Found</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
                    Try amending your search term, changing directories, or create a brand new blogging manuscript.
                  </p>
                  <button
                    onClick={handleCreateArticle}
                    className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Create Your First Article
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedArticles.map((art) => {
                    const cleanDescription = art.content
                      ? art.content.replace(/[#*`]/g, "").substring(0, 110) + "..."
                      : "Empty canvas...";

                    return (
                      <motion.div
                        layout
                        key={art.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => openArticleInEditor(art)}
                        className="group relative cursor-pointer bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all hover:shadow-xs flex flex-col justify-between min-h-[220px]"
                      >
                        {/* Status bar marker */}
                        <div className="absolute top-0 left-6 right-6 h-1 rounded-b-md transition-all group-hover:h-1.5"
                          style={{
                            backgroundColor: art.status === "published" ? "#10b981" : "#f97316"
                          }}
                        />

                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                              {art.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(art.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {art.title}
                          </h3>

                          <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-3">
                            {cleanDescription}
                          </p>
                        </div>

                        {/* Article diagnostics statistics (Grammarly style) */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 text-xs font-mono text-slate-400">
                          <div className="flex items-center gap-3">
                            <span>{art.wordCount} words</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">{art.readabilityScore} readability</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => toggleBookmark(art.id, e)}
                              className="p-1 rounded-sm text-slate-300 hover:text-amber-500 hover:bg-slate-50 transition-colors"
                              title="Bookmark draft"
                            >
                              <Bookmark className={`w-4 h-4 ${art.isBookmarked ? "fill-amber-400 text-amber-500" : ""}`} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteArticle(art.id, e)}
                              className="p-1 rounded-sm text-slate-300 hover:text-red-500 hover:bg-slate-50 transition-colors"
                              title="Delete manuscript"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. INTUITIVE WORKSPACE WRITING ENVIRONMENT (EDITOR) */}
        {currentView === "EDITOR" && (
          <div id="editor-view" className="flex-1 flex flex-col md:flex-row bg-white relative">
            
            {/* WRITING WORKSPACE SHEET */}
            <div className="flex-1 p-6 md:p-10 flex flex-col gap-6 max-w-4xl mx-auto w-full">
              
              {/* Back to library ribbon */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <button
                  onClick={() => {
                    saveCurrentArticle();
                    setCurrentView("DASHBOARD");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Library Dashboard
                </button>

                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isEditorSaving ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
                  <span className="text-[11px] font-mono text-slate-400">
                    {isEditorSaving ? "Autosaving to Enhance AI cloud..." : "Synced & Saved"}
                  </span>
                  
                  <button
                    onClick={() => saveCurrentArticle()}
                    className="ml-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 px-3 py-1.5 rounded-lg"
                  >
                    Force Save
                  </button>

                  <button
                    onClick={() => selectedArticle && togglePublishStatus(selectedArticle)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      selectedArticle?.status === "published" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}
                  >
                    {selectedArticle?.status === "published" ? "Live (Publish)" : "Draft Only"}
                  </button>
                </div>
              </div>

              {/* ARTICLE SCHEMAS INPUT fields */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* Category select block */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-medium tracking-wider text-slate-400">Section</span>
                    <select
                      value={editorCategory}
                      onChange={(e) => setEditorCategory(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-md border border-slate-200 text-slate-700 bg-white"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Creative Writing">Creative Writing</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Personal">Personal</option>
                      <option value="Research">Research</option>
                    </select>
                  </div>

                  {/* Toggle autocomplete feature */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Autocomplete:</span>
                    <button
                      onClick={() => {
                        setEnableAutocomplete(!enableAutocomplete);
                        showToast(enableAutocomplete ? "Neural autocomplete disabled." : "Neural autocomplete enabled.", "info");
                      }}
                      className={`relative min-w-8 h-4.5 rounded-full p-0.5 transition-all outline-hidden ${
                        enableAutocomplete ? "bg-orange-500" : "bg-slate-200"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all shadow-xs ${
                        enableAutocomplete ? "translate-x-3.5" : "translate-x-0"
                      }`} />
                    </button>
                    <span className="font-semibold text-slate-600">{enableAutocomplete ? "Active" : "Muted"}</span>
                  </div>
                </div>

                {/* Article Name Heading input */}
                <input
                  type="text"
                  placeholder="Enter a compelling title..."
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  className="w-full text-3xl font-extrabold text-slate-900 focus:outline-hidden placeholder:text-slate-300 border-none bg-transparent"
                />

                {/* Tag manager */}
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Tags className="w-3.5 h-3.5" />
                    Tags:
                  </span>
                  {editorTags.map(tag => (
                    <span 
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100"
                    >
                      #{tag}
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-red-500 text-[9px] font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <form onSubmit={handleAddTag} className="inline-flex">
                    <input
                      type="text"
                      placeholder="+ Add Tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="text-xs px-2 py-0.5 w-18 border-none bg-transparent focus:outline-hidden focus:ring-0 text-slate-500 hover:text-slate-800"
                    />
                  </form>
                </div>
              </div>

              {/* CORE EDITING WRITING SPACE */}
              <div className="relative flex-1 flex flex-col min-h-[350px]">
                {/* Simulated Tiptap styled textbox with instant inline prediction */}
                <textarea
                  ref={textEditorRef}
                  value={editorContent}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Start putting your thoughts down into written blog articles. Pause writing for a short moment, and a helpful sentence suggestion completes your copy instantly using modern predictive models. Press Tab to accept completions!"
                  className="w-full flex-1 resize-none bg-transparent font-sans text-base leading-relaxed text-slate-800 focus:outline-hidden min-h-[300px] border-none font-medium placeholder:text-slate-300 placeholder:font-normal"
                />

                {/* Dynamic Suggestion Floating box indicator */}
                {isSuggesting && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-xs text-orange-850 font-bold shadow-sm">
                    <RefreshCw className="w-3 h-3 text-orange-500 animate-spin" />
                    Predicting sentences...
                  </div>
                )}

                {ghostSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-4 right-4 bg-orange-50 border border-orange-200 text-orange-950 p-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold shadow-md z-10"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span>Continue writing suggestion: <span className="text-slate-900 bg-white/70 px-1.5 py-0.5 rounded border border-orange-100 italic">&quot;{ghostSuggestion}&quot;</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={acceptSuggestion}
                        className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-[10px] uppercase font-bold"
                      >
                        Press Tab to Accept ⇥
                      </button>
                      <button
                        onClick={() => setGhostSuggestion("")}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* EDITOR STATISTICS BAR */}
              <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                <div className="flex items-center gap-4">
                  <span>WORDS: <strong className="text-slate-700">{editorContent ? editorContent.trim().split(/\s+/).filter(Boolean).length : 0}</strong></span>
                  <span>CHARACTERS: <strong className="text-slate-700">{editorContent.length}</strong></span>
                  <span>READABILITY RATING: <strong className="text-emerald-600">{
                    selectedArticle?.readabilityScore || 75
                  }%</strong></span>
                </div>
                <div>
                  <button
                    onClick={() => {
                      // Suggest outline instantly
                      handleAIAssistance("outline");
                    }}
                    className="text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Re-check reading structure
                  </button>
                </div>
              </div>
            </div>

            {/* EXPANDABLE AI WRITING ASSISTANT SIDEBAR (Grammarly style) */}
            <aside 
              id="ai-panel" 
              className={`border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50 transition-all flex flex-col shrink-0 ${
                aiSidebarOpen ? "w-full md:w-80" : "w-12 h-12 md:h-auto md:w-12 items-center pt-4"
              }`}
            >
              {aiSidebarOpen ? (
                <div className="p-6 space-y-6 flex flex-col h-full justify-between">
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Enhance AI Copilot</h3>
                      </div>
                      <button 
                        onClick={() => setAiSidebarOpen(false)}
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                        title="Collapse panel"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* AI ACTION 1: IMPROVE TONE */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-500" />
                        Clarify Tone & Grammar
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Adjust vocabulary readability for target reading demographic metrics.
                      </p>
                      
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
                      >
                        <option value="Clear & Professional">Clear & Professional (Standard)</option>
                        <option value="Creative & Storyteller">Creative & Narrative Storyteller</option>
                        <option value="Bold & Click-worthy">Bold & Strategic Copywriting</option>
                        <option value="Concise & Punchy">Concise & Punchy</option>
                      </select>

                      <button
                        onClick={() => handleAIAssistance("improve-tone")}
                        disabled={isAIProcessing}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {isAIProcessing ? "Compiling..." : "Rewrite Text"} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* AI ACTION 2: HEADLINE GENERATOR */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-orange-500" />
                        Blogger Headlines Generator
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Convert this draft into organic, high read-through headings.
                      </p>
                      <button
                        onClick={() => handleAIAssistance("headlines")}
                        disabled={isAIProcessing}
                        className="w-full py-1.5 bg-orange-50 border border-orange-200 hover:border-orange-300 text-orange-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Generate Headlines
                      </button>
                    </div>

                    {/* AI ACTION 3: EXPAND OUTLINE */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                        Manuscript Outline Expander
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Stuck? Build sequential templates for paragraph structuring.
                      </p>
                      <button
                        onClick={() => handleAIAssistance("outline")}
                        disabled={isAIProcessing}
                        className="w-full py-1.5 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-emerald-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Generate Outlines
                      </button>
                    </div>
                  </div>

                  {/* REAL-TIME GENERATION OUTPUT PREVIEW (IF ANY AVAILABLE) */}
                  {aiOutputResult && (
                    <div className="bg-white p-4 rounded-xl border border-orange-200 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          AI Compiled Output
                        </span>
                        <button
                          onClick={() => setAiOutputResult("")}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          Clear
                        </button>
                      </div>
                      <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto bg-slate-50 p-2.5 rounded border border-slate-100">
                        {aiOutputResult}
                      </pre>
                      <button
                        onClick={applyAIPositionContent}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all"
                      >
                        Apply / Overwrite to Paper
                      </button>
                    </div>
                  )}

                  {isAIProcessing && (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 bg-white/75 border border-slate-150 rounded-xl">
                      <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
                      <span className="text-xs font-medium text-slate-500">Consulting Gemini knowledge...</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAiSidebarOpen(true)}
                  className="p-2 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-all flex items-center justify-center"
                  title="Expand AI Assistant"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </button>
              )}
            </aside>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer id="app-footer" className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <p>© 2026 Enhance AI Inc. Minimalistic structured blog catalogs with real-time autocompletion.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              API Server Online
            </span>
            <span>v1.0.4-production</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
