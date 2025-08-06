import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, TrendingUp, TrendingDown, Building2 } from 'lucide-react';
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
  type: 'income' | 'expense';
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

  // جلب تحويلات العهدة للمشروع
  const { data: fundTransfers = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'fund-transfers'],
    enabled: !!selectedProject,
  });

  // جلب حضور العمال للمشروع
  const { data: workerAttendance = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'worker-attendance'],
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

  // تحويل البيانات إلى قائمة معاملات موحدة
  const transactions = useMemo(() => {
    const allTransactions: Transaction[] = [];
    
    // تشخيص البيانات للمساعدة في حل المشكلة
    const fundTransfersArray = Array.isArray(fundTransfers) ? fundTransfers : [];
    const workerAttendanceArray = Array.isArray(workerAttendance) ? workerAttendance : [];
    const materialPurchasesArray = Array.isArray(materialPurchases) ? materialPurchases : [];
    const transportExpensesArray = Array.isArray(transportExpenses) ? transportExpenses : [];
    const miscExpensesArray = Array.isArray(miscExpenses) ? miscExpenses : [];
    
    // حساب إجمالي العمليات المتاحة
    const totalOperations = fundTransfersArray.length + workerAttendanceArray.length + 
                           materialPurchasesArray.length + transportExpensesArray.length + 
                           miscExpensesArray.length;

    // إضافة تحويلات العهدة (دخل)
    fundTransfersArray.forEach((transfer: any) => {
      const date = transfer.transferDate || transfer.date;
      const amount = parseFloat(transfer.amount) || 0;

      if (date && !isNaN(amount)) {
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

    // إضافة أجور العمال (مصروف)
    workerAttendanceArray.forEach((attendance: any) => {
      const date = attendance.date;
      // البحث عن المبلغ في الحقول المختلفة
      const amount = parseFloat(
        attendance.paidAmount || 
        attendance.actualWage || 
        attendance.totalWage || 
        (attendance.dailyWage * attendance.workDays) ||
        0
      );

      if (date && !isNaN(amount) && amount !== 0) {
        allTransactions.push({
          id: `wage-${attendance.id}`,
          date: date,
          type: 'expense',
          category: 'أجور العمال',
          amount: amount,
          description: `عامل: ${attendance.workerName || attendance.worker?.name || 'غير محدد'}`
        });
      }
    });

    // إضافة مشتريات المواد (مصروف)
    materialPurchasesArray.forEach((purchase: any) => {
      const date = purchase.purchaseDate || purchase.date;
      const amount = parseFloat(purchase.totalAmount || purchase.amount || purchase.cost) || 0;

      if (date && !isNaN(amount) && amount !== 0) {
        allTransactions.push({
          id: `material-${purchase.id}`,
          date: date,
          type: 'expense',
          category: 'مشتريات المواد',
          amount: amount,
          description: `مادة: ${purchase.materialName || purchase.material?.name || purchase.name || 'غير محدد'}`
        });
      }
    });

    // إضافة مصروفات النقل (مصروف)
    transportExpensesArray.forEach((expense: any) => {
      const date = expense.date;
      const amount = parseFloat(expense.amount) || 0;

      if (date && !isNaN(amount) && amount !== 0) {
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
      const amount = parseFloat(expense.amount) || 0;

      if (date && !isNaN(amount) && amount !== 0) {
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

    // ترتيب حسب التاريخ (الأحدث أولاً) مع التأكد من صحة التواريخ
    return allTransactions
      .filter(t => t.date && !isNaN(new Date(t.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fundTransfers, workerAttendance, materialPurchases, transportExpenses, miscExpenses]);

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
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    return { 
      income: income, 
      expenses: expenses, 
      balance: income - expenses 
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
                    <SelectItem value="expense">المصاريف فقط</SelectItem>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        إجمالي الدخل
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(totals.income || 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
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
                    </div>
                    <Building2 className={`h-8 w-8 ${totals.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
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
                              <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                                {transaction.type === 'income' ? 'دخل' : 'مصروف'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {transaction.category}
                            </td>
                            <td className={`py-3 px-4 text-sm font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0).replace(' ر.ي', '')} ر.ي
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {transaction.description}
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