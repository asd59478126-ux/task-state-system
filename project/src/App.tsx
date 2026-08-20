import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Zap,
  CircleDot,
  CheckSquare,
  MessageSquareReply,
  GitBranch,
  Scale,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";
import { clsx } from "./components/clsx";
import { Dashboard } from "./pages/Dashboard";
import { Cases } from "./pages/Cases";
import { CaseDetail } from "./pages/CaseDetail";
import { Events } from "./pages/Events";
import { States } from "./pages/States";
import { Tasks } from "./pages/Tasks";
import { Feedback } from "./pages/Feedback";
import { EvolutionCandidates } from "./pages/EvolutionCandidates";
import { EvolutionRules } from "./pages/EvolutionRules";
import { ValidationReports } from "./pages/ValidationReports";

type Page =
  | "dashboard"
  | "cases"
  | "case-detail"
  | "events"
  | "states"
  | "tasks"
  | "feedback"
  | "evolution-candidates"
  | "evolution-rules"
  | "validation-reports";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "儀表板", icon: LayoutDashboard, group: "總覽" },
  { id: "cases", label: "案例管理", icon: FolderOpen, group: "案例事實層" },
  { id: "events", label: "事件", icon: Zap, group: "案例事實層" },
  { id: "states", label: "狀態", icon: CircleDot, group: "案例事實層" },
  { id: "tasks", label: "任務", icon: CheckSquare, group: "案例事實層" },
  { id: "feedback", label: "回饋", icon: MessageSquareReply, group: "案例事實層" },
  { id: "evolution-candidates", label: "演化候選介面", icon: GitBranch, group: "演化層" },
  { id: "evolution-rules", label: "演化規則", icon: Scale, group: "演化層" },
  { id: "validation-reports", label: "驗證報告", icon: ClipboardCheck, group: "驗證" },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalFilterCaseId, setGlobalFilterCaseId] = useState<string | null>(null);

  const navigate = useCallback((p: string) => {
    setPage(p as Page);
    setSidebarOpen(false);
  }, []);

  const openCase = useCallback((caseId: string) => {
    setSelectedCaseId(caseId);
    setGlobalFilterCaseId(caseId);
    setPage("case-detail");
    setSidebarOpen(false);
  }, []);

  const navigateWithCaseFilter = useCallback((p: string, caseId: string | null) => {
    setGlobalFilterCaseId(caseId);
    setPage(p as Page);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    document.title = "事件結果整合演化模型";
  }, []);

  const groups = [...new Set(navItems.map((n) => n.group))];

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard onNavigate={navigate} onOpenCase={openCase} />;
      case "cases":
        return <Cases onOpenCase={openCase} />;
      case "case-detail":
        return selectedCaseId ? (
          <CaseDetail
            caseId={selectedCaseId}
            onNavigate={(p) => navigateWithCaseFilter(p, selectedCaseId)}
          />
        ) : (
          <Cases onOpenCase={openCase} />
        );
      case "events":
        return <Events filterCaseId={globalFilterCaseId} onCaseChange={setGlobalFilterCaseId} />;
      case "states":
        return <States filterCaseId={globalFilterCaseId} onCaseChange={setGlobalFilterCaseId} />;
      case "tasks":
        return <Tasks filterCaseId={globalFilterCaseId} onCaseChange={setGlobalFilterCaseId} />;
      case "feedback":
        return <Feedback filterCaseId={globalFilterCaseId} onCaseChange={setGlobalFilterCaseId} />;
      case "evolution-candidates":
        return <EvolutionCandidates filterCaseId={globalFilterCaseId} onCaseChange={setGlobalFilterCaseId} />;
      case "evolution-rules":
        return <EvolutionRules />;
      case "validation-reports":
        return <ValidationReports filterCaseId={globalFilterCaseId} onCaseChange={setGlobalFilterCaseId} />;
      default:
        return <Dashboard onNavigate={navigate} onOpenCase={openCase} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-neutral-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-40 flex w-64 flex-col bg-neutral-900 text-neutral-300 transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-neutral-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <GitBranch size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">演化模型系統</p>
            <p className="text-[10px] text-neutral-500">v0.3 Schema</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {group}
              </p>
              <div className="space-y-0.5">
                {navItems
                  .filter((n) => n.group === group)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      page === item.id ||
                      (item.id === "cases" && page === "case-detail");
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={clsx(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary-600 text-white"
                            : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        )}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-neutral-800 px-5 py-3">
          <p className="text-[10px] text-neutral-600">
            Parser v1.8 / Interface v0.1
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-3 border-b border-neutral-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-neutral-600 hover:text-neutral-900"
          >
            <Menu size={22} />
          </button>
          <h2 className="text-sm font-medium text-neutral-500">
            {navItems.find((n) => n.id === page)?.label ?? "案例詳情"}
          </h2>
          {globalFilterCaseId && page !== "dashboard" && page !== "cases" && page !== "case-detail" && (
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              已篩選案例
            </span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
