import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
    alert("خطأ في الاتصال بقاعدة البيانات");
}

let allProducts = [];
let currentCategory = 'all';
let editingId = null;

const defaultLaptops = [
    { name: "Lenovo L13 Yoga", price: "325,000 د.ع", specs: "i5-11th Gen | 16GB RAM | 512GB NVMe | x360 Touch", category: "student", type: "used", img: "https://p1-ofp.static.pub/medias/bWFzdGVyfHJvb3R8MjEzNjQzfGltYWdlL3BuZ3xoYmIvaGFkLzE0MTEwNjI4MTUxMzI2LnBuZ3wyZDNiODQ1MjdiZTUyZDM5NjdkNGU1NDBkOGFjOTBjNDYxZDhkNDFjZjRmZjk1NzE0MWI3NWJkOGFmYmZjNDNm/lenovo-thinkpad-l13-yoga-hero.png?width=400&height=400" },
    { name: "Lenovo ThinkPad T480", price: "290,000 د.ع", specs: "i5-8th Gen | 8GB RAM | 256GB SSD | Dual Battery", category: "student", type: "used", img: "https://p1-ofp.static.pub/medias/bWFzdGVyfHJvb3R8NDk0OTN8aW1hZ2UvanBlZ3xoNDkvaDJiLzk2MTA3MDg3NzkwMzguanBnfDE5NzE4YzViY2MzMzYwMTExNmIwOTIxMjExYzYzMzViYjExNzlkMDk2N2ZhNGQ3ZjlkYjE1NzBlNTJhNzQyYmI/bWFzdGVyfH.jpg" },
    { name: "Dell Latitude 5500", price: "350,000 د.ع", specs: "i5-8th Gen vPro | 16GB RAM | 256GB SSD | 15.6 FHD", category: "student", type: "used", img: "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/latitude-15-5500/media-gallery/peripherals_laptop_latitude_5500_gallery_1.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=85,0&resMode=sharp2&op_usm=1.75,0.3,2,0&iccEmbed=0&printRes=72" },
    { name: "Lenovo ThinkPad T460", price: "225,000 د.ع", specs: "i5-6th | 8GB RAM | 256GB SSD", category: "student", type: "used", img: "https://www.lenovo.com/medias/lenovo-laptop-thinkpad-t460-hero.png?context=bWFzdGVyfHJvb3R8NTU1NDB8aW1hZ2UvcG5nfGgxMC9oZTEvOTIyOTY0ODExMDU1OC5wbmd8ZDI1MzMyZTYwN2Q2MTdhYmFiZDhhOGJlM2I5ZDY2YzI2YjZkMmI4ZWQ4ZTVlYzliYzE4MTQ0MDY5ZDM4MTNhNw" },
    { name: "Dell Precision 5530", price: "650,000 د.ع", specs: "i7-8850H | 32GB RAM | 512GB SSD | Nvidia P1000", category: "engineering", type: "used", img: "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/precision-notebooks/precision-15-5530/global-spi/ng/notebook-precision-15-5530-campaign-hero-504x350-ng.psd?fmt=jpg" }
];

const newLaptops = [
    { name: "MacBook Pro 16 M3 Max", specs: "Apple M3 Max | 36GB RAM | 1TB SSD | Liquid Retina XDR", img: "https://m.media-amazon.com/images/I/618d5bS2lUL._AC_SL1500_.jpg", category: "engineering", type: "new" },
    { name: "Dell XPS 16 9640", specs: "Ultra 7 155H | 32GB RAM | 1TB SSD | RTX 4070 | OLED Touch", img: "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-16-9640/media-gallery/touch-graphite/notebook-xps-16-9640-t-graphite-gallery-1.psd?fmt=png-alpha&wid=1280", category: "engineering", type: "new" },
    { name: "HP Spectre x360 14", specs: "Core Ultra 7 | 32GB RAM | 2TB SSD | 2.8K OLED x360", img: "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08493139.png", category: "student", type: "new" },
    { name: "Lenovo Legion 9i", specs: "i9-14900HX | 64GB RAM | 2TB SSD | RTX 4090 | Liquid Cooling", img: "https://p4-ofp.static.pub/fes/cms/2023/08/25/1k21t0f1w5w5w5w5w5w5w5w5w5w5w5345678.png", category: "gaming", type: "new" }
];

