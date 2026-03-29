/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  PhoneCall, 
  Users, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  LayoutDashboard,
  LogOut,
  LogIn,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  Clock,
  MapPin,
  Briefcase
} from "lucide-react";
import { db, auth, googleProvider } from "./firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'anonymous',
      email: auth.currentUser?.email || 'none',
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  city: string;
  createdAt: Timestamp;
  status: 'new' | 'contacted' | 'closed';
}

const AdminDashboard = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "leads");
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "leads", id), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteDoc(doc(db, "leads", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar/Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-1.5 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">CleanLeads Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold">{user.displayName}</span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Leads", value: leads.length, color: "blue", icon: Users },
            { label: "New Leads", value: leads.filter(l => l.status === 'new').length, color: "green", icon: Zap },
            { label: "Contacted", value: leads.filter(l => l.status === 'contacted').length, color: "amber", icon: PhoneCall },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-100 outline-none"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
                      <p className="text-slate-500">Loading leads...</p>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No leads found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{lead.name}</span>
                          <span className="text-sm text-slate-500">{lead.email}</span>
                          <span className="text-sm text-slate-500">{lead.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Briefcase className="w-4 h-4" />
                          <span className="text-sm font-medium">{lead.businessName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{lead.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 outline-none
                            ${lead.status === 'new' ? 'bg-green-100 text-green-700 focus:ring-green-200' : 
                              lead.status === 'contacted' ? 'bg-amber-100 text-amber-700 focus:ring-amber-200' : 
                              'bg-slate-100 text-slate-700 focus:ring-slate-200'}`}
                        >
                          <option value="new">NEW</option>
                          <option value="contacted">CONTACTED</option>
                          <option value="closed">CLOSED</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Clock className="w-4 h-4" />
                          {lead.createdAt?.toDate().toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteLead(lead.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

const CTAButton = ({ className = "", onClick }: { className?: string; onClick?: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${className}`}
  >
    👉 Start Free Trial
  </motion.button>
);

const Section = ({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-20 px-6 md:px-12 lg:px-24 ${className}`}>
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </section>
);

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left font-semibold text-lg md:text-xl text-gray-900 focus:outline-none"
      >
        <span>{question}</span>
        {isOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
      </button>
      {isOpen && (
        <motion.p 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 text-gray-600 text-lg"
        >
          {answer}
        </motion.p>
      )}
    </div>
  );
};

const OnboardingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    city: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    
    setLoading(true);
    try {
      // Save to Firestore
      const leadsRef = collection(db, "leads");
      await addDoc(leadsRef, {
        ...formData,
        createdAt: serverTimestamp(),
        status: "new"
      });
      
      setStep(3);
    } catch (err) {
      console.error("Submission error:", err);
      handleFirestoreError(err, OperationType.CREATE, "leads");
      setError("Failed to save your information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>

            <div className="p-8 md:p-12">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-3xl font-bold mb-2">Let's get started</h2>
                  <p className="text-gray-500 mb-8 font-medium">Step 1 of 2: Contact Information</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                      <input 
                        required
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(555) 000-0000"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-colors mt-4 flex items-center justify-center gap-2"
                    >
                      Next Step <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-3xl font-bold mb-2">Almost there</h2>
                  <p className="text-gray-500 mb-8 font-medium">Step 2 of 2: Business Details</p>
                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium text-sm">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Business Name</label>
                      <input 
                        required
                        type="text" 
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="Sparkle Cleaners"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">City / Service Area</label>
                      <input 
                        required
                        type="text" 
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Los Angeles, CA"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                      />
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl text-lg transition-colors"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Finish Setup"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">You're on the list!</h2>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    We've received your details. One of our experts will call you within 24 hours to finalize your setup.
                  </p>
                  <button 
                    onClick={onClose}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-gray-800 transition-colors"
                  >
                    Got it, thanks!
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/admin');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-green-100 selection:text-green-900">
      <OnboardingModal isOpen={isModalOpen} onClose={closeModal} />
      
      {/* SECTION 1: HERO */}
      <Section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white relative">
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-2xl">
              <Zap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter">CleanLeads</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={user ? () => navigate('/admin') : handleLogin}
              className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {user ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {user ? "Admin Dashboard" : "Admin Login"}
            </button>
            <CTAButton onClick={openModal} className="hidden sm:block" />
          </div>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Get More Cleaning Jobs in <span className="text-green-600">7 Days</span> Or Don’t Pay
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              We bring you real leads. You only pay if it works.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                "More calls to your phone",
                "More local customers",
                "Setup done for you"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-lg font-medium">
                  <CheckCircle2 className="text-green-600 w-6 h-6" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-start gap-4">
              <CTAButton onClick={openModal} />
              <p className="text-sm text-gray-500 font-medium ml-2">
                No contracts • No risk • Cancel anytime
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-[300px] md:max-w-[400px]">
              {/* Phone Mockup */}
              <div className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl border-8 border-gray-800 aspect-[9/19]">
                <div className="bg-white h-full w-full rounded-[2rem] overflow-hidden relative flex flex-col items-center justify-center p-6 text-center">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
                  >
                    <PhoneCall className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Incoming Call</h3>
                  <p className="text-green-600 font-bold text-xl mb-4">“New Customer”</p>
                  <div className="w-full space-y-3 mt-4">
                    <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
                    <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
                  </div>
                </div>
              </div>
              {/* Floating Notifications */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                className="absolute -right-4 top-1/4 bg-white shadow-xl p-4 rounded-2xl border border-gray-100 flex items-center gap-3"
              >
                <div className="bg-blue-100 p-2 rounded-full"><MessageSquare className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-xs font-bold">New Lead</p>
                  <p className="text-[10px] text-gray-500">House Cleaning Quote</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* SECTION 2: PROBLEM */}
      <Section className="bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Not Getting Enough Cleaning Jobs?</h2>
          <p className="text-2xl text-gray-600 mb-4">No calls means no money.</p>
          <p className="text-xl text-gray-500 italic">
            Most cleaning businesses rely on luck, referrals, or slow days.
          </p>
          <p className="text-3xl font-bold mt-8 text-red-600">That’s the problem.</p>
        </div>
      </Section>

      {/* SECTION 3: SOLUTION */}
      <Section className="bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">We Fix That in 7 Days</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { step: "Step 1", icon: Zap, text: "We set up your ads and Google profile" },
            { step: "Step 2", icon: PhoneCall, text: "You start getting calls and messages" },
            { step: "Step 3", icon: CheckCircle2, text: "You keep it going if you like results" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <item.icon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-2">{item.step}</h3>
              <p className="text-xl text-gray-700">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <CTAButton onClick={openModal} />
        </div>
      </Section>

      {/* SECTION 4: VISUAL PROOF */}
      <Section className="bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">See Your Leads Live</h2>
          <p className="text-xl text-gray-600">We show you every call and message.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { label: "Call Logs", icon: PhoneCall, value: "42 Calls / Week" },
            { label: "Messages", icon: MessageSquare, value: "18 New Quotes" },
            { label: "Google Views", icon: Eye, value: "1,200+ Views" }
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col items-center text-center">
              <item.icon className="w-12 h-12 text-blue-600 mb-4" />
              <h4 className="text-gray-500 font-medium mb-2 uppercase tracking-wider text-sm">{item.label}</h4>
              <p className="text-3xl font-bold">{item.value}</p>
              <div className="mt-6 w-full h-24 bg-white rounded-xl border border-gray-200 flex items-end justify-around p-2 gap-1">
                {[40, 70, 45, 90, 65, 80, 100].map((h, j) => (
                  <motion.div 
                    key={j}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    className="w-full bg-blue-500 rounded-t-sm"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 5: OFFER BOX */}
      <Section className="bg-gray-50">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-green-600 p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-600 text-white px-6 py-2 rounded-bl-2xl font-bold text-sm">
              BEST VALUE
            </div>
            <h2 className="text-4xl font-bold mb-8">Simple Pricing</h2>
            <div className="space-y-6 mb-10">
              <p className="text-3xl font-extrabold text-green-600">7-Day Free Trial</p>
              <div className="h-px bg-gray-100 w-full"></div>
              <p className="text-2xl font-bold text-gray-800">Then $119/month</p>
              <p className="text-xl text-gray-600">Only if you get leads</p>
              <p className="text-lg text-gray-500">Cancel anytime</p>
            </div>
            <CTAButton onClick={openModal} className="w-full" />
          </div>
        </div>
      </Section>

      {/* SECTION 6: GUARANTEE */}
      <Section className="bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <ShieldCheck className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">No Risk. Zero.</h2>
          <p className="text-2xl text-gray-700 leading-relaxed">
            If you don’t get leads, you don’t pay.
          </p>
          <p className="text-xl text-gray-500 mt-4">
            If you’re not happy, we keep working for free.
          </p>
        </div>
      </Section>

      {/* SECTION 7: WHAT YOU GET */}
      <Section className="bg-gray-50">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <ul className="space-y-6">
              {[
                "Facebook ads setup",
                "Google profile optimization",
                "Lead tracking",
                "Ongoing improvements"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-2xl font-bold">
                  <div className="bg-green-600 rounded-full p-1"><CheckCircle2 className="text-white w-6 h-6" /></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100">
            <p className="text-3xl font-medium text-gray-800 italic leading-snug">
              “We handle everything. You just answer the calls.”
            </p>
          </div>
        </div>
      </Section>

      {/* SECTION 8: URGENCY */}
      <Section className="bg-green-600 text-white text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Start Getting Jobs This Week</h2>
        <p className="text-2xl mb-10 opacity-90">Most clients see activity in 3–5 days.</p>
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openModal}
            className="bg-white text-green-600 font-bold py-5 px-12 rounded-full text-2xl shadow-xl transition-colors cursor-pointer"
          >
            👉 Start Free Trial
          </motion.button>
        </div>
      </Section>

      {/* SECTION 9: FAQ */}
      <Section className="bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-2">
            <FAQItem 
              question="Do I need to pay upfront?" 
              answer="No. It’s free for 7 days. We want to prove our value before you spend a dime." 
            />
            <FAQItem 
              question="What if I don’t get leads?" 
              answer="You don’t pay. Our guarantee is simple: results or it's free." 
            />
            <FAQItem 
              question="Can I cancel?" 
              answer="Yes. Anytime. No long-term contracts, no hidden fees, no headaches." 
            />
          </div>
        </div>
      </Section>

      {/* SECTION 10: FINAL CTA */}
      <Section className="bg-gray-50 text-center py-32">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-12">Ready to Get More Cleaning Jobs?</h2>
        <div className="flex flex-col items-center gap-6">
          <CTAButton onClick={openModal} className="py-6 px-16 text-3xl" />
          <p className="text-xl text-gray-500 font-medium">Takes less than 1 minute</p>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-4">CleanLeads</h3>
              <p className="text-gray-400 max-w-sm">
                Helping cleaning businesses grow with high-quality, exclusive leads.
              </p>
            </div>
            <div className="flex flex-col md:items-end gap-6">
              <div className="flex gap-8 text-sm font-medium text-gray-400">
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
              <p className="text-gray-500 text-sm">
                © 2026 CleanLeads. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route 
        path="/admin" 
        element={
          user && user.email === 'uk03777@gmail.com' ? (
            <AdminDashboard user={user} onLogout={handleLogout} />
          ) : (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
              <ShieldCheck className="w-16 h-16 text-green-600 mb-6" />
              <h1 className="text-3xl font-bold mb-4">Admin Access Required</h1>
              <p className="text-gray-600 mb-8 max-w-md">
                This area is restricted to authorized personnel. Please sign in with your admin account.
              </p>
              <button 
                onClick={handleLogin}
                className="bg-green-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" /> Sign In as Admin
              </button>
              <Link to="/" className="mt-6 text-gray-500 hover:text-gray-900 font-medium">
                Back to Public Site
              </Link>
            </div>
          )
        } 
      />
    </Routes>
  );
}
