#!/bin/bash
echo "🔧 تثبيت مكتبات التطبيق المحمول..."

cd mobile-app

# حذف الملفات القديمة
rm -rf node_modules package-lock.json

# تثبيت المكتبات الأساسية أولاً
echo "📦 تثبيت Expo والمكتبات الأساسية..."
npm install expo@51.0.0 react@18.2.0 react-native@0.74.0 --legacy-peer-deps

# تثبيت باقي المكتبات
echo "📦 تثبيت باقي المكتبات..."
npm install --legacy-peer-deps

echo "✅ تم تثبيت جميع المكتبات بنجاح!"
echo "🚀 يمكنك الآن تشغيل التطبيق بـ: npx expo start"