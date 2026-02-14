import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// دالة تحديث واجهة المستخدم العامة
function refreshData() {
    updateUI();
    updateAdminList();
    renderNewProducts();
    renderAccessories();
    const spinner = document.getElementById('loading-spinner');
    if(spinner) spinner.style.display = 'none';
    document.getElementById('products-container').classList.remove('hidden');
}

// مراقبة التغييرات في قاعدة البيانات
if (productsRef) {
    const q = query(productsRef, orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        refreshData();
    });
}

// عرض المنتجات القادمة (جديد)
function renderNewProducts() {
    const container = document.getElementById('new-products-container');
    if(!container) return;
    container.innerHTML = '';
    const comingSoonProducts = allProducts.filter(p => p.type === 'new');
    comingSoonProducts.forEach(p => {
        container.innerHTML += `
            <div class="group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full">
                <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center">
                    <img src="${p.img}" class="w-full h-full object-contain" onerror="this.src='https://placehold.co/400x300'">
                    <div class="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">COMING SOON</div>
                </div>
                <h3 class="font-bold text-lg mb-2 text-slate-800 dark:text-white">${p.name}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">${p.specs}</p>
                <a href="https://wa.me/9647777111558" target="_blank" class="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-center">أعلمني عند التوفر</a>
            </div>`;
    });
}

// عرض الإكسسوارات
function renderAccessories() {
    const container = document.getElementById('accessory-products-container');
    if(!container) return;
    container.innerHTML = '';
    const accessories = allProducts.filter(p => p.type === 'accessory');
    accessories.forEach(p => {
        const waLink = `https://wa.me/9647777111558?text=${encodeURIComponent('حابب أطلب إكسسوار: ' + p.name)}`;
        container.innerHTML += `
            <div class="group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full">
                <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center">
                    <img src="${p.img}" class="w-full h-full object-contain" onerror="this.src='https://placehold.co/400x300'">
                    <div class="absolute top-3 right-3 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">ACCESSORY</div>
                </div>
                <h3 class="font-bold text-lg mb-2 text-slate-800 dark:text-white">${p.name}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">${p.specs}</p>
                <div class="flex justify-between items-center">
                    <span class="font-black text-brand-600 dark:text-brand-400 text-lg">${p.price}</span>
                    <a href="${waLink}" target="_blank" class="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center"><i class="fab fa-whatsapp"></i></a>
                </div>
            </div>`;
    });
}

// نظام الدردشة الذكي
async function generateAIResponse(userMsg) {
    try {
        const response = await fetch('https://lapmosul-chat-api.saam22maxx.workers.dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg })
        });
        const data = await response.json();
        return data.reply || "عذراً، لم أفهم طلبك جيداً.";
    } catch (error) {
        return "المساعد منشغل حالياً، يرجى المحاولة لاحقاً.";
    }
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
        
        document.querySelectorAll('[id^="tab-"]').forEach(btn => btn.className = "px-6 py-3 rounded-xl text-sm font-bold text-slate-500");
        document.getElementById(`tab-${tab}`).className = "px-6 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white shadow-lg";
    },
    toggleTheme: () => document.documentElement.classList.toggle('dark'),
    filterCategory: (cat) => { currentCategory = cat; updateUI(); },
    filterProducts: () => updateUI(),
    openAdminLogin: () => document.getElementById('pin-modal').classList.remove('hidden'),
    
    // 🔓 تعديل الدخول للنظام السريع (admin / 2024)
    checkLogin: () => {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        if(user === "admin" && pass === "2024") {
            document.getElementById('pin-modal').classList.add('hidden');
            document.getElementById('admin-modal').classList.remove('hidden');
        } else {
            alert("بيانات الدخول غير صحيحة ❌");
        }
    },
    
    closeAdmin: () => document.getElementById('admin-modal').classList.add('hidden'),
    saveProduct: async () => {
        const name = document.getElementById('p-name').value;
        const price = document.getElementById('p-price').value;
        const specs = document.getElementById('p-specs').value;
        const img = document.getElementById('p-img').value;
        const type = document.getElementById('p-type').value;
        const category = document.getElementById('p-cat').value;

        if(!name) return alert("يرجى كتابة الاسم");
        try {
            if(editingId) {
                await updateDoc(doc(db, "products", editingId), { name, price, specs, img, type, category });
            } else {
                await addDoc(productsRef, { name, price, specs, img, type, category, createdAt: Date.now() });
            }
            alert("تم الحفظ بنجاح ✅");
            window.app.cancelEdit();
        } catch(e) { alert("خطأ في الحفظ"); }
    },
    editProduct: (id) => {
        const p = allProducts.find(item => item.id === id);
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-specs').value = p.specs;
        document.getElementById('p-img').value = p.img;
        document.getElementById('p-type').value = p.type;
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
        document.getElementById(loadingId).innerText = reply;
    }
};

// وظائف مساعدة للواجهة
function addChatMsg(text, sender) {
    const container = document.getElementById('chat-messages');
    const id = 'msg-' + Date.now();
    const align = sender === 'user' ? 'justify-end' : 'justify-start';
    const bg = sender === 'user' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800';
    container.innerHTML += `<div class="flex ${align} mb-2"><div id="${id}" class="${bg} p-3 rounded-2xl text-sm max-w-[80%] shadow-sm">${text}</div></div>`;
    container.scrollTop = container.scrollHeight;
    return id;
}

function updateUI() {
    const queryStr = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('products-container');
    const filtered = allProducts.filter(p => (p.type === 'used' || !p.type) && p.name.toLowerCase().includes(queryStr));
    container.innerHTML = '';
    filtered.forEach(p => {
        container.innerHTML += `
            <div class="group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full">
                <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center">
                    <img src="${p.img}" class="w-full h-full object-contain" onerror="this.src='https://placehold.co/400x300'">
                </div>
                <h3 class="font-bold text-lg mb-2 text-slate-800 dark:text-white line-clamp-1">${p.name}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">${p.specs}</p>
                <div class="flex justify-between items-center">
                    <span class="font-black text-brand-600 dark:text-brand-400 text-lg">${p.price}</span>
                    <a href="https://wa.me/9647777111558" target="_blank" class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><i class="fab fa-whatsapp"></i></a>
                </div>
            </div>`;
    });
}

function updateAdminList() {
    const list = document.getElementById('admin-list');
    list.innerHTML = '';
    allProducts.forEach(p => {
        list.innerHTML += `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mb-2">
                <div class="flex items-center gap-3">
                    <img src="${p.img}" class="w-10 h-10 rounded-lg object-cover bg-white" onerror="this.src='https://placehold.co/50'">
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