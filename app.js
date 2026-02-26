

import { initializeApp } from "[https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js](https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js)";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from "[https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js](https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js)";
import { getAuth, signInWithEmailAndPassword } from "[https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js](https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js)";

const firebaseConfig = {
    apiKey: "AIzaSyCx8EM2HSnksOBxPUrvh5GI6f8LD42Ojns",
    authDomain: "lap-mosul-db.firebaseapp.com",
    projectId: "lap-mosul-db",
    storageBucket: "lap-mosul-db.firebasestorage.app",
    messagingSenderId: "698504973676",
    appId: "1:698504973676:web:1e8f7473668d32a3023749",
    measurementId: "G-SM4N5BK1Z1"
};

let app, db, auth, productsRef;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    productsRef = collection(db, "products");
    console.log("Firebase Connected ✅");
} catch (error) {
    console.error("Firebase Error:", error);
}

let allProducts = [];
let currentCategory = 'all';
let editingId = null;

// --- نظام سلة المشتريات المتكامل ---
let cart = JSON.parse(localStorage.getItem('lapmosul_cart')) || [];

function saveCart() {
    localStorage.setItem('lapmosul_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const mobileBadge = document.getElementById('mobile-cart-badge'); // إضافة بادج الموبايل
    
    badge.innerText = cart.length;
    if(mobileBadge) mobileBadge.innerText = cart.length;

    if(cart.length > 0) {
        badge.classList.remove('hidden');
        if(mobileBadge) mobileBadge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
        if(mobileBadge) mobileBadge.classList.add('hidden');
    }
    
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if(!container) return;
    
    if(cart.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 mt-20"><i class="fas fa-box-open text-6xl mb-4 opacity-50"></i><p class="font-bold">السلة فارغة حالياً</p></div>';
        totalEl.innerText = '0';
        return;
    }
    
    container.innerHTML = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        // استخراج الرقم من النص للجمع (مثلا "500$" يصبح 500)
        const priceNum = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        total += priceNum;
        
        container.innerHTML += `
            <div class="flex gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                <div class="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center p-2 shrink-0 border border-slate-100 dark:border-slate-700">
                    <img src="${item.img}" class="w-full h-full object-contain drop-shadow-md" onerror="this.src='[https://placehold.co/100](https://placehold.co/100)'">
                </div>
                <div class="flex-1 flex flex-col justify-center py-1">
                    <h4 class="font-bold text-sm text-slate-800 dark:text-white line-clamp-1 mb-1">${item.name}</h4>
                    <p class="text-brand-500 font-black text-sm direction-ltr">${item.price}</p>
                </div>
                <button onclick="window.app.removeFromCart(${index})" class="absolute left-0 top-0 bottom-0 w-12 bg-red-500 text-white flex items-center justify-center transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    totalEl.innerText = total.toLocaleString() + (total > 10000 ? ' د.ع' : ' $');
}

// دالة مساعدة لإنشاء بطاقة المنتج وتوحيد التصميم للكل
function generateProductCardHTML(p, badgeText, badgeColorClass) {
    const isNew = p.type === 'new';
    return `
        <div onclick="window.app.openProductModal('${p.id}')" class="group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
            <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center overflow-hidden">
                <img src="${p.img}" class="w-full h-full object-contain transform group-hover:scale-125 transition-transform duration-500 ease-in-out drop-shadow-xl" onerror="this.src='[https://placehold.co/400x300](https://placehold.co/400x300)'">
                <div class="absolute top-3 right-3 ${badgeColorClass} text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 flex items-center gap-1">${badgeText}</div>
            </div>
            <h3 class="font-bold text-lg mb-2 text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors line-clamp-1">${p.name}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1 line-clamp-2">${p.specs}</p>
            <div class="flex justify-between items-center mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <span class="font-black text-slate-800 dark:text-white text-lg direction-ltr">${p.price || (isNew ? 'قريباً' : '')}</span>
                ${isNew ? 
                    `<button onclick="event.stopPropagation(); window.open('https://wa.me/9647777111558', '_blank')" class="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-md hover:scale-110"><i class="fas fa-bell"></i></button>`
                    : 
                    `<button onclick="event.stopPropagation(); window.app.addToCart('${p.id}')" class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-sm hover:scale-110"><i class="fas fa-cart-plus"></i></button>`
                }
            </div>
        </div>`;
}

function refreshData() {
    updateUI();
    updateAdminList();
    renderNewProducts();
    renderAccessories();
    updateCartUI(); // تحديث السلة عند التحميل
    const spinner = document.getElementById('loading-spinner');
    if(spinner) spinner.style.display = 'none';
    document.getElementById('products-container').classList.remove('hidden');
}

// جلب البيانات وترتيبها A to Z
if (productsRef) {
    const q = query(productsRef, orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        let fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // ترتيب المنتجات أبجدياً من A إلى Z
        fetchedProducts.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
        allProducts = fetchedProducts;
        refreshData();
    });
}

// قسم الجديد
function renderNewProducts() {
    const container = document.getElementById('new-products-container');
    if(!container) return;
    container.innerHTML = '';
    const comingSoonProducts = allProducts.filter(p => p.type === 'new');
    
    comingSoonProducts.forEach(p => {
        container.innerHTML += generateProductCardHTML(p, 'COMING SOON', 'bg-red-500 animate-pulse');
    });
}

// قسم الإكسسوارات
function renderAccessories() {
    const container = document.getElementById('accessory-products-container');
    if(!container) return;
    container.innerHTML = '';
    const accessories = allProducts.filter(p => p.type === 'accessory');
    
    accessories.forEach(p => {
        container.innerHTML += generateProductCardHTML(p, 'ACCESSORY', 'bg-purple-500');
    });
}

// قسم المستعمل الأساسي
function updateUI() {
    const queryStr = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('products-container');
    
    const filtered = allProducts.filter(p => {
        const isUsed = p.type === 'used' || !p.type;
        const matchCat = currentCategory === 'all' || p.category === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(queryStr) || (p.specs && p.specs.toLowerCase().includes(queryStr));
        return isUsed && matchCat && matchSearch;
    });

    container.innerHTML = '';
    if (filtered.length === 0) {
        document.getElementById('no-results').classList.remove('hidden');
    } else {
        document.getElementById('no-results').classList.add('hidden');
        filtered.forEach(p => {
            container.innerHTML += generateProductCardHTML(p, '<i class="fas fa-check-circle"></i> متوفر', 'bg-emerald-500');
        });
    }
}

// -----------------------------------------------------
// 🔥 إعدادات واجهة برمجة تطبيقات Gemini (Gemini API) 🔥
// -----------------------------------------------------
const geminiApiKey = ""; // API Key provided by execution environment
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;

// دالة مساعدة لطلب API مع نظام Retry (Exponential Backoff) لضمان عدم فشل الاستجابة
async function fetchGemini(promptText, systemInstructionText = null) {
    const payload = {
        contents: [{ parts: [{ text: promptText }] }]
    };
    if (systemInstructionText) {
        payload.systemInstruction = { parts: [{ text: systemInstructionText }] };
    }

    const retries = 5;
    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('API Request Failed');
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (error) {
            if (i === retries - 1) return null;
            await delay(1000 * Math.pow(2, i)); // 1s, 2s, 4s...
        }
    }
    return null;
}

// 1. نظام الدردشة الذكي (Chatbot)
async function generateAIResponse(userMsg) {
    // تزويد Gemini بقائمة المنتجات المتوفرة ليكون مساعد مبيعات واقعي
    const availableProducts = allProducts
        .filter(p => p.type === 'used' || !p.type) // المنتجات المتاحة فقط
        .map(p => `- ${p.name} بسعر ${p.price} (مواصفات: ${p.specs})`)
        .join('\n');
    
    const systemInstruction = `أنت مساعد مبيعات ذكي ومحترف في متجر "لاب الموصل" للحواسيب في العراق.
مهمتك مساعدة العملاء واقتراح اللابتوبات المناسبة لهم بناءً على ميزانيتهم واحتياجاتهم.
هذه قائمة منتجاتنا المتوفرة حالياً في المتجر:
${availableProducts || 'لا توجد منتجات حالياً.'}

التعليمات:
1. أجب على العميل بناءً على هذه المنتجات فقط.
2. كن ودياً وجذاباً ومختصراً جداً. استخدم الإيموجي المناسبة.
3. إذا طلب العميل منتجاً غير متوفر، اعتذر بلباقة واقترح أقرب بديل متوفر لدينا في القائمة.
4. تحدث باللهجة العراقية المبسطة والمحببة للعملاء.`;

    const reply = await fetchGemini(userMsg, systemInstruction);
    return reply || "عذراً، أواجه مشكلة في الاتصال حالياً. يرجى المحاولة بعد قليل أو التواصل عبر الواتساب.";
}

function addChatMsg(text, sender) {
    const container = document.getElementById('chat-messages');
    const id = 'msg-' + Date.now();
    const align = sender === 'user' ? 'justify-end' : 'justify-start';
    const bg = sender === 'user' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
    container.innerHTML += `<div class="flex ${align} mb-2"><div id="${id}" class="${bg} p-3 rounded-2xl text-sm max-w-[80%] shadow-sm">${text}</div></div>`;
    container.scrollTop = container.scrollHeight;
    return id;
}

// لوحة التحكم والوظائف العامة
window.app = {
    showView: (name) => {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`view-${name}`);
        target.classList.add('active');
        window.scrollTo(0,0);
    },
    switchStoreTab: (tab) => {
        document.getElementById('used-section').classList.add('hidden');
        document.getElementById('new-section').classList.add('hidden');
        document.getElementById('accessory-section').classList.add('hidden');
        document.getElementById(`${tab}-section`).classList.remove('hidden');
        
        document.querySelectorAll('[id^="tab-"]').forEach(btn => btn.className = "px-6 sm:px-10 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300");
        document.getElementById(`tab-${tab}`).className = "px-6 sm:px-10 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white shadow-lg transition-all duration-300";
    },
    toggleTheme: () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    },
    filterCategory: (cat) => {
        currentCategory = cat;
        document.querySelectorAll('.cat-btn').forEach(b => {
            b.classList.remove('bg-brand-500', 'text-white');
            b.classList.add('bg-white', 'dark:bg-slate-800');
        });
        event.target.classList.remove('bg-white', 'dark:bg-slate-800');
        event.target.classList.add('bg-brand-500', 'text-white');
        updateUI();
    },
    filterProducts: () => updateUI(),
    openAdminLogin: () => document.getElementById('pin-modal').classList.remove('hidden'),
    
    // --- ميزات السلة وتفاصيل المنتج (المتجر العالمي) ---
    toggleCart: () => {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        if(sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    },
    
    addToCart: (id) => {
        const product = allProducts.find(p => p.id === id);
        if(product) {
            cart.push(product);
            saveCart();
            
            // تحريك أيقونة السلة (الكمبيوتر والموبايل)
            const badge = document.getElementById('cart-badge');
            const mobileBadge = document.getElementById('mobile-cart-badge');
            badge.classList.add('animate-ping');
            if(mobileBadge) mobileBadge.classList.add('animate-ping');
            setTimeout(() => {
                badge.classList.remove('animate-ping');
                if(mobileBadge) mobileBadge.classList.remove('animate-ping');
            }, 300);
            
            // إشعار احترافي منبثق (Toast)
            const toast = document.createElement('div');
            toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl z-[500] flex items-center gap-3 font-bold text-sm animate-bounce-toast border border-slate-700 dark:border-slate-200';
            toast.innerHTML = `<i class="fas fa-check-circle text-emerald-400 dark:text-emerald-500 text-lg"></i> تم إضافة ${product.name} للسلة`;
            document.body.appendChild(toast);
            
            setTimeout(() => { 
                toast.style.opacity = '0'; 
                toast.style.transform = 'scale(0.8) translate(-50%, -20px)';
                toast.style.transition = 'all 0.5s ease-in-out'; 
                setTimeout(() => toast.remove(), 500); 
            }, 2500);
        }
    },
    
    removeFromCart: (index) => {
        cart.splice(index, 1);
        saveCart();
    },
    
    checkoutCart: () => {
        if(cart.length === 0) return alert('السلة فارغة!');
        
        let msg = "🛒 *طلب جديد من متجر لاب الموصل*\n\nالمنتجات المطلوبة:\n";
        cart.forEach((item, i) => {
            msg += `▪️ ${item.name} | السعر: ${item.price}\n`;
        });
        
        const total = document.getElementById('cart-total').innerText;
        msg += `\n💰 *المجموع التقريبي:* ${total}\n\nأرجو تأكيد الطلب.`;
        
        window.open(`https://wa.me/9647777111558?text=${encodeURIComponent(msg)}`, '_blank');
        
        // تفريغ السلة بعد إرسال الطلب وإغلاقها
        cart = [];
        saveCart();
        window.app.toggleCart();
    },

    openProductModal: (id) => {
        const p = allProducts.find(item => item.id === id);
        if(!p) return;
        
        document.getElementById('modal-img').src = p.img;
        document.getElementById('modal-title').innerText = p.name;
        
        let catText = 'أجهزة مستعملة (نظافة عالية)';
        if(p.type === 'accessory') catText = 'إكسسوارات وملحقات';
        if(p.type === 'new') catText = 'أجهزة جديدة (قريباً)';
        document.getElementById('modal-cat').innerText = catText;
        
        document.getElementById('modal-specs').innerText = p.specs || 'لا توجد تفاصيل إضافية مضافة لهذا المنتج.';
        document.getElementById('modal-price').innerText = p.price || '';
        
        const badge = document.getElementById('modal-badge');
        const addBtn = document.getElementById('modal-add-btn');
        
        if(p.type === 'new') {
            badge.innerText = 'قريباً'; 
            badge.className = 'inline-block px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold mb-4 w-max animate-pulse border border-red-500/20';
            addBtn.onclick = () => window.open('[https://wa.me/9647777111558](https://wa.me/9647777111558)', '_blank');
            addBtn.innerHTML = 'أعلمني عند التوفر <i class="fas fa-bell"></i>';
            addBtn.className = 'flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-1';
        } else {
            badge.innerText = 'متوفر للتسليم الفوري'; 
            badge.className = 'inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold mb-4 w-max border border-emerald-500/20';
            addBtn.onclick = () => { window.app.addToCart(p.id); window.app.closeProductModal(); };
            addBtn.innerHTML = 'أضف إلى السلة <i class="fas fa-cart-plus"></i>';
            addBtn.className = 'flex-1 bg-brand-600 hover:bg-brand-500 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-brand-500/30 hover:-translate-y-1';
        }

        const modal = document.getElementById('product-modal');
        const content = document.getElementById('product-modal-content');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
    },

    closeProductModal: () => {
        const modal = document.getElementById('product-modal');
        const content = document.getElementById('product-modal-content');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    // 2. أداة التوليد الذكي للمواصفات في لوحة التحكم (AI Specs Generator)
    generateSpecsAI: async () => {
        const nameInput = document.getElementById('p-name').value;
        if (!nameInput) {
            alert('يرجى كتابة اسم المنتج (اللابتوب أو الإكسسوار) أولاً ليتمكن الذكاء الاصطناعي من تأليف المواصفات ✨.');
            return;
        }
        
        const specsField = document.getElementById('p-specs');
        const oldSpecs = specsField.value;
        specsField.value = "جاري التوليد بواسطة Gemini ✨...";
        
        const prompt = `اكتب وصفاً تسويقياً قصيراً ومميزاً جداً (في سطر واحد فقط كحد أقصى) مع ذكر أهم المواصفات التقنية المتوقعة لجهاز أو إكسسوار يحمل الاسم: "${nameInput}". 
يجب أن يكون الوصف باللغة العربية، ومناسباً لمتجر أجهزة كمبيوتر. لا تضع أي مقدمات أو تحيات، فقط اكتب الوصف مباشرة.`;
        
        const result = await fetchGemini(prompt);
        if (result) {
            specsField.value = result.replace(/\n/g, ' ').trim();
        } else {
            specsField.value = oldSpecs;
            alert("حدث خطأ أثناء التوليد، يرجى المحاولة مرة أخرى.");
        }
    },

    checkLogin: async () => {
        const email = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        
        if (!email || !pass) {
            alert("يرجى ملء جميع الحقول");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            // نجاح الدخول
            document.getElementById('pin-modal').classList.add('hidden');
            document.getElementById('admin-modal').classList.remove('hidden');
            // تنظيف الحقول
            document.getElementById('login-user').value = '';
            document.getElementById('login-pass').value = '';
        } catch (error) {
            console.error("Login Failed:", error);
            alert("خطأ في تسجيل الدخول. تأكد من الإيميل وكلمة المرور.");
        }
    },
    
    closeAdmin: () => {
        window.app.cancelEdit();
        document.getElementById('admin-modal').classList.add('hidden');
    },
    saveProduct: async () => {
        const name = document.getElementById('p-name').value;
        const price = document.getElementById('p-price').value;
        const specs = document.getElementById('p-specs').value;
        const img = document.getElementById('p-img').value;
        const type = document.getElementById('p-type').value;
        const category = document.getElementById('p-cat').value;

        if(!name) return alert("يرجى كتابة الاسم");
        
        // التحقق من صلاحية المستخدم قبل الحفظ
        if (!auth.currentUser) return alert("يجب تسجيل الدخول أولاً");

        try {
            if(editingId) {
                await updateDoc(doc(db, "products", editingId), { name, price, specs, img, type, category });
            } else {
                await addDoc(productsRef, { name, price, specs, img, type, category, createdAt: Date.now() });
            }
            alert("تم الحفظ بنجاح ✅");
            window.app.cancelEdit();
        } catch(e) { 
            console.error(e);
            alert("خطأ في الحفظ (تأكد من الصلاحيات)"); 
        }
    },
    editProduct: (id) => {
        const p = allProducts.find(item => item.id === id);
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-specs').value = p.specs;
        document.getElementById('p-img').value = p.img;
        document.getElementById('p-type').value = p.type || 'used';
        document.getElementById('p-cat').value = p.category || 'student';
        editingId = id;
        document.getElementById('form-title').innerText = "تعديل المنتج";
        document.getElementById('cancel-edit-btn').classList.remove('hidden');
    },
    cancelEdit: () => {
        editingId = null;
        document.querySelectorAll('.input-field').forEach(i => i.value = '');
        document.getElementById('form-title').innerText = "إضافة منتج جديد";
        document.getElementById('cancel-edit-btn').classList.add('hidden');
    },
    deleteProduct: async (id) => {
        if (!auth.currentUser) return alert("يجب تسجيل الدخول أولاً");
        if(confirm("حذف المنتج؟")) await deleteDoc(doc(db, "products", id));
    },
    toggleChat: () => {
        const win = document.getElementById('chat-window');
        win.classList.toggle('hidden');
        win.classList.toggle('opacity-100');
    },
    handleChat: async () => {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if(!msg) return;
        addChatMsg(msg, 'user');
        input.value = '';
        const loadingId = addChatMsg('...', 'bot');
        const reply = await generateAIResponse(msg);
        
        // مسح النقاط الثلاث واستبدالها بالرد الحقيقي
        const loadingElement = document.getElementById(loadingId);
        if(loadingElement) {
            loadingElement.innerHTML = reply.replace(/\n/g, '<br>');
        }
    }
};

function updateAdminList() {
    const list = document.getElementById('admin-list');
    if(!list) return;
    list.innerHTML = '';
    allProducts.forEach(p => {
        list.innerHTML += `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mb-2">
                <div class="flex items-center gap-3">
                    <img src="${p.img}" class="w-10 h-10 rounded-lg object-cover bg-white" onerror="this.src='[https://placehold.co/50](https://placehold.co/50)'">
                    <div><p class="font-bold text-sm">${p.name}</p><p class="text-[10px] text-slate-500">${p.type || 'used'}</p></div>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.app.editProduct('${p.id}')" class="text-blue-500"><i class="fas fa-pencil-alt"></i></button>
                    <button onclick="window.app.deleteProduct('${p.id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    });
}

window.onload = () => {
    setTimeout(() => {
        document.getElementById('splash-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('splash-screen').style.display = 'none', 800);
    }, 1500);
};
