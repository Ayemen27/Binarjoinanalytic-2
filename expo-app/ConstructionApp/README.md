# نظام إدارة المشاريع الإنشائية - تطبيق الموبايل

تطبيق React Native باستخدام Expo لإدارة المشاريع الإنشائية

## 🚀 المزايا

- **واجهة عربية كاملة**: تصميم يدعم اللغة العربية والاتجاه RTL
- **تطبيق أصلي**: React Native مع Expo للأداء الأمثل
- **جاهز للتصدير**: يمكن بناؤه كـ APK أو AAB
- **متوافق مع قاعدة البيانات**: مُعد للاتصال مع Supabase

## 📱 لقطات الشاشة

التطبيق يتضمن:
- شاشة رئيسية بقائمة المشاريع
- إمكانية إضافة مشاريع جديدة
- تحديث البيانات
- تصميم مادي عصري

## 🛠️ التثبيت والتشغيل

### 1. تثبيت الحزم
```bash
cd expo-app/ConstructionApp
npm install
```

### 2. تشغيل المطور
```bash
npx expo start
```

### 3. اختبار على الهاتف
- قم بتثبيت تطبيق Expo Go على هاتفك
- امسح QR Code الذي يظهر في الطرفية

## 📦 بناء APK

### 1. تثبيت EAS CLI
```bash
npm install -g eas-cli
```

### 2. تسجيل الدخول لـ Expo
```bash
npx eas login
```

### 3. إعداد المشروع
```bash
npx eas build:configure
```

### 4. بناء APK لأندرويد
```bash
npx eas build -p android --profile preview
```

## 🔗 ربط قاعدة البيانات

لربط التطبيق بـ Supabase:

1. أضف متغيرات البيئة في ملف `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON=your_supabase_anon_key
```

2. قم بتثبيت حزم Supabase:
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

## 📝 الهيكل

```
ConstructionApp/
├── App.tsx              # التطبيق الرئيسي
├── eas.json            # إعدادات البناء
├── app.json            # إعدادات Expo
├── package.json        # الحزم والاعتماديات
└── assets/             # الصور والأيقونات
```

## 🎯 الخطوات التالية

1. ✅ إنشاء التطبيق الأساسي
2. ⏳ ربط Supabase
3. ⏳ إضافة صفحات إضافية
4. ⏳ بناء APK النهائي

---

تم إنشاؤه بواسطة فريق التطوير - نظام إدارة المشاريع الإنشائية