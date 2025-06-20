# 🎯 Prismy - Hồ sơ quy chuẩn thiết kế toàn hệ thống v2.0

> **"Prismy không trang trí. Prismy định hình."**

---

## Tổng quan

Tài liệu này xác lập các **yêu cầu bắt buộc** trong việc triển khai giao diện và trải nghiệm người dùng của Prismy, nhằm duy trì triết lý thiết kế tối giản đơn sắc – lấy cảm hứng từ văn hóa Á Đông, đặc biệt là sự tinh tế và tĩnh tại của văn hoá Việt.

**Nguyên tắc cốt lõi:**
- **Reduction over Addition**: Mỗi lần thêm phải tự hỏi "Điều này có thực sự cần thiết?"
- **Purposeful Minimalism**: Tối giản không phải trống rỗng, mà là đủ đầy ý nghĩa
- **Cultural Resonance**: Phản ánh sự tinh tế của văn hóa Việt - nơi im lặng cũng là ngôn ngữ

---

## 🔳 1. **Triển khai giao diện full-width trên toàn hệ thống**

### Vấn đề đã được giải quyết:
✅ Các khối nội dung đã được chuyển từ `content-container` sang hệ thống full-width  
✅ Áp dụng toàn bộ trang chính: hero, pricing, features, stats, CTA  
✅ Loại bỏ padding constraints trên màn hình lớn  

### Cấu trúc tiêu chuẩn:
```jsx
<section className="py-20 w-full">
  <div className="w-full px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto"> {/* Content constraint */}
      {/* Nội dung */}
    </div>
  </div>
</section>
```

### Max-width constraints theo section:
- **Hero/CTA**: `max-w-6xl` (1152px)
- **Features/Enterprise**: `max-w-7xl` (1280px) 
- **Stats/Company logos**: `max-w-6xl` (1152px)
- **Blog/Text content**: `max-w-4xl` (896px)

---

## 🌐 2. **Language Selector - Custom Dropdown Enterprise Grade**

### Thiết kế mới đã triển khai:
✅ **Custom dropdown thay thế native select**  
✅ **Icon Globe từ Lucide React**: Professional & universal  
✅ **Nền trắng tinh với border subtle**: `border-border-subtle (#e2e8f0)`  
✅ **Không shadow**: Flat design tuyệt đối  
✅ **Micro-interactions choreographed**: hover effects + dropdown animation  

### Code implementation:
```jsx
<div className="relative">
  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border-subtle rounded-md
                     hover:font-semibold hover:transform hover:-translate-y-px">
    <Globe size={16} strokeWidth={1.5} />
    <span>{currentLanguage}</span>
    <ChevronDown size={14} className="transition-transform" />
  </button>
  
  {/* Dropdown với animation */}
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="absolute right-0 mt-2 w-48 bg-white border border-border-subtle rounded-md"
  >
    {/* Language options */}
  </motion.div>
</div>
```

---

## 🖼️ 3. **Hệ thống biểu tượng Lucide React**

### Icons được triển khai:
✅ **Thay thế hoàn toàn emojis** bằng Lucide React icons  
✅ **Cấu hình chuẩn**: `size={24}`, `strokeWidth={1.5}`, `className="text-black"`  
✅ **Hover interaction**: Opacity 0.8 + translateY(-1px)  

### Mapping chuẩn:
- ⚡ → `<Zap>` (Instant Translation)
- 🌍 → `<Globe>` (100+ Languages) 
- 💳 → `<CreditCard>` (Vietnamese Payments)
- 🔒 → `<Shield>` (Security)
- 🔧 → `<Settings>` (Enterprise API)
- 🎧 → `<Headphones>` (24/7 Support)

### CSS class `.zen-icon-hover`:
```css
.zen-icon-hover:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}
```

---

## 🎨 4. **Footer Design - Pure Black Visual Bookend**

