const themeToggleBtn = document.getElementById('theme-toggle');
const rootElement = document.documentElement; // يستهدف وسم <html>

// 1. التحقق من التفضيل المحفوظ مسبقاً في الـ LocalStorage
const savedTheme = localStorage.getItem('lapmosul_theme');

// إذا كان هناك تفضيل محفوظ بأنه "داكن"، قم بتطبيقه فوراً
if (savedTheme === 'dark') {
    rootElement.setAttribute('data-theme', 'dark');
}

// 2. وظيفة التبديل عند النقر على الزر
themeToggleBtn.addEventListener('click', () => {
    // التحقق من الثيم الحالي
    const currentTheme = rootElement.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        // العودة للوضع الفاتح
        rootElement.removeAttribute('data-theme');
        localStorage.setItem('lapmosul_theme', 'light');
    } else {
        // الانتقال للوضع الداكن الفخم
        rootElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('lapmosul_theme', 'dark');
    }
});