if (productsRef) {
    const q = query(productsRef, orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(allProducts.length === 0) {
            const used = defaultLaptops.map((p, i) => ({...p, id: 'local-u-'+i}));
            const brandNew = newLaptops.map((p, i) => ({...p, id: 'local-n-'+i}));
            allProducts = [...used, ...brandNew];
        }
        refreshData();
    }, (error) => {
        console.error("Firestore Error:", error);
    });
}

function refreshData() {
    updateUI();
    updateAdminList();
    renderNewProducts();
    const spinner = document.getElementById('loading-spinner');
    if(spinner) spinner.style.display = 'none';
    document.getElementById('products-container').classList.remove('hidden');
}

function renderNewProducts() {
    const container = document.getElementById('new-products-container');
    container.innerHTML = '';
    const comingSoonProducts = allProducts.filter(p => p.type === 'new');
    
    comingSoonProducts.forEach((p, index) => {
        const waMsg = `مرحباً لاب الموصل، مهتم بجهاز ${p.name} الجديد. يرجى إعلامي عند توفره.`;
        const waLink = `https://wa.me/9647777111558?text=${encodeURIComponent(waMsg)}`;
        const card = document.createElement('div');
        card.className = "group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full relative overflow-hidden";
        card.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
        
        card.innerHTML = `
            <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center overflow-hidden">
                <div class="absolute inset-0 bg-black/40 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl backdrop-blur-sm">
                    <span class="text-white font-bold tracking-wider border border-white/50 px-4 py-2 rounded-full">قريباً</span>
                </div>
                <img src="${p.img}" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 drop-shadow-xl" onerror="this.src='https://placehold.co/400x300?text=New+Laptop'">
                <div class="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-20 animate-pulse">COMING SOON</div>
            </div>
            <div class="flex-1 px-2">
                <h3 class="font-bold text-lg mb-2 leading-tight text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors line-clamp-1">${p.name}</h3>
                <div class="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 leading-relaxed min-h-[60px]">${p.specs}</div>
            </div>
            <div class="mt-auto px-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <a href="${waLink}" target="_blank" class="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center gap-2 hover:bg-brand-600 dark:hover:bg-brand-500 hover:text-white transition-all duration-300 shadow-lg">
                    <i class="far fa-bell"></i> أعلمني عند التوفر
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

// 🌐 API Fetch for Chat
async function generateAIResponse(userMsg) {
    try {
        const response = await fetch('chat-api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg })
        });
        
        const data = await response.json();
        
        if (data.reply) {
            return data.reply;
        } else {
            console.error("API Error:", data.error);
            return generateLocalResponse(userMsg);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        return generateLocalResponse(userMsg);
    }
}

function generateLocalResponse(msg) {
    const text = msg.toLowerCase();
    if (text.match(/هلا|مرحبا|سلام|شلونك|عيني/)) return "يا هلا بيك! 🌹<br>نورت متجر لاب الموصل. شلون أقدر أخدمك اليوم؟";
    if (text.match(/موقع|مكان|وين|عنوان/)) return "فرعنا بالمجموعة الثقافية، داخل شركة رؤية (فرع مطعم طماطة). 📍";
    if (text.match(/رقم|اتصال|تلفون|موبايل/)) return "تتدلل، هذا رقمنا: <b>07777111558</b> 📞";
    
    const found = allProducts.filter(p => p.name.toLowerCase().includes(text));
    if (found.length > 0) return `لقيت لك جهاز متوفر: ${found[0].name} بسعر ${found[0].price} 🔥`;
    
    return "والله يا عيني ما فهمت عليك بالضبط 😅 بس تكدر تبحث عن اسم اللابتوب اللي تريده، أو تراسلنا واتساب 07777111558";
}

function addChatMsg(html, sender) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    const id = 'msg-' + Date.now();
    div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} chat-msg ${sender === 'bot' ? 'bot' : ''}`;
    const color = sender === 'user' ? 'bg-brand-600 text-white rounded-tr-none shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm';
    div.innerHTML = `<div id="${id}" class="${color} p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed">${html}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

function updateUI() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('products-container');
    const filtered = allProducts.filter(p => {
        const isUsed = !p.type || p.type === 'used';
        const matchCat = currentCategory === 'all' || p.category === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(query) || (p.specs && p.specs.toLowerCase().includes(query));
        return isUsed && matchCat && matchSearch;
    });

    container.innerHTML = '';
    if (filtered.length === 0) {
        document.getElementById('no-results').classList.remove('hidden');
    } else {
        document.getElementById('no-results').classList.add('hidden');
        filtered.forEach((p, index) => {
            const waMsg = `السلام عليكم لاب الموصل 🌹\nحابب أطلب هذا الجهاز:\n\n💻 *${p.name}*\n⚙️ المواصفات: ${p.specs}\n💰 السعر: ${p.price}`;
            const waLink = `https://wa.me/9647777111558?text=${encodeURIComponent(waMsg)}`;
            const card = document.createElement('div');
            card.className = "group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full";
            card.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
            card.style.opacity = '0';
            
            card.innerHTML = `
                <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center overflow-hidden">
                    <img src="${p.img}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 drop-shadow-xl" onerror="this.src='https://placehold.co/400x300'">
                    <div class="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                        <span class="text-emerald-500 flex items-center gap-1"><i class="fas fa-check-circle"></i> متوفر</span>
                    </div>
                </div>
                <div class="flex-1 px-2">
                    <h3 class="font-bold text-lg mb-2 leading-tight text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors line-clamp-1">${p.name}</h3>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 leading-relaxed min-h-[60px]">${p.specs}</div>
                </div>
                <div class="mt-auto px-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                    <div>
                        <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">السعر</span>
                        <span class="font-black text-brand-600 dark:text-brand-400 text-lg">${p.price}</span>
                    </div>
                    <a href="${waLink}" target="_blank" class="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 hover:bg-brand-500 transition-all duration-300">
                        <i class="fab fa-whatsapp text-xl"></i>
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

function updateAdminList() {
    const list = document.getElementById('admin-list');
    list.innerHTML = '';
    allProducts.forEach(p => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-blue-200 transition-colors";
        const badge = p.type === 'new' ? `<span class="bg-purple-100 text-purple-600 text-[9px] px-2 py-0.5 rounded-full font-bold ml-2">جديد</span>` : `<span class="bg-blue-100 text-blue-600 text-[9px] px-2 py-0.5 rounded-full font-bold ml-2">مستعمل</span>`;
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${p.img}" class="w-10 h-10 rounded-lg object-cover bg-white" onerror="this.src='https://placehold.co/50'">
                <div>
                    <p class="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center">${p.name} ${badge}</p>
                    <p class="text-[10px] text-slate-500">${p.price}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="window.app.editProduct('${p.id}')" class="w-8 h-8 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-sm"><i class="fas fa-pencil-alt text-xs"></i></button>
                <button onclick="window.app.deleteProduct('${p.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm"><i class="fas fa-trash-alt text-xs"></i></button>
            </div>
        `;
        list.appendChild(item);
    });
}