### Vấn đề đã khắc phục:
✅ **Chuyển từ navy (#0f172a) sang pure black (#000000)**  
✅ **Text color #f8fafc** cho optimal contrast  
✅ **Copyright text concise & bilingual**  

### Footer specifications:
```css
footer {
  background: #000000; /* Pure black, not navy */
  color: #f8fafc; /* Soft white for readability */
}
```

### Copyright text bilingual:
```typescript
const footerCopyright = {
  en: "© 2025 Prismy – All rights reserved.",
  vi: "© 2025 Prismy – Đã đăng ký bản quyền."
}
```

### Typography:
- Font: Inter, 14px
- Line-height: 1.5 (21px)
- Letter-spacing: -0.01em
- No shadow, no italic, no underline

---

## 💳 5. **Pricing Tier Boxes - Professional Hierarchy**

### Thiết kế đã triển khai:
✅ **Border màu dark gray (#0f172a)** thay vì blue  
✅ **Loại bỏ ring shadow hoàn toàn**  
✅ **"Most Popular" badge floating above box**  
✅ **Consistent padding 32px (8 units)**  

### Pricing box structure:
```jsx
<div className="relative">
  {/* Badge nằm ngoài box */}
  {isPop ular && (
    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
      <span className="bg-text-primary text-white px-4 py-1.5 rounded-md">
        Most Popular
      </span>
    </div>
  )}
  
  {/* Box với border emphasis */}
  <div className={`border-2 ${
    isPopular ? 'border-border-pricing' : 'border-border-subtle'
  }`}>
    {/* Content */}
  </div>
</div>
```

---

## 🧱 6. **Trụ cột thiết kế đã được enforce toàn hệ thống**

| Trụ cột thiết kế | Implementation Status | Specification |
|--|--|--|
| ✅ **Thiết kế phẳng tuyệt đối** | Completed | No gradients, minimal shadows (`0 3px 6px rgba(0,0,0,0.04)`) |
| ✅ **Ưu tiên typography** | Completed | Font weights: 400 (normal), 600 (semibold) only |
| ✅ **Chuyển động "hơi thở"** | Completed | 300ms transitions with zen easing |
| ✅ **Triết lý màu đơn sắc** | Completed | Black (#0f172a), White (#ffffff), Gray scale |
| ✅ **Im lặng thị giác** | Completed | Full-width + generous whitespace |

---

## 📂 **Kiến trúc trang hoàn chỉnh**

### Các trang đã được tạo:
✅ `/` - Homepage với full-width layout  
✅ `/features` - 4 sections chính với 12 features  
✅ `/enterprise` - Case studies + Enterprise pricing  
✅ `/blog` - Professional blog với categories  
✅ `/pricing` - Existing page  
✅ `/documents` - Existing page  
✅ `/api-docs` - Existing page  

### Navigation đã được cập nhật:
✅ Tất cả anchor links (`#features`, `#pricing`, `#enterprise`) → proper page routes  
✅ Không còn 404 errors  
✅ Consistent URL structure  

---

## 🔧 **Design Tokens & CSS Variables**

### Color System (Updated v2.0):
```css
/* Core Monochrome Palette */
--bg-footer: #000000;       /* Pure black for visual bookend */
--text-primary: #0f172a;    /* Softer than pure black */
--text-secondary: #64748b;  /* Mid-tone descriptions */
--text-inverse: #f8fafc;    /* Soft white on dark */

/* Border System */
--border-subtle: #e2e8f0;   /* Ultra-light separation */
--border-strong: #94a3b8;   /* Strong gray emphasis */
--border-pricing: #0f172a;  /* Dark border for premium */

/* Professional SaaS Colors */
--primary-600: #2563eb;     /* Main brand blue (limited use) */
--gray-50: #f9fafb;         /* Background */

/* Vietnamese Payment Colors */
--vnpay-blue: #1a5490;
--momo-purple: #a50064;
--stripe-purple: #635bff;
```

### Animation System:
```css
/* Zen Animation Durations */
--duration-breath: 300ms;
--duration-meditation: 500ms;

/* Zen Transitions */
--transition-base: all var(--duration-breath) cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Shadows (Minimal):
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.02);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.03);
--shadow-lg: 0 3px 6px rgba(0, 0, 0, 0.04);
```

---

## 📱 **Mobile Responsiveness**

### Breakpoints:
- **Mobile**: `max-w-full px-4` (16px padding)
- **Tablet**: `sm:px-6` (24px padding)  
- **Desktop**: `lg:px-8` (32px padding)
- **Large**: Content constraint với max-width

### Mobile-specific adjustments:
```css
@media (max-width: 640px) {
  .zen-icon-hover {
    transform: none; /* Disable hover transforms on touch */
  }
  
  .zen-card-hover {
    padding: 1.5rem; /* Reduce card padding */
  }
}
```

---

## ⚠️ **Enforcement Rules**

### ✅ LUÔN TUÂN THỦ:
1. **Flat design only** - No gradients, no shadows on UI elements
2. **Full-width sections** - Use proper container structure
3. **Lucide icons only** - No emojis or external icon libraries
4. **Typography hierarchy** - 400/600 font weights only
5. **Zen interactions** - translateY(-1px) + opacity/weight changes
6. **Monochrome palette** - Black (#000000), white, gray scale
7. **Custom dropdowns** - No native select elements
8. **Pure black footer** - Visual bookend với hero section

### ❌ TUYỆT ĐỐI KHÔNG:
1. ~~Gradients~~ - Đã loại bỏ hoàn toàn
2. ~~Shadows on dropdowns~~ - Flat design tuyệt đối
3. ~~Emoji icons~~ - Đã thay thế bằng Lucide
4. ~~Native select elements~~ - Custom dropdown only
5. ~~Navy footer (#0f172a)~~ - Pure black (#000000) only
6. ~~Blue pricing borders~~ - Dark gray (#0f172a) only
7. ~~Overlapping badges~~ - Floating above boxes

---

## 🎯 **Quality Checklist**

Trước khi deploy bất kỳ component nào, đảm bảo:

- [ ] Component sử dụng full-width layout structure
- [ ] Icons là Lucide React với proper hover states
- [ ] Không có gradients hoặc shadows
- [ ] Typography hierarchy chuẩn (400/600 weights)
- [ ] Hover interactions theo zen philosophy (translateY + weight)
- [ ] Mobile responsive với proper breakpoints
- [ ] Footer dùng pure black (#000000) không phải navy
- [ ] Language selector là custom dropdown với Globe icon
- [ ] Pricing boxes dùng dark gray borders, không blue
- [ ] "Most Popular" badges float above boxes
- [ ] Copyright text bilingual và concise
- [ ] Tuân thủ updated color tokens v2.0

---

## 📞 **Liên hệ & Support**

Mọi thắc mắc về implementation hoặc exceptions cần approval:
- **Design System Lead**: Prismy Design Team
- **Technical Lead**: Development Team  
- **Final Authority**: Chief UI/UX Architect

> **Nếu bạn phải tự hỏi "giao diện này đã tối giản đúng chưa?" thì câu trả lời rất có thể là **chưa**.**

---

*Document version: 2.0 | Last updated: December 2024 | Status: Production Ready*

> **"Mọi thứ đều có lý do để tồn tại: màu sắc, khoảng trắng, dòng chữ, biểu tượng. Chúng tôi không thêm – chúng tôi bỏ đi – cho đến khi chỉ còn sự rõ ràng và ý nghĩa."**
> 
> — Design Philosophy, Prismy v2