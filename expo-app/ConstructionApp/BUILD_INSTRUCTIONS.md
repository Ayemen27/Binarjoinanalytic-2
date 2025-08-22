# 🚀 دليل بناء APK - خطوات عملية

## المتطلبات الأساسية:
- **Node.js 18+** على جهازك المحلي
- **حساب Expo** (مجاني تماماً)
- **اتصال إنترنت** للبناء السحابي

---

## 🛠️ الخطوات العملية:

### 1️⃣ تحميل المشروع من Replit

```bash
# قم بتحميل كامل مجلد expo-app/ConstructionApp من Replit إلى جهازك
# أو استخدم git إذا كان متاحاً:
git clone [رابط مشروعك في Replit]
cd ConstructionApp
```

### 2️⃣ تثبيت الاعتماديات

```bash
npm install
npm install -g eas-cli
```

### 3️⃣ إنشاء حساب Expo (مجاني)

```bash
npx eas login
# أو أنشئ حساب جديد:
npx eas register
```

### 4️⃣ إعداد المشروع

```bash
npx eas build:configure
```
سيسألك عن:
- **Android bundle identifier**: اتركه كما هو `com.constructionapp.management`
- **Generate new keystore**: اختر `Yes`

### 5️⃣ بناء APK

```bash
npx eas build -p android --profile preview
```

**⏰ الوقت المتوقع**: 10-15 دقيقة

### 6️⃣ تنزيل APK

بعد انتهاء البناء:
- ستحصل على **رابط تنزيل مباشر**
- أو ادخل إلى https://expo.dev/accounts/[اسم-حسابك]/projects/construction-management/builds

---

## 📱 تثبيت APK على الجهاز:

1. **نزّل APK** من الرابط
2. **انقل الملف** لجهاز الأندرويد
3. **فعّل "المصادر غير المعروفة"** في الإعدادات
4. **اضغط على الملف** لتثبيته

---

## ⚡ طريقة أسرع - استخدام Expo Go:

للاختبار السريع بدون بناء APK:

```bash
npx expo start
```

ثم:
1. ثبت **Expo Go** من متجر التطبيقات
2. امسح **QR Code** من الطرفية
3. جرب التطبيق مباشرة!

---

## 🔗 ربط قاعدة البيانات (اختياري):

إذا كنت تريد ربط التطبيق بـ Supabase:

### 1. أضف متغيرات البيئة:
أنشئ ملف `.env` في جذر المشروع:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON=your-anon-key
```

### 2. ثبت حزم Supabase:
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

### 3. أعد بناء التطبيق:
```bash
npx eas build -p android --profile preview
```

---

## 🆘 إذا واجهت مشاكل:

### مشكلة: "eas command not found"
```bash
npm install -g eas-cli@latest
```

### مشكلة: "Invalid credentials"
```bash
npx eas logout
npx eas login
```

### مشكلة: "Build failed"
تحقق من:
- اتصال الإنترنت مستقر
- ملف `package.json` سليم
- لا توجد أخطاء في الكود

---

## 📞 للدعم الفني:

- **Expo Documentation**: https://docs.expo.dev/
- **EAS Build Guide**: https://docs.expo.dev/build/setup/
- **Community Forum**: https://forums.expo.dev/

---

## 🎯 النتيجة النهائية:

✅ **ملف APK** يعمل على أي جهاز أندرويد  
✅ **تطبيق عربي** بواجهة احترافية  
✅ **بدون حاجة لخادم** - يعمل بشكل مستقل  
✅ **قابل للتوزيع** مباشرة أو عبر متجر التطبيقات  

---

**ملاحظة مهمة**: جميع الملفات جاهزة ومُعدة بشكل صحيح. تحتاج فقط لتنفيذ هذه الخطوات على جهازك المحلي!