window.app = {
    showView: (name) => {
        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.remove('active');
            setTimeout(() => { if(!el.classList.contains('active')) el.style.display = 'none'; }, 400);
        });
        const target = document.getElementById(`view-${name}`);
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 10);
        window.scrollTo(0,0);
    },
    switchStoreTab: (tab) => {
        const usedSection = document.getElementById('used-section');
        const newSection = document.getElementById('new-section');
        const btnUsed = document.getElementById('tab-used');
        const btnNew = document.getElementById('tab-new');
        if (tab === 'used') {
            usedSection.classList.remove('hidden'); newSection.classList.add('hidden');
            btnUsed.className = "px-6 sm:px-10 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-brand-600 text-white shadow-lg shadow-brand-500/30";
            btnNew.className = "px-6 sm:px-10 py-3 rounded-xl text-sm font-bold transition-all duration-300 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700";
        } else {
            usedSection.classList.add('hidden'); newSection.classList.remove('hidden');
            btnNew.className = "px-6 sm:px-10 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-lg";
            btnUsed.className = "px-6 sm:px-10 py-3 rounded-xl text-sm font-bold transition-all duration-300 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700";
        }
    },
    toggleTheme: () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    },
    filterCategory: (cat) => {
        currentCategory = cat;
        document.querySelectorAll('.cat-btn').forEach(b => {
            b.classList.remove('bg-brand-500', 'text-white', 'hover:border-brand-500');
            b.classList.add('bg-white', 'dark:bg-slate-800');
        });
        event.target.classList.remove('bg-white', 'dark:bg-slate-800');
        event.target.classList.add('bg-brand-500', 'text-white');
        updateUI();
    },
    filterProducts: updateUI,
    openAdminLogin: () => {
        document.getElementById('pin-modal').classList.remove('hidden');
        document.getElementById('login-user').focus();
    },
    checkLogin: async () => {
        const email = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            document.getElementById('pin-modal').classList.add('hidden');
            document.getElementById('admin-modal').classList.remove('hidden');
            document.getElementById('login-user').value = '';
            document.getElementById('login-pass').value = '';
        } catch (error) {
            alert("بيانات الدخول غير صحيحة أو الحساب غير موجود ❌");
        }
    },
    closeAdmin: () => {
        window.app.cancelEdit();
        document.getElementById('admin-modal').classList.add('hidden');
    },
    editProduct: (id) => {
        const product = allProducts.find(p => p.id === id);
        if (!product) return;
        document.getElementById('p-name').value = product.name;
        document.getElementById('p-price').value = product.price || '';
        document.getElementById('p-specs').value = product.specs;
        document.getElementById('p-img').value = product.img;
        document.getElementById('p-cat').value = product.category;
        document.getElementById('p-type').value = product.type || 'used';
        editingId = id;
        document.getElementById('form-title').innerText = "تعديل المنتج";
        document.getElementById('cancel-edit-btn').classList.remove('hidden');
        const btn = document.getElementById('save-btn');
        btn.innerHTML = '<span>حفظ التعديلات</span> <i class="fas fa-save"></i>';
        btn.className = "w-full mt-6 bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2";
    },
    cancelEdit: () => {
        editingId = null;
        document.getElementById('p-name').value = '';
        document.getElementById('p-price').value = '';
        document.getElementById('p-specs').value = '';
        document.getElementById('p-img').value = '';
        document.getElementById('p-type').value = 'used';
        document.getElementById('form-title').innerText = "إضافة منتج جديد";
        document.getElementById('cancel-edit-btn').classList.add('hidden');
        const btn = document.getElementById('save-btn');
        btn.innerHTML = '<span>رفع للسحابة فوراً</span> <i class="fas fa-paper-plane"></i>';
        btn.className = "w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2";
    },
    saveProduct: async () => {
        const btn = document.getElementById('save-btn');
        const name = document.getElementById('p-name').value;
        const price = document.getElementById('p-price').value;
        const specs = document.getElementById('p-specs').value;
        const img = document.getElementById('p-img').value;
        const category = document.getElementById('p-cat').value;
        const type = document.getElementById('p-type').value;

        if(!name) { alert('يرجى كتابة الاسم على الأقل!'); return; }
        btn.innerHTML = '<div class="loader border-white border-t-transparent w-6 h-6"></div>';
        
        try {
            if (editingId) {
                await updateDoc(doc(db, "products", editingId), { name, price, specs, img, category, type });
                alert("تم تحديث المنتج بنجاح! ✅");
                window.app.cancelEdit();
            } else {
                await addDoc(productsRef, { name, price, specs, img, category, type, createdAt: Date.now() });
                alert("تم الرفع بنجاح! ☁️");
                window.app.cancelEdit();
            }
        } catch (e) {
            console.error(e);
            alert("فشل العملية: " + e.message);
            btn.innerHTML = editingId ? '<span>حفظ التعديلات</span> <i class="fas fa-save"></i>' : '<span>رفع للسحابة فوراً</span> <i class="fas fa-paper-plane"></i>';
        }
    },
    uploadDefaults: async () => {
        if(!confirm("استيراد Laptops مستعملة؟")) return;
        const btn = event.currentTarget;
        btn.innerHTML = '<div class="loader w-4 h-4 border-blue-600"></div> جاري الرفع...';
        try {
            for (const p of defaultLaptops) { await addDoc(productsRef, { ...p, type: 'used', createdAt: Date.now() }); }
            alert("تم الاستيراد بنجاح! 🚀");
        } catch(e) { alert("حدث خطأ"); }
        btn.innerHTML = '<i class="fas fa-database"></i> استيراد \'المستعمل\'';
    },
    uploadNewLaptops: async () => {
        if(!confirm("استيراد أجهزة قريباً؟")) return;
        const btn = event.currentTarget;
        btn.innerHTML = '<div class="loader w-4 h-4 border-purple-600"></div> جاري الرفع...';
        try {
            for (const p of newLaptops) { await addDoc(productsRef, { ...p, price: "قريباً", type: 'new', createdAt: Date.now() }); }
            alert("تم الاستيراد بنجاح! 🔥");
        } catch(e) { alert("حدث خطأ"); }
        btn.innerHTML = '<i class="fas fa-fire"></i> استيراد \'قريباً\'';
    },
    deleteProduct: async (id) => {
        if(id.startsWith('local-')) { alert("هذا منتج افتراضي (للعرض فقط)."); return; }
        if(confirm('حذف هذا المنتج نهائياً من المتجر؟')) {
            try { await deleteDoc(doc(db, "products", id)); } catch (e) { alert("فشل الحذف"); }
        }
    },
    toggleChat: () => {
        const win = document.getElementById('chat-window');
        win.classList.toggle('hidden');
        setTimeout(() => {
            win.classList.toggle('scale-95'); win.classList.toggle('opacity-0');
            win.classList.toggle('scale-100'); win.classList.toggle('opacity-100');
        }, 10);
    },
    handleChat: async () => {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if(!msg) return;

        addChatMsg(msg, 'user');
        input.value = '';
        const loadingId = addChatMsg('<div class="flex gap-1"><div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div><div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div><div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div></div>', 'bot');

        try {
            const responseHTML = await generateAIResponse(msg);
            document.getElementById(loadingId).innerHTML = responseHTML;
        } catch (error) {
            document.getElementById(loadingId).innerHTML = "عذراً، حدث خطأ في الاتصال بالشبكة.";
        }
    }
};

window.onload = () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 800);
    }, 1500);

    const taglines = [
        { l1: "فخامة الأداء", l2: "بين يديك" },
        { l1: "قوة التكنولوجيا..", l2: "بلمسة واحدة" },
        { l1: "تجاوز حدود الهندسة..", l2: "بلا قيود" },
        { l1: "أناقة التصميم..", l2: "ووحشية الأداء" }
    ];
    let currentTagline = 0;
    const h1 = document.getElementById('hero-headline');
    const l1 = document.getElementById('hero-title-l1');
    const l2 = document.getElementById('hero-title-l2');

    if(h1) {
        setInterval(() => {
            h1.style.opacity = '0';
            h1.style.transform = 'translateY(10px)';
            setTimeout(() => {
                currentTagline = (currentTagline + 1) % taglines.length;
                l1.innerText = taglines[currentTagline].l1;
                l2.innerText = taglines[currentTagline].l2;
                h1.style.opacity = '1';
                h1.style.transform = 'translateY(0)';
            }, 500);
        }, 300000);
    }
};
