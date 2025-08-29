#!/bin/bash

# سكربت الأوامر للفحص البنائي لقاعدة البيانات
# نظام إدارة المشاريع الإنشائية

echo "🔧 أوامر الفحص البنائي لقاعدة البيانات"
echo "============================================="

case "$1" in
  "gen:expected")
    echo "📋 توليد المخطط المتوقع من الكود..."
    npx tsx scripts/generate-expected-schema.ts
    ;;
    
  "check:schema")
    echo "🔍 مقارنة المخطط مع قاعدة البيانات..."
    npx tsx scripts/compare-expected-vs-db.ts
    ;;
    
  "schema:ci")
    echo "🚀 تشغيل فحص CI كامل..."
    npx tsx scripts/generate-expected-schema.ts && npx tsx scripts/compare-expected-vs-db.ts
    ;;
    
  "backup:create")
    echo "💾 إنشاء نسخة احتياطية..."
    npx tsx scripts/backup-database.ts create $2 $3
    ;;
    
  "backup:restore")
    echo "🔄 استعادة نسخة احتياطية..."
    npx tsx scripts/backup-database.ts restore $2 $3
    ;;
    
  "backup:list")
    echo "📂 عرض النسخ الاحتياطية..."
    npx tsx scripts/backup-database.ts list
    ;;
    
  "ddl:setup")
    echo "⚙️ إعداد نظام مراقبة DDL..."
    npx tsx scripts/setup-ddl-audit.ts setup $2
    ;;
    
  "ddl:test")
    echo "🧪 اختبار نظام مراقبة DDL..."
    npx tsx scripts/setup-ddl-audit.ts test $2
    ;;
    
  *)
    echo "الاستخدام: ./scripts/run-commands.sh [أمر] [معاملات]"
    echo ""
    echo "الأوامر المتاحة:"
    echo "  gen:expected     - توليد المخطط المتوقع من shared/schema.ts"
    echo "  check:schema     - مقارنة المخطط مع قاعدة البيانات"
    echo "  schema:ci        - تشغيل فحص CI كامل"
    echo "  backup:create    - إنشاء نسخة احتياطية [نوع] [تنسيق]"
    echo "  backup:restore   - استعادة نسخة احتياطية [مسار الملف] [قاعدة البيانات]"
    echo "  backup:list      - عرض النسخ الاحتياطية المتوفرة"
    echo "  ddl:setup        - إعداد نظام مراقبة DDL [قاعدة البيانات]"
    echo "  ddl:test         - اختبار نظام مراقبة DDL [قاعدة البيانات]"
    echo ""
    echo "أمثلة:"
    echo "  ./scripts/run-commands.sh gen:expected"
    echo "  ./scripts/run-commands.sh check:schema"
    echo "  ./scripts/run-commands.sh backup:create full custom"
    echo "  ./scripts/run-commands.sh ddl:setup"
    ;;
esac