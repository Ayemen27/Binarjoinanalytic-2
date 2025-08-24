#!/bin/bash

echo "🔧 إعداد تطبيق إدارة المشاريع الإنشائية للموبايل..."

# تثبيت التبعيات الأساسية
echo "📦 تثبيت التبعيات..."
npm install --legacy-peer-deps

# تثبيت expo CLI إذا لم يكن مثبتاً
if ! command -v expo &> /dev/null; then
    echo "⚡ تثبيت Expo CLI..."
    npm install -g @expo/cli
fi

# إنشاء مجلد التطبيق إذا لم يكن موجوداً
if [ ! -d "node_modules" ]; then
    echo "📁 إنشاء مجلدات التطبيق..."
    mkdir -p node_modules
fi

echo "✅ تم إعداد التطبيق بنجاح!"
echo "🚀 بدء تشغيل التطبيق..."
echo "🌐 ستجد التطبيق على: http://localhost:19006"
echo "📱 يمكنك مسح الكود QR لتشغيل التطبيق على الهاتف"

# تشغيل التطبيق
npm start