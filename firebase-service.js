// Firebase Veri Servisi - Modern SDK
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

class FirebaseService {
    constructor() {
        this.db = window.firebaseServices.db;
        this.auth = window.firebaseServices.auth;
        this.currentUser = null;
        this.initAuth();
    }

    // Authentication başlatma - Anonim giriş
    async initAuth() {
        // Anonim giriş yap (kullanıcı fark etmez)
        try {
            await signInAnonymously(this.auth);
        } catch (error) {
            console.error('Anonim giriş hatası:', error);
        }

        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            if (user) {
                console.log('Anonim kullanıcı giriş yaptı');
                this.loadUserData();
            } else {
                console.log('Kullanıcı çıkış yaptı');
                this.clearLocalData();
            }
        });
    }

    // Google ile giriş
    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, window.firebaseServices.googleProvider);
            return result.user;
        } catch (error) {
            console.error('Google giriş hatası:', error);
            throw error;
        }
    }

    // Çıkış yap
    async signOut() {
        try {
            await signOut(this.auth);
            this.currentUser = null;
        } catch (error) {
            console.error('Çıkış hatası:', error);
            throw error;
        }
    }

    // Kullanıcı verilerini yükle
    async loadUserData() {
        if (!this.currentUser) return [];

        try {
            const transactionsRef = collection(this.db, 'users', this.currentUser.uid, 'transactions');
            const q = query(transactionsRef, orderBy('date', 'desc'));
            const snapshot = await getDocs(q);

            const transactions = [];
            snapshot.forEach(doc => {
                transactions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // LocalStorage'a kaydet (offline için)
            localStorage.setItem('transactions', JSON.stringify(transactions));
            return transactions;
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            // Offline durumda localStorage'dan yükle
            return JSON.parse(localStorage.getItem('transactions') || '[]');
        }
    }

    // İşlem ekle
    async addTransaction(transaction) {
        if (!this.currentUser) {
            throw new Error('Kullanıcı giriş yapmamış');
        }

        try {
            const transactionsRef = collection(this.db, 'users', this.currentUser.uid, 'transactions');
            const docRef = await addDoc(transactionsRef, {
                ...transaction,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // LocalStorage'a ekle
            const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            localTransactions.unshift({
                id: docRef.id,
                ...transaction
            });
            localStorage.setItem('transactions', JSON.stringify(localTransactions));

            return docRef.id;
        } catch (error) {
            console.error('İşlem ekleme hatası:', error);
            throw error;
        }
    }

    // İşlem güncelle
    async updateTransaction(id, transaction) {
        if (!this.currentUser) {
            throw new Error('Kullanıcı giriş yapmamış');
        }

        try {
            const transactionRef = doc(this.db, 'users', this.currentUser.uid, 'transactions', id);
            await updateDoc(transactionRef, {
                ...transaction,
                updatedAt: serverTimestamp()
            });

            // LocalStorage'ı güncelle
            const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            const index = localTransactions.findIndex(t => t.id === id);
            if (index !== -1) {
                localTransactions[index] = { ...localTransactions[index], ...transaction };
                localStorage.setItem('transactions', JSON.stringify(localTransactions));
            }

            return true;
        } catch (error) {
            console.error('İşlem güncelleme hatası:', error);
            throw error;
        }
    }

    // İşlem sil
    async deleteTransaction(id) {
        if (!this.currentUser) {
            throw new Error('Kullanıcı giriş yapmamış');
        }

        try {
            const transactionRef = doc(this.db, 'users', this.currentUser.uid, 'transactions', id);
            await deleteDoc(transactionRef);

            // LocalStorage'dan sil
            const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            const filteredTransactions = localTransactions.filter(t => t.id !== id);
            localStorage.setItem('transactions', JSON.stringify(filteredTransactions));

            return true;
        } catch (error) {
            console.error('İşlem silme hatası:', error);
            throw error;
        }
    }

    // Verileri senkronize et
    async syncData() {
        if (!this.currentUser) return;

        try {
            const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            const cloudTransactions = await this.loadUserData();

            // Cloud'daki verileri localStorage'a yaz
            localStorage.setItem('transactions', JSON.stringify(cloudTransactions));
            
            return cloudTransactions;
        } catch (error) {
            console.error('Senkronizasyon hatası:', error);
            throw error;
        }
    }

    // LocalStorage verilerini temizle
    clearLocalData() {
        localStorage.removeItem('transactions');
    }

    // Kullanıcı durumunu kontrol et
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Mevcut kullanıcıyı al
    getCurrentUser() {
        return this.currentUser;
    }
}

// Global servis instance'ı oluştur
window.firebaseService = new FirebaseService(); 
