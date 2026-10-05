import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EmergencyModal } from './components/EmergencyModal';

// Active Pages
import { Dashboard } from './pages/Dashboard';
import { ChatAssistant } from './pages/ChatAssistant';
import { SymptomChecker } from './pages/SymptomChecker';
import { MedicineInfo } from './pages/MedicineInfo';
import { ReportAnalyzer } from './pages/ReportAnalyzer';
import { MedicalDictionary } from './pages/MedicalDictionary';
import { TextSimplifier } from './pages/TextSimplifier';
import { HealthEducation } from './pages/HealthEducation';
import { HealthNews } from './pages/HealthNews';
import { HealthTimeline } from './pages/HealthTimeline';
import { TrustedResourcesPage } from './pages/TrustedResourcesPage';
import { ProfileSettings } from './pages/ProfileSettings';
import { AdminDashboard } from './pages/AdminDashboard';
import { HealthNewsArticle } from './types';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>('');
  const [dictInitialTerm, setDictInitialTerm] = useState<string>('');
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  const handleQuickQuery = (query: string) => {
    setChatInitialQuery(query);
    setCurrentPage('assistant');
  };

  const handleAskAIAboutNews = (article: HealthNewsArticle) => {
    const prompt = `Explain this health news in simple terms: "${article.title}"\n\nContext from ${article.source_name}: ${article.summary}`;
    setChatInitialQuery(prompt);
    setCurrentPage('assistant');
  };

  const handleOpenDictTerm = (term: string) => {
    setDictInitialTerm(term);
    setCurrentPage('medical_dict');
  };

  const handleGlobalSearchSelect = (query: string) => {
    const qLower = query.toLowerCase();
    if (qLower.includes('report') || qLower.includes('cbc') || qLower.includes('lipid') || qLower.includes('test')) {
      setCurrentPage('report_analyzer');
    } else if (qLower.includes('news') || qLower.includes('outbreak') || qLower.includes('research')) {
      setCurrentPage('news');
    } else if (qLower.includes('symptom') || qLower.includes('fever') || qLower.includes('headache')) {
      setCurrentPage('symptoms');
    } else if (qLower.includes('medicine') || qLower.includes('paracetamol') || qLower.includes('drug') || qLower.includes('dose')) {
      setCurrentPage('medicine');
    } else if (qLower.includes('source') || qLower.includes('who') || qLower.includes('cdc') || qLower.includes('nih')) {
      setCurrentPage('sources');
    } else if (qLower.includes('mean?') || qLower.includes('tachycardia') || qLower.includes('hypertension') || qLower.includes('cholesterol')) {
      setDictInitialTerm(query);
      setCurrentPage('medical_dict');
    } else {
      handleQuickQuery(query);
    }
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Dashboard 
            onNavigate={setCurrentPage} 
            onQuickQuery={handleQuickQuery}
            onOpenEmergencyModal={() => setShowEmergencyModal(true)}
            onAskAIAboutNews={handleAskAIAboutNews}
          />
        );
      case 'assistant':
        return (
          <ChatAssistant 
            initialQuery={chatInitialQuery} 
            onOpenDictionary={handleOpenDictTerm} 
          />
        );
      case 'symptoms':
        return <SymptomChecker />;
      case 'medicine':
        return <MedicineInfo />;
      case 'report_analyzer':
        return <ReportAnalyzer />;
      case 'medical_dict':
        return <MedicalDictionary initialTerm={dictInitialTerm} />;
      case 'simplify_text':
        return <TextSimplifier />;
      case 'health_education':
        return <HealthEducation />;
      case 'news':
        return (
          <HealthNews 
            onAskAIAboutNews={handleAskAIAboutNews}
            onNavigate={setCurrentPage}
          />
        );
      case 'timeline':
        return <HealthTimeline />;
      case 'sources':
        return <TrustedResourcesPage />;
      case 'settings':
      case 'profile':
        return <ProfileSettings />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <Dashboard 
            onNavigate={setCurrentPage} 
            onQuickQuery={handleQuickQuery}
            onOpenEmergencyModal={() => setShowEmergencyModal(true)}
            onAskAIAboutNews={handleAskAIAboutNews}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Bar Shell */}
      <Navbar
        onSearchSelect={handleGlobalSearchSelect}
        onNavigate={setCurrentPage}
        onOpenEmergency={() => setShowEmergencyModal(true)}
      />

      {/* Main Body Shell: Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            if (page === 'assistant') setChatInitialQuery('');
            setCurrentPage(page);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenEmergency={() => setShowEmergencyModal(true)}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-7 overflow-y-auto max-w-full pb-20 md:pb-8">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Emergency Guidance Modal */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
