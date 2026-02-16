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

}



let allProducts = [];

let currentCategory = 'all';

let editingId = null;



function refreshData() {

    updateUI();

    updateAdminList();

    renderNewProducts();

    renderAccessories();

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

        container.innerHTML += `

            <div class="group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden cursor-pointer">

                <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center overflow-hidden">

                    <img src="${p.img}" class="w-full h-full object-contain transform group-hover:scale-125 transition-transform duration-500 ease-in-out drop-shadow-xl" onerror="this.src='https://placehold.co/400x300'">

                    <div class="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse z-10">COMING SOON</div>

                </div>

                <h3 class="font-bold text-lg mb-2 text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors">${p.name}</h3>

                <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">${p.specs}</p>

                <a href="https://wa.me/9647777111558" target="_blank" class="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-center hover:bg-brand-600 transition-all">أعلمني عند التوفر</a>

            </div>`;

    });

}



// قسم الإكسسوارات

function renderAccessories() {

    const container = document.getElementById('accessory-products-container');

    if(!container) return;

    container.innerHTML = '';

    const accessories = allProducts.filter(p => p.type === 'accessory');

   

    accessories.forEach(p => {

        const waLink = `https://wa.me/9647777111558?text=${encodeURIComponent('حابب أطلب إكسسوار: ' + p.name)}`;

        container.innerHTML += `

            <div class="group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden cursor-pointer">

                <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center overflow-hidden">

                    <img src="${p.img}" class="w-full h-full object-contain transform group-hover:scale-125 transition-transform duration-500 ease-in-out drop-shadow-xl" onerror="this.src='https://placehold.co/400x300'">

                    <div class="absolute top-3 right-3 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10">ACCESSORY</div>

                </div>

                <h3 class="font-bold text-lg mb-2 text-slate-800 dark:text-white group-hover:text-purple-500 transition-colors">${p.name}</h3>

                <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">${p.specs}</p>

                <div class="flex justify-between items-center mt-auto">

                    <span class="font-black text-brand-600 dark:text-brand-400 text-lg">${p.price}</span>

                    <a href="${waLink}" target="_blank" class="w-10 h-10 rounded-xl bg-green-500 hover:bg-green-600 hover:scale-110 transition-all text-white flex items-center justify-center shadow-lg"><i class="fab fa-whatsapp"></i></a>

                </div>

            </div>`;

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

            const waLink = `https://wa.me/9647777111558?text=${encodeURIComponent('حابب أطلب هذا الجهاز:\n' + p.name)}`;

            container.innerHTML += `

                <div class="group bg-white dark:bg-slate-800 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">

                    <div class="relative h-56 bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-4 p-6 flex items-center justify-center overflow-hidden">

                        <img src="${p.img}" class="w-full h-full object-contain transform group-hover:scale-125 transition-transform duration-500 ease-in-out drop-shadow-xl" onerror="this.src='https://placehold.co/400x300'">

                        <div class="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 flex items-center gap-1"><i class="fas fa-check-circle"></i> متوفر</div>

                    </div>

                    <h3 class="font-bold text-lg mb-2 text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors">${p.name}</h3>

                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">${p.specs}</p>

                    <div class="flex justify-between items-center mt-auto">

                        <span class="font-black text-brand-600 dark:text-brand-400 text-lg">${p.price}</span>

                        <a href="${waLink}" target="_blank" class="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:bg-brand-500 hover:text-white hover:scale-110 transition-all shadow-lg"><i class="fab fa-whatsapp"></i></a>

                    </div>

                </div>`;

        });

    }

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

   
