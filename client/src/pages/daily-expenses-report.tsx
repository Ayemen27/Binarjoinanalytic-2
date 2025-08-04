import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, FileSpreadsheet, Printer, Download, Filter, BarChart3, TrendingUp, DollarSign, Eye, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Project } from "@shared/schema";
import "../styles/daily-expenses-print.css";

interface DailyExpenseData {
  date: string;
  summary: {
    carriedForward: number;
    totalIncome: number;
    totalExpenses: number;
    remainingBalance: number;
    totalFundTransfers: number;
    totalWorkerWages: number;
    totalMaterialCosts: number;
    totalTransportationCosts: number;
    totalWorkerTransfers: number;
    totalWorkerMiscExpenses: number;
  };
  fundTransfers: any[];
  workerAttendance: any[];
  materialPurchases: any[];
  transportationExpenses: any[];
  workerTransfers: any[];
  workerMiscExpenses: any[];
}

export default function DailyExpensesReport() {
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();
  
  // تحديد فترة افتراضية تحتوي على بيانات فعلية
  const [dateFrom, setDateFrom] = useState('2025-07-26');
  const [dateTo, setDateTo] = useState('2025-08-03');
  const [reportData, setReportData] = useState<DailyExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // تحديد مشروع افتراضي إذا لم يكن هناك مشروع محدد وتوجد مشاريع
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      // البحث عن المشروع الذي يحتوي على بيانات
      const projectWithData = projects.find(p => p.id === '4dd91471-231d-40da-ac05-7999556c5a72');
      if (projectWithData) {
        selectProject(projectWithData.id);
      } else {
        selectProject(projects[0].id);
      }
    }
  }, [projects, selectedProjectId, selectProject]);

  const generateReport = useCallback(async () => {
    if (!selectedProjectId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast({
        title: "خطأ",
        description: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest("GET", `/api/reports/daily-expenses-range/${selectedProjectId}?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      setReportData(data);
      
      toast({
        title: "تم إنشاء التقرير",
        description: `تم إنشاء كشف المصروفات اليومية من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, dateFrom, dateTo, toast]);

  // تحميل التقرير تلقائياً عند اختيار مشروع
  useEffect(() => {
    if (selectedProjectId && dateFrom && dateTo && projects.length > 0) {
      generateReport();
    }
  }, [selectedProjectId, projects.length, generateReport]);

  const exportToExcel = useCallback(async () => {
    if (!reportData.length) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 بدء تصدير Excel مبسط');
    console.log('📊 عدد الأيام:', reportData.length);
    
    // حساب الإجماليات مع تسجيل مفصل
    let totalIncome = 0, totalExpenses = 0, totalFundTransfers = 0;
    let totalWorkerWages = 0, totalMaterialCosts = 0, totalTransportationCosts = 0, totalWorkerTransfers = 0, totalWorkerMiscExpenses = 0;
    
    reportData.forEach((day, index) => {
      console.log(`📅 اليوم ${index + 1}: ${day.date}`);
      console.log(`💰 إيرادات: ${day.summary.totalIncome}, مصروفات: ${day.summary.totalExpenses}`);
      
      totalIncome += Number(day.summary.totalIncome) || 0;
      totalExpenses += Number(day.summary.totalExpenses) || 0;
      totalFundTransfers += Number(day.summary.totalFundTransfers) || 0;
      totalWorkerWages += Number(day.summary.totalWorkerWages) || 0;
      totalMaterialCosts += Number(day.summary.totalMaterialCosts) || 0;
      totalTransportationCosts += Number(day.summary.totalTransportationCosts) || 0;
      totalWorkerTransfers += Number(day.summary.totalWorkerTransfers) || 0;
      totalWorkerMiscExpenses += Number(day.summary.totalWorkerMiscExpenses) || 0;
    });
    
    const finalBalance = reportData.length > 0 ? Number(reportData[reportData.length - 1].summary.remainingBalance) || 0 : 0;
    
    console.log('📈 الإجماليات المحسوبة:');
    console.log(`💰 إجمالي الإيرادات: ${totalIncome}`);
    console.log(`💸 إجمالي المصروفات: ${totalExpenses}`);
    console.log(`🏦 الرصيد النهائي: ${finalBalance}`);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف المصروفات اليومية', {
        views: [{ rightToLeft: true }]
      });
      
      console.log('📋 إنشاء Excel مع البيانات الفعلية');
      
      // إضافة عنوان الشركة مع تنسيق محسن
      worksheet.mergeCells('A1:K2');
      const companyHeader = worksheet.getCell('A1');
      companyHeader.value = `شركة الحاج عبدالرحمن علي الجهني وأولاده\nكشف المصروفات اليومية - ${selectedProject?.name}`;
      companyHeader.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      companyHeader.font = { size: 16, bold: true, color: { argb: 'FF1F2937' } };
      companyHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      companyHeader.border = {
        top: { style: 'thick', color: { argb: 'FF2563EB' } },
        left: { style: 'thick', color: { argb: 'FF2563EB' } },
        bottom: { style: 'thick', color: { argb: 'FF2563EB' } },
        right: { style: 'thick', color: { argb: 'FF2563EB' } }
      };
      
      // إضافة معلومات الفترة مع تحسينات
      worksheet.mergeCells('A3:K3');
      const periodHeader = worksheet.getCell('A3');
      periodHeader.value = `الفترة: من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)} | تاريخ التقرير: ${formatDate(new Date())} | إجمالي الأيام: ${reportData.length}`;
      periodHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      periodHeader.font = { size: 12, bold: false, color: { argb: 'FF374151' } };
      periodHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
      
      // إضافة ملخص الإجماليات
      worksheet.mergeCells('A4:K4');
      const summaryHeader = worksheet.getCell('A4');
      summaryHeader.value = `ملخص سريع: إجمالي الإيرادات ${formatCurrency(totalIncome)} | إجمالي المصروفات ${formatCurrency(totalExpenses)} | الرصيد النهائي ${formatCurrency(finalBalance)}`;
      summaryHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryHeader.font = { size: 11, bold: true, color: { argb: 'FF059669' } };
      summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      
      // إضافة رؤوس الأعمدة مع تنسيق
      const headers = [
        'التاريخ', 'الرصيد المرحل', 'الحوالات المالية', 'أجور العمال', 'شراء المواد', 
        'أجور المواصلات', 'حوالات العمال', 'نثريات العمال', 'إجمالي الإيرادات', 'إجمالي المصروفات', 'الرصيد المتبقي'
      ];
      
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.height = 35;
      
      // تنسيق خاص لكل header
      headerRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF1E40AF' } },
          left: { style: 'medium', color: { argb: 'FF1E40AF' } },
          bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
          right: { style: 'medium', color: { argb: 'FF1E40AF' } }
        };
      });
      
      // إضافة البيانات مع console.log لكل صف
      console.log('📊 بدء إضافة بيانات الأيام إلى Excel');
      
      reportData.forEach((day, index) => {
        const rowData = [
          formatDate(day.date),
          Number(day.summary.carriedForward) || 0,
          Number(day.summary.totalFundTransfers) || 0,
          Number(day.summary.totalWorkerWages) || 0,
          Number(day.summary.totalMaterialCosts) || 0,
          Number(day.summary.totalTransportationCosts) || 0,
          Number(day.summary.totalWorkerTransfers) || 0,
          Number(day.summary.totalWorkerMiscExpenses) || 0,
          Number(day.summary.totalIncome) || 0,
          Number(day.summary.totalExpenses) || 0,
          Number(day.summary.remainingBalance) || 0
        ];
        
        console.log(`📅 إضافة الصف ${index + 1}:`, rowData);
        const dataRow = worksheet.addRow(rowData);
        dataRow.height = 30;
        
        // تنسيق خاص للصفوف
        dataRow.eachCell((cell, colNumber) => {
          // تنسيق عام
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
          
          // تنسيق الأرقام والألوان
          if (colNumber === 1) {
            // عمود التاريخ
            cell.font = { bold: true, color: { argb: 'FF1F2937' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
          } else if (colNumber >= 2 && colNumber <= 11) {
            // الأعمدة الرقمية
            cell.numFmt = '#,##0.00';
            
            // ألوان مختلفة للأعمدة
            if (colNumber <= 3) {
              // الرصيد المرحل والحوالات
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
            } else if (colNumber >= 4 && colNumber <= 8) {
              // المصروفات
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
            } else if (colNumber === 9) {
              // الإيرادات
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
              cell.font = { bold: true, color: { argb: 'FF059669' } };
            } else if (colNumber === 10) {
              // المصروفات
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
              cell.font = { bold: true, color: { argb: 'FFDC2626' } };
            } else if (colNumber === 11) {
              // الرصيد المتبقي
              const balance = Number(rowData[10]) || 0;
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: balance >= 0 ? { argb: 'FFDBEAFE' } : { argb: 'FFFECACA' } };
              cell.font = { bold: true, color: balance >= 0 ? { argb: 'FF1D4ED8' } : { argb: 'FFDC2626' } };
            }
          }
        });
        

      });
      
      // إضافة صف الإجماليات مع تنسيق احترافي
      console.log('📊 إضافة صف الإجماليات');
      const totalsRowData = [
        'الإجمــــالي',
        '-',
        totalFundTransfers,
        totalWorkerWages,
        totalMaterialCosts,
        totalTransportationCosts,
        totalWorkerTransfers,
        totalWorkerMiscExpenses,
        totalIncome,
        totalExpenses,
        finalBalance
      ];
      
      const totalsRow = worksheet.addRow(totalsRowData);
      totalsRow.height = 40;
      
      // تنسيق صف الإجماليات
      totalsRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        cell.border = {
          top: { style: 'thick', color: { argb: 'FF374151' } },
          left: { style: 'thick', color: { argb: 'FF374151' } },
          bottom: { style: 'thick', color: { argb: 'FF374151' } },
          right: { style: 'thick', color: { argb: 'FF374151' } }
        };
        
        // تنسيق أرقام الإجماليات
        if (colNumber >= 3 && colNumber <= 11) {
          cell.numFmt = '#,##0.00';
          
          // ألوان مميزة للإجماليات
          if (colNumber === 9) { // إجمالي الإيرادات
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
          } else if (colNumber === 10) { // إجمالي المصروفات  
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
          } else if (colNumber === 11) { // الرصيد النهائي
            const balance = Number(finalBalance) || 0;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: balance >= 0 ? { argb: 'FF1D4ED8' } : { argb: 'FFDC2626' } };
            cell.font = { ...cell.font, size: 14 };
          }
        }
      });

      
      // تحديد عرض الأعمدة ليظهر النص بوضوح مع عرض محسن
      worksheet.columns = [
        { width: 18 }, // التاريخ
        { width: 16 }, // الرصيد المرحل
        { width: 18 }, // الحوالات المالية
        { width: 16 }, // أجور العمال
        { width: 16 }, // شراء المواد
        { width: 18 }, // أجور المواصلات
        { width: 16 }, // حوالات العمال
        { width: 16 }, // نثريات العمال
        { width: 18 }, // إجمالي الإيرادات
        { width: 18 }, // إجمالي المصروفات
        { width: 18 }  // الرصيد المتبقي
      ];
      
      // إعداد الطباعة لصفحة A4
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5, right: 0.5, top: 0.75, bottom: 0.75,
          header: 0.3, footer: 0.3
        }
      };
      
      // إضافة تذييل احترافي
      const footerRowNumber = worksheet.lastRow.number + 2;
      worksheet.mergeCells(`A${footerRowNumber}:K${footerRowNumber}`);
      const footerCell = worksheet.getCell(`A${footerRowNumber}`);
      footerCell.value = `تم إنشاء هذا التقرير من نظام إدارة مشاريع البناء | ${new Date().toLocaleString('ar-SA')} | شركة الحاج عبدالرحمن علي الجهني وأولاده`;
      footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      footerCell.font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
      footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      
      console.log('💾 حفظ ملف Excel');
      
      // كتابة الملف وتحميله
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `كشف-المصروفات-${selectedProject?.name}-${formatDate(dateFrom)}-${formatDate(dateTo)}.xlsx`;
      saveAs(blob, fileName);
      
      console.log('✅ تم تصدير Excel بنجاح');
      
      toast({
        title: "تم بنجاح",
        description: `تم تصدير كشف المصروفات إلى Excel`,
      });

    } catch (error) {
      console.error('❌ خطأ في تصدير Excel:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تصدير الملف",
        variant: "destructive",
      });
    }
  }, [reportData, selectedProject, dateFrom, dateTo, toast]);

  const printReport = useCallback(() => {
    // التأكد من وجود البيانات
    if (!reportData.length) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للطباعة",
        variant: "destructive",
      });
      return;
    }

    try {
      // التقاط HTML للتقرير
      const reportElement = document.querySelector('.print-preview');
      if (reportElement) {
        const htmlContent = reportElement.innerHTML;
        
        // حفظ HTML في localStorage لنقله لصفحة إعدادات الطباعة
        const reportContext = {
          type: 'daily_expenses',
          title: `كشف المصروفات اليومية - ${formatDate(dateFrom)}`,
          html: htmlContent,
          data: {
            projectName: selectedProject?.name,
            dateFrom,
            dateTo,
            reportData: reportData.length,
            totalIncome: reportData.reduce((sum, day) => sum + day.summary.totalIncome, 0),
            totalExpenses: reportData.reduce((sum, day) => sum + day.summary.totalExpenses, 0)
          }
        };
        
        localStorage.setItem('reportContext', JSON.stringify(reportContext));
        console.log('✅ تم التقاط HTML من:', 'print-preview');
        console.log('💾 تم حفظ سياق التقرير مع HTML:', {
          title: reportContext.title,
          htmlLength: htmlContent.length
        });
      }
      
      // التأكد من تحميل ملف CSS للطباعة
      const printStylesheet = document.querySelector('link[href*="daily-expenses-print.css"]');
      if (!printStylesheet) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/src/styles/daily-expenses-print.css';
        document.head.appendChild(link);
      }
      
      // إضافة عنوان للنافذة
      const originalTitle = document.title;
      document.title = `كشف المصروفات اليومية - ${selectedProject?.name} - ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
      
      // تنفيذ الطباعة
      setTimeout(() => {
        window.print();
        
        // استعادة العنوان الأصلي
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }, 500); // زيادة الوقت لضمان تحميل CSS
    } catch (error) {
      console.error("Error preparing print:", error);
      toast({
        title: "خطأ في الطباعة",
        description: "حدث خطأ أثناء تحضير التقرير للطباعة",
        variant: "destructive",
      });
    }
  }, [selectedProject, dateFrom, dateTo, reportData, toast]);

  const calculateTotals = () => {
    if (!reportData.length) return null;

    return reportData.reduce((totals, day) => ({
      totalIncome: totals.totalIncome + day.summary.totalIncome,
      totalExpenses: totals.totalExpenses + day.summary.totalExpenses,
      totalFundTransfers: totals.totalFundTransfers + day.summary.totalFundTransfers,
      totalWorkerWages: totals.totalWorkerWages + day.summary.totalWorkerWages,
      totalMaterialCosts: totals.totalMaterialCosts + day.summary.totalMaterialCosts,
      totalTransportationCosts: totals.totalTransportationCosts + day.summary.totalTransportationCosts,
      totalWorkerTransfers: totals.totalWorkerTransfers + day.summary.totalWorkerTransfers,
      totalWorkerMiscExpenses: totals.totalWorkerMiscExpenses + (day.summary.totalWorkerMiscExpenses || 0),
    }), {
      totalIncome: 0,
      totalExpenses: 0,
      totalFundTransfers: 0,
      totalWorkerWages: 0,
      totalMaterialCosts: 0,
      totalTransportationCosts: 0,
      totalWorkerTransfers: 0,
      totalWorkerMiscExpenses: 0,
    });
  };

  const totals = calculateTotals();
  const finalBalance = reportData.length > 0 ? reportData[reportData.length - 1].summary.remainingBalance : 0;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">كشف المصروفات اليومية المحسن</h1>
            <p className="text-sm text-muted-foreground">تقرير شامل لجميع المصروفات والإيرادات</p>
          </div>
        </div>
        
        {reportData.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              {reportData.length} يوم
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
              <Eye className="h-3 w-3 mr-1" />
              جاهز للطباعة
            </Badge>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card className="mb-6 no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            إعدادات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">اختيار المشروع</Label>
            <ProjectSelector onProjectChange={selectProject} />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-sm font-medium mb-2 block">
                من تاريخ
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="arabic-numbers"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-sm font-medium mb-2 block">
                إلى تاريخ
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="arabic-numbers"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">إظهار التفاصيل في التصدير</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={generateReport} 
              disabled={isLoading || !selectedProjectId}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Calendar className="h-4 w-4" />
              {isLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
            
            {reportData.length > 0 && (
              <>
                <Button 
                  onClick={exportToExcel} 
                  variant="outline"
                  className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                  size="lg"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير Excel احترافي
                </Button>
                
                <Button 
                  onClick={printReport} 
                  variant="outline"
                  className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  size="lg"
                >
                  <Printer className="h-4 w-4" />
                  طباعة محسنة
                </Button>
                
                <Button 
                  onClick={() => window.location.href = "/print-control"}
                  variant="outline"
                  className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                  size="lg"
                >
                  <Settings className="h-4 w-4" />
                  إعدادات الطباعة
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData.length > 0 && (
        <div className="print-preview">
          {/* Report Header */}
          <div className="report-header bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">كشف المصروفات اليومية التفصيلي</h2>
              <div className="text-lg text-blue-700 dark:text-blue-300 font-medium">
                مشروع: <span className="font-bold">{selectedProject?.name}</span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                الفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-500 mt-2">
                تم إنشاؤه في {formatDate(getCurrentDate())} - نظام إدارة مشاريع البناء
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 no-print">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(totals?.totalIncome || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(totals?.totalExpenses || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">الرصيد النهائي</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(finalBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الأيام</p>
                    <p className="text-lg font-bold text-purple-600">
                      {reportData.length} يوم
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Reports Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="report-table w-full bg-white dark:bg-gray-800">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-4 py-3 text-center font-semibold">التاريخ</th>
                  <th className="px-4 py-3 text-center font-semibold">الرصيد المرحل</th>
                  <th className="px-4 py-3 text-center font-semibold text-green-100">الحوالات المالية</th>
                  <th className="px-4 py-3 text-center font-semibold text-orange-100">أجور العمال</th>
                  <th className="px-4 py-3 text-center font-semibold text-orange-100">شراء المواد</th>
                  <th className="px-4 py-3 text-center font-semibold text-orange-100">أجور المواصلات</th>
                  <th className="px-4 py-3 text-center font-semibold text-orange-100">حوالات العمال</th>
                  <th className="px-4 py-3 text-center font-semibold text-purple-100">نثريات العمال</th>
                  <th className="px-4 py-3 text-center font-semibold text-green-100">إجمالي الإيرادات</th>
                  <th className="px-4 py-3 text-center font-semibold text-red-100">إجمالي المصروفات</th>
                  <th className="px-4 py-3 text-center font-semibold text-blue-100">الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((day, index) => (
                  <tr 
                    key={day.date} 
                    className={`
                      ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/30" : "bg-white dark:bg-gray-800"} 
                      hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200
                    `}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 date-cell text-center border-b border-gray-200 dark:border-gray-700">
                      {formatDate(day.date)}
                    </td>
                    <td className="px-4 py-3 currency text-gray-700 dark:text-gray-300 text-center border-b border-gray-200 dark:border-gray-700">
                      {formatCurrency(day.summary.carriedForward)}
                    </td>
                    <td className="px-4 py-3 currency text-green-700 dark:text-green-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                      {formatCurrency(day.summary.totalFundTransfers)}
                    </td>
                    <td className="px-4 py-3 currency text-orange-700 dark:text-orange-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                      {formatCurrency(day.summary.totalWorkerWages)}
                    </td>
                    <td className="px-4 py-3 currency text-orange-700 dark:text-orange-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                      {formatCurrency(day.summary.totalMaterialCosts)}
                    </td>
                    <td className="px-4 py-3 currency text-orange-700 dark:text-orange-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                      {formatCurrency(day.summary.totalTransportationCosts)}
                    </td>
                    <td className="px-4 py-3 currency text-orange-700 dark:text-orange-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                      {formatCurrency(day.summary.totalWorkerTransfers)}
                    </td>
                    <td className="px-4 py-3 currency text-purple-700 dark:text-purple-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                      {formatCurrency(day.summary.totalWorkerMiscExpenses || 0)}
                    </td>
                    <td className="px-4 py-3 currency font-bold text-green-800 dark:text-green-300 text-center border-b border-gray-200 dark:border-gray-700 bg-green-100 dark:bg-green-900/30">
                      {formatCurrency(day.summary.totalIncome)}
                    </td>
                    <td className="px-4 py-3 currency font-bold text-red-800 dark:text-red-300 text-center border-b border-gray-200 dark:border-gray-700 bg-red-100 dark:bg-red-900/30">
                      {formatCurrency(day.summary.totalExpenses)}
                    </td>
                    <td className={`
                      px-4 py-3 currency font-bold text-center border-b border-gray-200 dark:border-gray-700
                      ${day.summary.remainingBalance >= 0 
                        ? 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30' 
                        : 'text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30'
                      }
                    `}>
                      {formatCurrency(day.summary.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg">
                  <td className="px-4 py-4 text-center font-bold border-t-2 border-blue-500">الإجمالي</td>
                  <td className="px-4 py-4 text-center border-t-2 border-blue-500">-</td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-green-200">
                    {formatCurrency(totals?.totalFundTransfers || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-orange-200">
                    {formatCurrency(totals?.totalWorkerWages || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-orange-200">
                    {formatCurrency(totals?.totalMaterialCosts || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-orange-200">
                    {formatCurrency(totals?.totalTransportationCosts || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-orange-200">
                    {formatCurrency(totals?.totalWorkerTransfers || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-purple-200">
                    {formatCurrency(totals?.totalWorkerMiscExpenses || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-green-200 font-extrabold">
                    {formatCurrency(totals?.totalIncome || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-red-200 font-extrabold">
                    {formatCurrency(totals?.totalExpenses || 0)}
                  </td>
                  <td className={`
                    px-4 py-4 currency text-center border-t-2 border-blue-500 font-extrabold text-xl
                    ${finalBalance >= 0 ? 'text-yellow-200' : 'text-red-200'}
                  `}>
                    {formatCurrency(finalBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Report Footer */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-t-4 border-blue-500">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  تم إنشاء هذا التقرير بنجاح في {formatDate(getCurrentDate())}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                نظام إدارة مشاريع البناء الاحترافي - مشروع: {selectedProject?.name}
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                <span>✅ بيانات حقيقية من النظام</span>
                <span>📊 تقرير تفاعلي</span>
                <span>🖨️ جاهز للطباعة</span>
                <span>📈 تصدير Excel احترافي</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {reportData.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد بيانات</h3>
            <p className="text-gray-600">
              يرجى اختيار مشروع وتحديد الفترة الزمنية ثم الضغط على "إنشاء التقرير"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}