import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Printer, Download, Building2, User, Calendar, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: string;
  projectId: string;
}

interface Project {
  id: string;
  name: string;
}

interface WorkerAttendance {
  id: string;
  date: string;
  present: boolean;
  hourlyWage: number;
  hoursWorked: number;
  totalWage: number;
  notes?: string;
}

interface WorkerTransfer {
  id: string;
  amount: number;
  transferDate: string;
  recipientName: string;
  notes?: string;
  type: 'advance' | 'salary' | 'deduction';
}

interface WorkerBalance {
  totalEarned: number;
  totalTransfers: number;
  currentBalance: number;
  previousBalance: number;
}

interface WorkerStatement {
  worker: Worker;
  project: Project;
  attendance: WorkerAttendance[];
  transfers: WorkerTransfer[];
  balance: WorkerBalance;
  periodSummary: {
    totalDaysWorked: number;
    totalHoursWorked: number;
    totalEarnings: number;
    totalAdvances: number;
    netBalance: number;
  };
}

export default function ProfessionalWorkerStatement() {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return format(date, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [showReport, setShowReport] = useState(false);

  // Fetch workers
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ['/api/workers'],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch worker statement data
  const { data: workerStatement, isLoading: isLoadingStatement } = useQuery<WorkerStatement | null>({
    queryKey: ['/api/workers', selectedWorkerId, 'professional-statement', selectedProjectId, dateFrom, dateTo],
    queryFn: async (): Promise<WorkerStatement | null> => {
      if (!selectedWorkerId || !selectedProjectId) return null;
      
      const params = new URLSearchParams();
      params.append('projectId', selectedProjectId);
      params.append('dateFrom', dateFrom);
      params.append('dateTo', dateTo);
      
      const response = await fetch(`/api/workers/${selectedWorkerId}/account-statement?${params}`);
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات كشف الحساب');
      }
      
      const data = await response.json();
      const worker = workers.find(w => w.id === selectedWorkerId);
      const project = projects.find(p => p.id === selectedProjectId);
      
      if (!worker || !project) {
        throw new Error('بيانات العامل أو المشروع غير موجودة');
      }

      // حساب ملخص الفترة
      const totalDaysWorked = data.attendance?.filter((a: WorkerAttendance) => a.present).length || 0;
      const totalHoursWorked = data.attendance?.reduce((sum: number, a: WorkerAttendance) => 
        sum + (a.present ? a.hoursWorked || 8 : 0), 0) || 0;
      const totalEarnings = data.attendance?.reduce((sum: number, a: WorkerAttendance) => 
        sum + (a.present ? a.totalWage || 0 : 0), 0) || 0;
      const totalAdvances = data.transfers?.reduce((sum: number, t: WorkerTransfer) => 
        sum + (t.type === 'advance' ? t.amount : 0), 0) || 0;

      return {
        worker,
        project,
        attendance: data.attendance || [],
        transfers: data.transfers || [],
        balance: data.balance || { 
          totalEarned: totalEarnings, 
          totalTransfers: totalAdvances, 
          currentBalance: totalEarnings - totalAdvances,
          previousBalance: 0 
        },
        periodSummary: {
          totalDaysWorked,
          totalHoursWorked,
          totalEarnings,
          totalAdvances,
          netBalance: totalEarnings - totalAdvances
        }
      };
    },
    enabled: !!selectedWorkerId && !!selectedProjectId && !!dateFrom && !!dateTo && showReport,
  });

  const generateReport = () => {
    if (!selectedWorkerId || !selectedProjectId) {
      alert('يرجى اختيار العامل والمشروع');
      return;
    }
    setShowReport(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('professional-statement-print');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>كشف حساب العامل - ${workerStatement?.worker.name}</title>
          <style>
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              font-family: 'Arial', sans-serif;
              direction: rtl;
              margin: 0;
              padding: 0;
              font-size: 10px;
              line-height: 1.2;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #1e40af;
              padding-bottom: 6px;
              margin-bottom: 12px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 2px;
            }
            .document-title {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #374151;
            }
            .period-info {
              font-size: 9px;
              color: #6b7280;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }
            .info-section {
              border: 1px solid #d1d5db;
              padding: 6px;
              border-radius: 3px;
              background-color: #f9fafb;
            }
            .info-title {
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 4px;
              font-size: 10px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 2px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 9px;
            }
            .info-label {
              color: #6b7280;
            }
            .info-value {
              font-weight: bold;
              color: #374151;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
              font-size: 8px;
            }
            .data-table th,
            .data-table td {
              border: 1px solid #d1d5db;
              padding: 2px 4px;
              text-align: center;
            }
            .data-table th {
              background-color: #f3f4f6;
              font-weight: bold;
              font-size: 8px;
              color: #1e40af;
            }
            .data-table td {
              font-size: 8px;
            }
            .summary-section {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border: 2px solid #1e40af;
              padding: 8px;
              border-radius: 5px;
              margin-top: 8px;
            }
            .summary-title {
              font-size: 11px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 6px;
              text-align: center;
              border-bottom: 1px solid #1e40af;
              padding-bottom: 2px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
            }
            .summary-item {
              text-align: center;
              background-color: white;
              padding: 4px;
              border-radius: 3px;
              border: 1px solid #e5e7eb;
            }
            .summary-label {
              font-size: 8px;
              color: #6b7280;
              margin-bottom: 1px;
            }
            .summary-value {
              font-size: 10px;
              font-weight: bold;
            }
            .footer {
              margin-top: 10px;
              text-align: center;
              font-size: 7px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 4px;
            }
            .currency {
              font-weight: bold;
            }
            .positive { color: #059669; }
            .negative { color: #dc2626; }
            .section-title {
              font-size: 9px;
              font-weight: bold;
              margin: 8px 0 4px 0;
              color: #1e40af;
              background-color: #f0f9ff;
              padding: 2px 6px;
              border-right: 3px solid #1e40af;
            }
            .present { color: #059669; }
            .absent { color: #dc2626; }
            .working-hours {
              font-weight: bold;
              color: #1e40af;
            }
            .row-alternate:nth-child(even) {
              background-color: #f9fafb;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">كشف حساب العامل الاحترافي</h1>
          <p className="text-muted-foreground">
            كشف حساب شامل ومفصل للعامل في صفحة A4 واحدة
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            إعدادات الكشف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="worker">العامل</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العامل" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name} - {worker.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project">المشروع</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              إنشاء الكشف
            </Button>
            
            {workerStatement && (
              <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Statement Display */}
      {isLoadingStatement && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">جاري تحميل البيانات...</div>
          </CardContent>
        </Card>
      )}

      {workerStatement && (
        <div id="professional-statement-print" className="bg-white">
          {/* Header */}
          <div className="header">
            <div className="company-name">شركة المقاولات الحديثة</div>
            <div className="document-title">كشف حساب العامل الشامل</div>
            <div className="period-info">
              الفترة من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
            </div>
          </div>

          {/* Worker and Project Info */}
          <div className="info-grid">
            <div className="info-section">
              <div className="info-title">معلومات العامل</div>
              <div className="info-item">
                <span className="info-label">الاسم:</span>
                <span className="info-value">{workerStatement.worker.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">النوع:</span>
                <span className="info-value">{workerStatement.worker.type}</span>
              </div>
              <div className="info-item">
                <span className="info-label">الأجر اليومي:</span>
                <span className="info-value currency">{formatCurrency(Number(workerStatement.worker.dailyWage))} ريال</span>
              </div>
            </div>

            <div className="info-section">
              <div className="info-title">معلومات المشروع</div>
              <div className="info-item">
                <span className="info-label">اسم المشروع:</span>
                <span className="info-value">{workerStatement.project.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">تاريخ الكشف:</span>
                <span className="info-value">{formatDate(new Date().toISOString())}</span>
              </div>
              <div className="info-item">
                <span className="info-label">أيام العمل:</span>
                <span className="info-value working-hours">{workerStatement.periodSummary.totalDaysWorked} يوم</span>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          {workerStatement.attendance.length > 0 && (
            <>
              <div className="section-title">📋 سجل الحضور والأجور التفصيلي</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>اليوم</th>
                    <th>الحضور</th>
                    <th>ساعات العمل</th>
                    <th>أجر الساعة</th>
                    <th>إجمالي الأجر</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {workerStatement.attendance.slice(0, 12).map((record, index) => {
                    const recordDate = new Date(record.date);
                    const dayName = recordDate.toLocaleDateString('ar-SA', { weekday: 'long' });
                    
                    return (
                      <tr key={record.id} className={`row-alternate ${index % 2 === 0 ? 'even' : 'odd'}`}>
                        <td>{formatDate(record.date)}</td>
                        <td>{dayName}</td>
                        <td className={record.present ? 'present' : 'absent'}>
                          {record.present ? '✓ حضر' : '✗ غاب'}
                        </td>
                        <td className="working-hours">
                          {record.present ? (record.hoursWorked || 8) : 0} ساعة
                        </td>
                        <td>{record.present ? formatCurrency(record.hourlyWage || 0) : '-'}</td>
                        <td className="currency positive">
                          {record.present ? formatCurrency(record.totalWage || 0) : '0'} ريال
                        </td>
                        <td style={{ fontSize: '7px' }}>{record.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {workerStatement.attendance.length > 12 && (
                <div style={{ fontSize: '8px', textAlign: 'center', color: '#6b7280', marginTop: '3px' }}>
                  عرض أول 12 سجل فقط من أصل {workerStatement.attendance.length} سجل
                </div>
              )}
            </>
          )}

          {/* Transfers Table */}
          {workerStatement.transfers.length > 0 && (
            <>
              <div className="section-title">💰 السلف والتحويلات المالية</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>اليوم</th>
                    <th>نوع العملية</th>
                    <th>المبلغ</th>
                    <th>المستلم</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {workerStatement.transfers.slice(0, 8).map((transfer, index) => {
                    const transferDate = new Date(transfer.transferDate);
                    const dayName = transferDate.toLocaleDateString('ar-SA', { weekday: 'long' });
                    
                    return (
                      <tr key={transfer.id} className={`row-alternate ${index % 2 === 0 ? 'even' : 'odd'}`}>
                        <td>{formatDate(transfer.transferDate)}</td>
                        <td>{dayName}</td>
                        <td>
                          {transfer.type === 'advance' && '🔸 سلفة'}
                          {transfer.type === 'salary' && '💵 راتب'}
                          {transfer.type === 'deduction' && '📉 خصم'}
                        </td>
                        <td className={`currency ${transfer.type === 'deduction' ? 'negative' : 'positive'}`}>
                          {formatCurrency(transfer.amount)} ريال
                        </td>
                        <td>{transfer.recipientName}</td>
                        <td style={{ fontSize: '7px' }}>{transfer.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {workerStatement.transfers.length > 8 && (
                <div style={{ fontSize: '8px', textAlign: 'center', color: '#6b7280', marginTop: '3px' }}>
                  عرض أول 8 عمليات فقط من أصل {workerStatement.transfers.length} عملية
                </div>
              )}
            </>
          )}

          {/* Summary Section */}
          <div className="summary-section">
            <div className="summary-title">📊 الملخص المالي الشامل للفترة</div>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">💼 إجمالي الأجور المستحقة</div>
                <div className="summary-value positive">{formatCurrency(workerStatement.periodSummary.totalEarnings)} ريال</div>
                <div style={{ fontSize: '7px', color: '#6b7280' }}>
                  ({workerStatement.periodSummary.totalDaysWorked} أيام عمل)
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">💸 إجمالي السلف والخصومات</div>
                <div className="summary-value negative">{formatCurrency(workerStatement.periodSummary.totalAdvances)} ريال</div>
                <div style={{ fontSize: '7px', color: '#6b7280' }}>
                  ({workerStatement.transfers.length} عملية)
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">🏦 الرصيد الصافي المستحق</div>
                <div className={`summary-value ${workerStatement.periodSummary.netBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(workerStatement.periodSummary.netBalance)} ريال
                </div>
                <div style={{ fontSize: '7px', color: '#6b7280' }}>
                  {workerStatement.periodSummary.netBalance >= 0 ? 'للعامل' : 'على العامل'}
                </div>
              </div>
            </div>
            
            {/* Additional Statistics */}
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '6px', 
              borderTop: '1px solid #e5e7eb',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              fontSize: '8px',
              textAlign: 'center'
            }}>
              <div>
                <strong>متوسط الأجر اليومي:</strong><br/>
                {workerStatement.periodSummary.totalDaysWorked > 0 
                  ? formatCurrency(workerStatement.periodSummary.totalEarnings / workerStatement.periodSummary.totalDaysWorked)
                  : '0'} ريال
              </div>
              <div>
                <strong>إجمالي ساعات العمل:</strong><br/>
                {workerStatement.periodSummary.totalHoursWorked} ساعة
              </div>
              <div>
                <strong>متوسط الساعات اليومية:</strong><br/>
                {workerStatement.periodSummary.totalDaysWorked > 0 
                  ? (workerStatement.periodSummary.totalHoursWorked / workerStatement.periodSummary.totalDaysWorked).toFixed(1)
                  : '0'} ساعة
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div>📋 تم إنشاء هذا الكشف آلياً من نظام إدارة مشاريع البناء المتطور</div>
            <div>🕐 تاريخ الإنشاء: {formatDate(new Date().toISOString())} | ✅ جميع البيانات حقيقية ومأخوذة من قاعدة البيانات الأساسية</div>
            <div>📞 للاستفسار: 0533366543 | 🏢 إدارة المشاريع والحسابات</div>
          </div>
        </div>
      )}
    </div>
  );
}