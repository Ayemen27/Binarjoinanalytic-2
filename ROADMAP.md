# خارطة طريق تحسين المشروع - نظام إدارة المشاريع الإنشائية

## 📍 الوضع الحالي (19 أغسطس 2025)

✅ **المشروع في حالة ممتازة** مع:
- قاعدة بيانات Supabase متصلة ومستقرة (32 جدول)
- واجهة React عاملة بكفاءة
- نظام تقارير متقدم مع تصدير Excel/PDF
- إعداد ESLint محدث ومُحسّن
- سكربتات تدقيق وفحص شاملة

---

## 🚀 المراحل القادمة

### المرحلة 1: التنظيف الفوري (1-3 أيام)
**الأولوية**: عالية جداً

#### إزالة الحزم غير المستخدمة
- [ ] حذف `memorystore` (sessions memory - غير مستخدم)
- [ ] حذف `next-themes` (نمط ضوء/ظلام - غير مطبق)  
- [ ] حذف `openid-client` (OpenID auth - غير مستخدم)

```bash
npm uninstall memorystore next-themes openid-client
npm install && npx tsc --noEmit
```

#### فحص الحزم المشتبه بها
- [ ] `connect-pg-simple` - فحص PostgreSQL sessions
- [ ] `framer-motion` - فحص animations
- [ ] `passport` + `passport-local` - تأكيد نظام المصادقة
- [ ] `react-icons` - مقارنة مع lucide-react
- [ ] `tw-animate-css` - فحص Tailwind animations
- [ ] `xlsx` - تأكيد تصدير Excel

#### أرشفة الأصول
- [ ] نقل الصور غير المستخدمة إلى `archive/unused-assets/`

### المرحلة 2: الإصلاحات الفنية (4-7 أيام)  
**الأولوية**: متوسطة عالية

#### أخطاء TypeScript
- [ ] إصلاح 24 خطأ TypeScript المتبقي:
  - أخطاء `ProjectSelector` props
  - مشاكل `useSelectedProject` hook
  - أخطاء Drizzle ORM queries
  - مشاكل SQL types

#### تحسينات الكود
- [ ] مراجعة `madge-orphans.txt` - إزالة الملفات اليتيمة
- [ ] حل circular dependency الوحيدة (غير حرجة)

### المرحلة 3: الأتمتة والCI/CD (1-2 أسابيع)
**الأولوية**: متوسطة

#### تفعيل GitHub Actions
- [x] إنشاء `.github/workflows/ci.yml` ✅
- [ ] اختبار workflow في بيئة staging
- [ ] إعداد تشغيل تلقائي شهري للتدقيق

#### أدوات التطوير
- [x] سكربت `check-deps-usage.sh` ✅  
- [x] قائمة فحص `cleanup-checklist.md` ✅
- [ ] إضافة pre-commit hooks

### المرحلة 4: التحسينات طويلة المدى (1-2 شهر)
**الأولوية**: منخفضة-متوسطة

#### الأداء والتحسين
- [ ] تحليل bundle size بعد حذف الحزم
- [ ] تحسين lazy loading للصفحات
- [ ] ضغط الأصول والصور

#### الميزات الجديدة
- [ ] نظام إشعارات محسن
- [ ] نسخ احتياطية تلقائية
- [ ] واجهة mobile محسنة

---

## 📊 المؤشرات والأهداف

### أهداف قريبة المدى (أسبوع)
- 🎯 **تقليل حجم node_modules بـ 15-25%**
- 🎯 **إزالة 24 خطأ TypeScript**  
- 🎯 **تسريع npm install بـ 10-20%**

### أهداف متوسطة المدى (شهر)
- 🎯 **CI/CD تلقائي 100% عامل**
- 🎯 **zero TypeScript errors**
- 🎯 **automated monthly audits**

### أهداف طويلة المدى (3 أشهر)
- 🎯 **bundle size محسن بـ 30%+**
- 🎯 **performance score 90%+**  
- 🎯 **full mobile optimization**

---

## 🔧 أوامر سريعة

### التدقيق اليومي
```bash
npx tsc --noEmit
npx eslint . --ext .js,.ts,.tsx --max-warnings=0
bash tools/check-deps-usage.sh
```

### التنظيف الأسبوعي  
```bash
npm audit --audit-level high
npx update-browserslist-db@latest
bash repo-audit.sh
```

### الفحص الشهري
```bash
npx depcheck --json > audit-results/monthly-deps.json
npx madge --circular --extensions ts,tsx,js,jsx .
```

---

## ⚠️ تحذيرات مهمة

### قبل أي تغيير كبير:
1. **نسخ احتياطية**: استخدم `git stash` أو archive/
2. **اختبار شامل**: تأكد من عمل جميع الصفحات  
3. **staging environment**: اختبر قبل production
4. **مراقبة الأخطاء**: راقب logs لمدة 48 ساعة

### الحزم الحساسة - لا تحذف:
- `drizzle-orm` - قاعدة البيانات الأساسية
- `@supabase/*` - اتصال قاعدة البيانات
- `react-query` - إدارة الحالة
- `vite` - build system

---

## 📞 نقاط المراجعة

### مراجعة أسبوعية
- [ ] حالة TypeScript errors
- [ ] أداء تحميل الصفحات  
- [ ] تقارير CI/CD
- [ ] استقرار النظام

### مراجعة شهرية  
- [ ] تحليل dependencies شامل
- [ ] مراجعة security audit
- [ ] تحديث documentation
- [ ] تقييم roadmap progress

---

## 🏁 النتيجة المُتوقعة

بعد إكمال جميع المراحل:
- ✅ مشروع نظيف ومُحسّن
- ✅ dependencies minimal وضرورية فقط  
- ✅ CI/CD متين ومُوثوق
- ✅ أداء محسن وسرعة أعلى
- ✅ maintainability ممتازة

**الهدف النهائي**: نظام إدارة مشاريع إنشائية مُحسّن، سريع، وموثوق لسنوات قادمة.