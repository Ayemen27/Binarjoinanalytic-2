import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Receipt, ShoppingCart, BarChart, Plus, Users, UserCheck, ArrowRight, RefreshCw } from "lucide-react";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import AddProjectForm from "@/components/forms/add-project-form";
import EnhancedAddWorkerForm from "@/components/forms/enhanced-add-worker-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingCard, LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Project, DailyExpenseSummary } from "@shared/schema";

interface ProjectStats {
  totalWorkers: string;
  totalExpenses: number;
  totalIncome: number;
  currentBalance: number;
  activeWorkers: string;
  completedDays: string;
  materialPurchases: string;
  lastActivity: string;
}

interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const queryClient = useQueryClient();

  // تحميل المشاريع مع الإحصائيات بشكل محسن
  const { data: projects = [], isLoading: projectsLoading } = useQuery<ProjectWithStats[]>({
    queryKey: ["/api/projects/with-stats"],
    staleTime: 1000 * 30, // 30 ثانية فقط للإحصائيات لضمان الحصول على البيانات المحدثة
    refetchInterval: 1000 * 60, // إعادة التحديث كل دقيقة
  });

  const { data: todaySummary } = useQuery<DailyExpenseSummary>({
    queryKey: ["/api/projects", selectedProjectId, "daily-summary", new Date().toISOString().split('T')[0]],
    enabled: !!selectedProjectId,
    staleTime: 1000 * 30, // 30 ثانية للملخص اليومي
  });

  // دالة إعادة تحميل البيانات
  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/projects/with-stats"] });
    if (selectedProjectId) {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "daily-summary"] });
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // إضافة تسجيل للتحقق من البيانات في Frontend
  if (selectedProject) {
    console.log('🔍 بيانات المشروع المحدد في Frontend:', {
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      totalIncome: selectedProject.stats?.totalIncome,
      totalExpenses: selectedProject.stats?.totalExpenses,
      currentBalance: selectedProject.stats?.currentBalance
    });
    
    // فحص خاص لمشروع الحبشي
    if (selectedProject.name.includes('الحبشي')) {
      console.warn('🚨 مشروع الحبشي - تحقق من البيانات:', {
        مشروع: selectedProject.name,
        الدخل: selectedProject.stats?.totalIncome,
        المصاريف: selectedProject.stats?.totalExpenses,
        هل_متساوية: selectedProject.stats?.totalIncome === selectedProject.stats?.totalExpenses,
        fullStats: selectedProject.stats
      });
    }
  }

  const quickActions = [
    {
      icon: Clock,
      label: "تسجيل حضور",
      bgColor: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      textColor: "text-primary-foreground",
      action: () => setLocation("/worker-attendance"),
    },
    {
      icon: Receipt,
      label: "مصروفات يومية",
      bgColor: "bg-secondary",
      hoverColor: "hover:bg-secondary/90",
      textColor: "text-secondary-foreground",
      action: () => setLocation("/daily-expenses"),
    },
    {
      icon: ShoppingCart,
      label: "شراء مواد",
      bgColor: "bg-success",
      hoverColor: "hover:bg-success/90",
      textColor: "text-success-foreground",
      action: () => setLocation("/material-purchase"),
    },
    {
      icon: BarChart,
      label: "التقارير",
      bgColor: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      textColor: "text-white",
      action: () => setLocation("/reports"),
    },
    {
      icon: ArrowRight,
      label: "ترحيل أموال",
      bgColor: "bg-orange-600",
      hoverColor: "hover:bg-orange-700",
      textColor: "text-white",
      action: () => setLocation("/project-transfers"),
    },
  ];

  // عرض شاشة تحميل أولية إذا كانت المشاريع لم تحمل بعد
  if (projectsLoading) {
    return <LoadingCard />;
  }

  return (
    <div className="p-4 fade-in">
      {/* Refresh Button */}
      <div className="flex justify-end mb-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefreshData}
          className="h-8 px-3 text-xs"
        >
          <RefreshCw className="ml-1 h-3 w-3" />
          تحديث البيانات
        </Button>
      </div>

      {/* Management Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-12 border-2 border-dashed">
              <Plus className="ml-2 h-4 w-4" />
              إضافة مشروع
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مشروع جديد</DialogTitle>
            </DialogHeader>
            <AddProjectForm onSuccess={() => setShowAddProject(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showAddWorker} onOpenChange={setShowAddWorker}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-12 border-2 border-dashed">
              <Users className="ml-2 h-4 w-4" />
              إضافة عامل
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عامل جديد</DialogTitle>
            </DialogHeader>
            <EnhancedAddWorkerForm onSuccess={() => setShowAddWorker(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Multi-Project Workers Link */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <Button 
          variant="outline" 
          className="h-12 border-2 border-blue-300 hover:bg-blue-50"
          onClick={() => setLocation("/multi-project-workers")}
        >
          <UserCheck className="ml-2 h-5 w-5 text-blue-600" />
          <span className="text-blue-700 font-medium">العمال متعددي المشاريع</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-12 border-2 border-green-300 hover:bg-green-50"
          onClick={() => setLocation("/enhanced-worker-statement")}
        >
          <Users className="ml-2 h-5 w-5 text-green-600" />
          <span className="text-green-700 font-medium">كشف حساب العامل المحسن</span>
        </Button>
      </div>

      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={selectProject}
      />

      {selectedProject && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{selectedProject.name}</h3>
              <Badge variant="secondary" className="bg-success text-success-foreground">
                نشط
              </Badge>
            </div>

            {/* Project Statistics */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">إجمالي التوريد</div>
                <div className="text-lg font-bold text-primary arabic-numbers">
                  {projectsLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : formatCurrency(selectedProject?.stats?.totalIncome || 0)}
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">إجمالي المنصرف</div>
                <div className="text-lg font-bold text-destructive arabic-numbers">
                  {projectsLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : formatCurrency(selectedProject?.stats?.totalExpenses || 0)}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">المتبقي الحالي</div>
                <div className="text-lg font-bold text-success arabic-numbers">
                  {projectsLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : formatCurrency(selectedProject?.stats?.currentBalance || 0)}
                </div>
              </div>
            </div>

            {/* Project Activity Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">أيام العمل</div>
                <div className="text-lg font-bold text-foreground arabic-numbers">
                  {projectsLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : (selectedProject?.stats?.completedDays || "0")}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">المشتريات</div>
                <div className="text-lg font-bold text-foreground arabic-numbers">
                  {projectsLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : (selectedProject?.stats?.materialPurchases || "0")}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">العمال</div>
                <div className="text-lg font-bold text-foreground arabic-numbers">
                  {projectsLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : (selectedProject?.stats?.activeWorkers || "0")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-foreground mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`${action.bgColor} ${action.hoverColor} ${action.textColor} p-4 h-auto flex-col space-y-2 transition-colors`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
