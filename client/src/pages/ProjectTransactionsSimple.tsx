import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, TrendingUp, TrendingDown, Building2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'deferred' | 'transfer_from_project';
  category: string;
  amount: number;
  description: string;
}

export default function ProjectTransactionsSimple() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // جلب المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // جلب تحويلات العهدة العادية للمشروع
  const { data: fundTransfers = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'fund-transfers'],
    enabled: !!selectedProject,
  });

  // جلب التحويلات بين المشاريع (الواردة)
  const { data: incomingProjectTransfers = [] } = useQuery({
    queryKey: ['/api/project-fund-transfers', selectedProject, 'incoming'],
    queryFn: async () => {
      const response = await fetch(`/api/project-fund-transfers?toProjectId=${selectedProject}`);
      return response.json();
    },
    enabled: !!selectedProject,
  });

  // جلب التحويلات بين المشاريع (الصادرة)
  const { data: outgoingProjectTransfers = [] } = useQuery({
    queryKey: ['/api/project-fund-transfers', selectedProject, 'outgoing'],
    queryFn: async () => {
      const response = await fetch(`/api/project-fund-transfers?fromProjectId=${selectedProject}`);
      return response.json();
    },
    enabled: !!selectedProject,
  });

  // جلب حضور العمال للمشروع
  const { data: workerAttendance = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'attendance'],
    enabled: !!selectedProject,
  });

  // جلب مشتريات المواد للمشروع
  const { data: materialPurchases = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'material-purchases'],
    enabled: !!selectedProject,
  });

  // جلب مصروفات النقل للمشروع
  const { data: transportExpenses = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'transportation-expenses'],
    enabled: !!selectedProject,
  });

  // جلب المصروفات المتنوعة للمشروع
  const { data: miscExpenses = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'worker-misc-expenses'],
    enabled: !!selectedProject,
  });

  // جلب حوالات العمال للمشروع
  const { data: workerTransfers = [] } = useQuery({
    queryKey: ['/api/worker-transfers', selectedProject],
    queryFn: async () => {
      const response = await fetch(`/api/worker-transfers?projectId=${selectedProject}`);
      return response.json();
    },
    enabled: !!selectedProject,
  });

  // جلب بيانات العمال لعرض أسمائهم
  const { data: workers = [] } = useQuery({
    queryKey: ['/api/workers'],
  });

  // تحويل البيانات إلى قائمة معاملات موحدة
  const transactions = useMemo(() => {
    const allTransactions: Transaction[] = [];
    
    // تشخيص البيانات للمساعدة في حل المشكلة
    const fundTransfersArray = Array.isArray(fundTransfers) ? fundTransfers : [];
    const incomingProjectTransfersArray = Array.isArray(incomingProjectTransfers) ? incomingProjectTransfers : [];
    const outgoingProjectTransfersArray = Array.isArray(outgoingProjectTransfers) ? outgoingProjectTransfers : [];
    const workerAttendanceArray = Array.isArray(workerAttendance) ? workerAttendance : [];
    const materialPurchasesArray = Array.isArray(materialPurchases) ? materialPurchases : [];
    const transportExpensesArray = Array.isArray(transportExpenses) ? transportExpenses : [];
    const miscExpensesArray = Array.isArray(miscExpenses) ? miscExpenses : [];
    const workerTransfersArray = Array.isArray(workerTransfers) ? workerTransfers : [];
    const workersArray = Array.isArray(workers) ? workers : [];
    
    console.log(`🎯 بدء معالجة البيانات للمشروع ${selectedProject}`);
    console.log('📊 البيانات المتاحة:', {
      fundTransfers: fundTransfersArray?.length || 0,
      incomingProjectTransfers: incomingProjectTransfersArray?.length || 0,
      outgoingProjectTransfers: outgoingProjectTransfersArray?.length || 0,
      workerAttendance: workerAttendanceArray?.length || 0,
      materialPurchases: materialPurchasesArray?.length || 0,
      transportExpenses: transportExpensesArray?.length || 0,
      miscExpenses: miscExpensesArray?.length || 0
    });

    // حساب إجمالي العمليات المتاحة
    const totalOperations = fundTransfersArray.length + incomingProjectTransfersArray.length + 
                           outgoingProjectTransfersArray.length + workerAttendanceArray.length + 
                           materialPurchasesArray.length + transportExpensesArray.length + 
                           miscExpensesArray.length;

    // إضافة تحويلات العهدة العادية (دخل)
    fundTransfersArray.forEach((transfer: any) => {
      const date = transfer.transferDate || transfer.date;
      const amount = parseFloat(transfer.amount);
      
      if (date && !isNaN(amount) && amount > 0) {
        allTransactions.push({
          id: `fund-${transfer.id}`,
          date: date,
          type: 'income',
          category: 'تحويل عهدة',
          amount: amount,
          description: `من: ${transfer.senderName || 'غير محدد'}`
        });
      }
    });

    // إضافة التحويلات الواردة من مشاريع أخرى (دخل)
    incomingProjectTransfersArray.forEach((transfer: any) => {
      const date = transfer.transferDate || transfer.date;
      const amount = parseFloat(transfer.amount);
      
      if (date && !isNaN(amount) && amount > 0) {
        allTransactions.push({
          id: `project-in-${transfer.id}`,
          date: date,
          type: 'transfer_from_project',
          category: 'تحويل من مشروع آخر',
          amount: amount,
          description: `من: ${transfer.fromProjectName || 'مشروع آخر'}`
        });
      }
    });

    // إضافة التحويلات الصادرة إلى مشاريع أخرى (مصروف)
    outgoingProjectTransfersArray.forEach((transfer: any) => {
      const date = transfer.transferDate || transfer.date;
      const amount = parseFloat(transfer.amount);
      
      if (date && !isNaN(amount) && amount > 0) {
        allTransactions.push({
          id: `project-out-${transfer.id}`,
          date: date,
          type: 'expense',
          category: 'تحويل إلى مشروع آخر',
          amount: amount,
          description: `إلى: ${transfer.toProjectName || 'مشروع آخر'}`
        });
      }
    });

    // إضافة أجور العمال (مصروف)
    console.log('🔍 معالجة أجور العمال - العدد:', workerAttendanceArray.length);
    if (workerAttendanceArray.length > 0) {
      console.log('🔍 أول عنصر من بيانات أجور العمال:', JSON.stringify(workerAttendanceArray[0], null, 2));
    }
    
    workerAttendanceArray.forEach((attendance: any, index: number) => {
      console.log(`🔍 معالجة العامل رقم ${index + 1}:`, attendance);
      
      const date = attendance.date || attendance.attendanceDate || attendance.created_at;
      console.log('📅 التاريخ المستخرج:', date);
      
      // فحص جميع الحقول الموجودة في الكائن
      console.log('🔍 جميع الحقول المتاحة:', Object.keys(attendance));
      
      // حساب المبلغ المدفوع فعلياً فقط (وليس الأجر الكامل)
      let amount = 0;
      
      // استخدام المبلغ المدفوع فعلياً (يشمل 0 إذا لم يُدفع شيء)
      if (attendance.paidAmount !== undefined && attendance.paidAmount !== null && attendance.paidAmount !== '') {
        const paidAmount = parseFloat(attendance.paidAmount);
        if (!isNaN(paidAmount)) {
          amount = Math.max(0, paidAmount); // تأكد من عدم وجود قيم سالبة
          console.log(`💰 المبلغ المدفوع فعلياً:`, amount);
        }
      }


      console.log('✅ النتيجة النهائية:', { 
        date, 
        amount, 
        hasDate: !!date, 
        hasAmount: amount >= 0, 
        willAdd: !!date 
      });
      
      // إظهار جميع سجلات الحضور حتى لو كان المبلغ المدفوع 0
      if (date) {
        // البحث عن العامل باستخدام workerId
        const worker = workersArray.find((w: any) => w.id === attendance.workerId);
        const workerName = worker?.name || attendance.workerName || attendance.worker?.name || attendance.name || 'غير محدد';
        const workDays = attendance.workDays ? ` (${attendance.workDays} يوم)` : '';
        const dailyWage = attendance.dailyWage ? ` - أجر يومي: ${formatCurrency(parseFloat(attendance.dailyWage))}` : '';
        
        // إضافة توضيح إذا كان المبلغ المدفوع 0
        const paymentStatus = amount === 0 ? ' (لم يُدفع)' : '';
        
        const newTransaction = {
          id: `wage-${attendance.id}`,
          date: date,
          type: 'expense' as const,
          category: 'أجور العمال',
          amount: amount,
          description: `${workerName}${workDays}${dailyWage}${paymentStatus}`
        };
        
        console.log('✅ إضافة معاملة أجور العمال:', newTransaction);
        allTransactions.push(newTransaction);
      } else {
        console.log(`❌ تم تخطي العامل ${attendance.workerName || attendance.name || 'غير معروف'} - السبب: التاريخ مفقود`, {
          missingDate: !date,
          originalData: attendance
        });
      }
    });

    // إضافة مشتريات المواد (مصروف أو آجل)
    materialPurchasesArray.forEach((purchase: any) => {
      const date = purchase.purchaseDate || purchase.date;
      let amount = 0;
      
      if (purchase.totalAmount && !isNaN(parseFloat(purchase.totalAmount))) {
        amount = parseFloat(purchase.totalAmount);
      } else if (purchase.amount && !isNaN(parseFloat(purchase.amount))) {
        amount = parseFloat(purchase.amount);
      } else if (purchase.cost && !isNaN(parseFloat(purchase.cost))) {
        amount = parseFloat(purchase.cost);
      }

      if (date && amount > 0) {
        // تحديد نوع المشترية - المشتريات النقدية فقط تُحسب كمصروفات
        const isDeferred = purchase.purchaseType === 'آجل' || purchase.paymentType === 'deferred' || purchase.isDeferred || purchase.deferred;
        
        allTransactions.push({
          id: `material-${purchase.id}`,
          date: date,
          type: isDeferred ? 'deferred' : 'expense',
          category: isDeferred ? 'مشتريات آجلة' : 'مشتريات المواد',
          amount: amount,
          description: `مادة: ${purchase.materialName || purchase.material?.name || purchase.name || 'غير محدد'}${isDeferred ? ' (آجل)' : ''}`
        });
      }
    });

    // إضافة مصروفات النقل (مصروف)
    transportExpensesArray.forEach((expense: any) => {
      const date = expense.date;
      const amount = parseFloat(expense.amount);

      if (date && !isNaN(amount) && amount > 0) {
        allTransactions.push({
          id: `transport-${expense.id}`,
          date: date,
          type: 'expense',
          category: 'مصروفات النقل',
          amount: amount,
          description: `نقل: ${expense.description || 'غير محدد'}`
        });
      }
    });

    // إضافة المصروفات المتنوعة (مصروف)
    miscExpensesArray.forEach((expense: any) => {
      const date = expense.date;
      const amount = parseFloat(expense.amount);

      if (date && !isNaN(amount) && amount > 0) {
        allTransactions.push({
          id: `misc-${expense.id}`,
          date: date,
          type: 'expense',
          category: 'مصروفات متنوعة',
          amount: amount,
          description: `متنوع: ${expense.description || expense.workerName || 'غير محدد'}`
        });
      }
    });

    // إضافة حوالات العمال (مصروف)
    workerTransfersArray.forEach((transfer: any) => {
      const date = transfer.date || transfer.transferDate;
      const amount = parseFloat(transfer.amount);

      if (date && !isNaN(amount) && amount > 0) {
        // البحث عن العامل باستخدام workerId
        const worker = workersArray.find((w: any) => w.id === transfer.workerId);
        const workerName = worker?.name || transfer.workerName || 'عامل غير معروف';
        const recipientName = transfer.recipientName ? ` - المستلم: ${transfer.recipientName}` : '';
        const transferMethod = transfer.transferMethod === 'hawaleh' ? 'حولة' : 
                              transfer.transferMethod === 'bank' ? 'تحويل بنكي' : 'نقداً';

        allTransactions.push({
          id: `worker-transfer-${transfer.id}`,
          date: date,
          type: 'expense',
          category: 'حوالات العمال',
          amount: amount,
          description: `${workerName}${recipientName} - ${transferMethod}`
        });
      }
    });

    // ترتيب حسب التاريخ (الأحدث أولاً) مع التأكد من صحة التواريخ
    const finalTransactions = allTransactions
      .filter(t => t.date && !isNaN(new Date(t.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`✅ معاملات نهائية: ${finalTransactions.length} من أصل ${allTransactions.length}`);
    console.log('🔍 تفاصيل المعاملات النهائية:', {
      income: finalTransactions.filter(t => t.type === 'income').length,
      transfer_from_project: finalTransactions.filter(t => t.type === 'transfer_from_project').length,
      expense: finalTransactions.filter(t => t.type === 'expense').length,
      deferred: finalTransactions.filter(t => t.type === 'deferred').length,
      workerWages: finalTransactions.filter(t => t.category === 'أجور العمال').length,
      workerTransfers: finalTransactions.filter(t => t.category === 'حوالات العمال').length,
      outgoingTransfers: finalTransactions.filter(t => t.category === 'تحويل إلى مشروع آخر').length
    });
    
    return finalTransactions;
  }, [fundTransfers, incomingProjectTransfers, outgoingProjectTransfers, workerAttendance, materialPurchases, transportExpenses, miscExpenses, workerTransfers, workers]);

  // تطبيق الفلاتر
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [transactions, filterType, searchTerm]);

  // حساب الإجماليات
  const totals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const transferFromProject = filteredTransactions.filter(t => t.type === 'transfer_from_project').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const deferred = filteredTransactions.filter(t => t.type === 'deferred').reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalIncome = income + transferFromProject; // التحويلات من المشاريع تحسب ضمن الدخل
    
    return { 
      income: income,
      transferFromProject: transferFromProject,
      totalIncome: totalIncome,
      expenses: expenses,
      deferred: deferred,
      balance: totalIncome - expenses // المشتريات الآجلة لا تؤثر على الرصيد
    };
  }, [filteredTransactions]);

  const selectedProjectName = projects.find(p => p.id === selectedProject)?.name || '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* العنوان */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <Building2 className="h-8 w-8" />
              سجل العمليات المالية
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              عرض وتحليل جميع المعاملات المالية للمشاريع
            </p>
          </CardHeader>
        </Card>

        {/* اختيار المشروع والفلاتر */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              اختيار المشروع والفلاتر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* اختيار المشروع */}
              <div>
                <label className="block text-sm font-medium mb-2">المشروع</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مشروعاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* نوع العملية */}
              <div>
                <label className="block text-sm font-medium mb-2">نوع العملية</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع العمليات</SelectItem>
                    <SelectItem value="income">الدخل فقط</SelectItem>
                    <SelectItem value="transfer_from_project">التحويلات من المشاريع</SelectItem>
                    <SelectItem value="expense">المصاريف فقط</SelectItem>
                    <SelectItem value="deferred">المشتريات الآجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* البحث */}
              <div>
                <label className="block text-sm font-medium mb-2">البحث</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ابحث في الوصف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedProject && (
          <>
            {/* الإجماليات */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        الدخل المباشر
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(totals.income || 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                        من مشاريع أخرى
                      </p>
                      <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                        {formatCurrency(totals.transferFromProject || 0)}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-cyan-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        إجمالي المصاريف
                      </p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {formatCurrency(totals.expenses || 0)}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        المشتريات الآجلة
                      </p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                        {formatCurrency(totals.deferred || 0)}
                      </p>
                      <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">
                        (لا تُحسب في الرصيد)
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${totals.balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${totals.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        الرصيد النهائي
                      </p>
                      <p className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
                        {formatCurrency(totals.balance || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        (بدون المشتريات الآجلة)
                      </p>
                    </div>
                    <TrendingUp className={`h-8 w-8 ${totals.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* جدول العمليات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>سجل العمليات - {selectedProjectName}</span>
                  <Badge variant="outline">
                    {filteredTransactions.length} عملية
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                      <Building2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
                        لا توجد عمليات مالية
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 mb-4">
                        {selectedProject ? 
                          'هذا المشروع لا يحتوي على عمليات مالية مسجلة بعد' : 
                          'يرجى اختيار مشروع لعرض العمليات المالية الخاصة به'
                        }
                      </p>
                      <div className="text-sm text-blue-500 dark:text-blue-400">
                        💡 نصيحة: تأكد من إدخال البيانات التالية للمشروع:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>تحويلات العهدة</li>
                          <li>أجور العمال</li>
                          <li>مشتريات المواد</li>
                          <li>مصروفات النقل</li>
                          <li>المصروفات المتنوعة</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b bg-gray-50 dark:bg-gray-800">
                          <th className="text-right py-3 px-4 font-medium">التاريخ</th>
                          <th className="text-right py-3 px-4 font-medium">النوع</th>
                          <th className="text-right py-3 px-4 font-medium">الفئة</th>
                          <th className="text-right py-3 px-4 font-medium">المبلغ</th>
                          <th className="text-right py-3 px-4 font-medium">الوصف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction, index) => (
                          <tr key={transaction.id} className={`border-b ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} hover:bg-gray-100 dark:hover:bg-gray-700`}>
                            <td className="py-3 px-4 text-sm">
                              {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ar })}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                transaction.type === 'income' ? 'default' : 
                                transaction.type === 'transfer_from_project' ? 'secondary' : 
                                transaction.type === 'deferred' ? 'outline' : 'destructive'
                              } className={
                                transaction.type === 'deferred' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 
                                transaction.type === 'transfer_from_project' ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : ''
                              }>
                                {transaction.type === 'income' ? 'دخل' : 
                                 transaction.type === 'transfer_from_project' ? 'تحويل مشروع' :
                                 transaction.type === 'deferred' ? 'آجل' : 'مصروف'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {transaction.category}
                            </td>
                            <td className={`py-3 px-4 text-sm font-bold ${
                              transaction.type === 'income' ? 'text-green-600' : 
                              transaction.type === 'transfer_from_project' ? 'text-cyan-600' :
                              transaction.type === 'deferred' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' || transaction.type === 'transfer_from_project' ? '+' : 
                               transaction.type === 'deferred' ? '' : '-'}{formatCurrency(transaction.amount || 0).replace(' ر.ي', '')} ر.ي
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {transaction.category === 'أجور العمال' ? (
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {transaction.description.split(' - أجر يومي:')[0]}
                                  </span>
                                  {transaction.description.includes(' - أجر يومي:') && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {transaction.description.split(' - أجر يومي:')[1] ? 
                                        `أجر يومي: ${transaction.description.split(' - أجر يومي:')[1]}` : ''}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                transaction.description
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}