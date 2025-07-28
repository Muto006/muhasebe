// Muhasebe Sistemi JavaScript Kodu

class MuhasebeSistemi {
    constructor() {
        this.transactions = [];
        this.currentFilter = 'all';
        this.currentMonthFilter = 'all';
        this.searchTerm = '';
        this.editingId = null; // Düzenlenen kaydın ID'si
        
        // DOM yüklendikten sonra başlat
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            this.init();
        }
    }
    
    init() {
        if (this.initializeElements()) {
            this.bindEvents();
            this.setDefaultDate();
            this.initFirebase();
        } else {
            console.error('Uygulama başlatılamadı!');
        }
    }

    initializeElements() {
        // Elementleri güvenli şekilde al
        this.form = document.getElementById('transactionForm');
        this.typeSelect = document.getElementById('type');
        this.amountInput = document.getElementById('amount');
        this.descriptionInput = document.getElementById('description');
        this.dateInput = document.getElementById('date');
        this.filterSelect = document.getElementById('filterType');
        this.filterMonthSelect = document.getElementById('filterMonth');
        this.searchInput = document.getElementById('searchInput');
        this.transactionsBody = document.getElementById('transactionsBody');
        this.totalIncomeElement = document.getElementById('totalIncome');
        this.totalExpenseElement = document.getElementById('totalExpense');
        this.totalProfitElement = document.getElementById('totalProfit');
        
        // Modal elementleri
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.editTypeSelect = document.getElementById('editType');
        this.editAmountInput = document.getElementById('editAmount');
        this.editDescriptionInput = document.getElementById('editDescription');
        this.editDateInput = document.getElementById('editDate');
        
        // Elementlerin varlığını kontrol et
        if (!this.form || !this.typeSelect || !this.amountInput || !this.descriptionInput || 
            !this.dateInput || !this.filterSelect || !this.filterMonthSelect || !this.searchInput || 
            !this.transactionsBody || !this.totalIncomeElement || !this.totalExpenseElement || 
            !this.totalProfitElement || !this.editModal || !this.editForm || !this.editTypeSelect || 
            !this.editAmountInput || !this.editDescriptionInput || !this.editDateInput) {
            console.error('Bazı HTML elementleri bulunamadı!');
            return false;
        }
        return true;
    }

    bindEvents() {
        // Elementlerin varlığını kontrol et
        if (!this.form || !this.filterSelect || !this.filterMonthSelect || !this.searchInput || 
            !this.editForm || !this.editModal) {
            console.error('Event binding için gerekli elementler bulunamadı!');
            return;
        }
        
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.filterSelect.addEventListener('change', (e) => this.handleFilterChange(e));
        this.filterMonthSelect.addEventListener('change', (e) => this.handleMonthFilterChange(e));
        this.searchInput.addEventListener('input', (e) => this.handleSearchChange(e));
        this.editForm.addEventListener('submit', (e) => this.handleEditFormSubmit(e));
        
        // Modal dışına tıklandığında kapat
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
        
        // Sayfa görünür olduğunda veri yükle
        window.addEventListener('pageshow', () => this.onPageShow());
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.value = today;
    }

    // Firebase başlatma
    initFirebase() {
        const checkFirebase = () => {
            if (window.firebaseService) {
                this.loadFirebaseData();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }
    
    // Sayfa görünür olduğunda veri yükle
    onPageShow() {
        // Sadece Firebase varsa ve veri yoksa yükle
        if (window.firebaseService && this.transactions.length === 0) {
            this.loadFirebaseData();
        }
    }

    // Firebase'den veri yükle
    async loadFirebaseData() {
        try {
            const firebaseTransactions = await window.firebaseService.loadUserData();
            // Sadece veri yoksa veya Firebase'den gelen veri daha güncel ise güncelle
            if (this.transactions.length === 0 || firebaseTransactions.length > this.transactions.length) {
                this.transactions = firebaseTransactions;
                this.updateSummary();
                this.renderTransactions();
                console.log('Firebase\'den veri yüklendi:', firebaseTransactions.length, 'kayıt');
            }
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            // Hata durumunda mevcut verileri koru
            if (this.transactions.length === 0) {
                this.updateSummary();
                this.renderTransactions();
            }
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Form verilerini kontrol et
        const amount = parseFloat(this.amountInput.value);
        const description = this.descriptionInput.value.trim();
        
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Lütfen geçerli bir tutar girin!', 'error');
            return;
        }
        
        if (!description) {
            this.showNotification('Lütfen detay açıklaması girin!', 'error');
            return;
        }
        
        const transaction = {
            type: this.typeSelect.value,
            amount: amount,
            description: description,
            date: this.dateInput.value,
            createdAt: new Date().toISOString()
        };

        try {
            await this.addTransaction(transaction);
            this.form.reset();
            this.setDefaultDate();
            this.showNotification('Kayıt başarıyla eklendi!', 'success');
        } catch (error) {
            console.error('Kayıt ekleme hatası:', error);
            this.showNotification('Kayıt ekleme hatası!', 'error');
        }
    }

    async addTransaction(transaction) {
        if (window.firebaseService && window.firebaseService.isAuthenticated()) {
            await window.firebaseService.addTransaction(transaction);
        } else {
            // Fallback: LocalStorage'a kaydet
            transaction.id = Date.now();
            this.transactions.unshift(transaction);
            this.saveToLocalStorage();
        }
        this.updateSummary();
        this.renderTransactions();
    }

    async deleteTransaction(id) {
        if (confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
            try {
                if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                    await window.firebaseService.deleteTransaction(id);
                } else {
                    // Fallback: LocalStorage'dan sil
                    this.transactions = this.transactions.filter(t => t.id !== id);
                    this.saveToLocalStorage();
                }
                this.updateSummary();
                this.renderTransactions();
                this.showNotification('Kayıt silindi!', 'info');
            } catch (error) {
                console.error('Silme hatası:', error);
                this.showNotification('Silme hatası!', 'error');
            }
        }
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        // Düzenlenen kaydın ID'sini sakla
        this.editingId = id;

        // Modal form alanlarını doldur
        this.editTypeSelect.value = transaction.type;
        this.editAmountInput.value = transaction.amount;
        this.editDescriptionInput.value = transaction.description;
        this.editDateInput.value = transaction.date;

        // Modal'ı göster
        this.editModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Sayfa kaydırmayı engelle
    }

    closeEditModal() {
        this.editModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Sayfa kaydırmayı geri aç
        this.editingId = null;
        
        // Form alanlarını temizle
        this.editForm.reset();
    }

    async handleEditFormSubmit(e) {
        e.preventDefault();
        
        // Form verilerini kontrol et
        const amount = parseFloat(this.editAmountInput.value);
        const description = this.editDescriptionInput.value.trim();
        
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Lütfen geçerli bir tutar girin!', 'error');
            return;
        }
        
        if (!description) {
            this.showNotification('Lütfen detay açıklaması girin!', 'error');
            return;
        }

        const updatedTransaction = {
            type: this.editTypeSelect.value,
            amount: amount,
            description: description,
            date: this.editDateInput.value,
            updatedAt: new Date().toISOString()
        };

        try {
            if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                await window.firebaseService.updateTransaction(this.editingId, updatedTransaction);
            } else {
                // Fallback: LocalStorage'da güncelle
                const index = this.transactions.findIndex(t => t.id === this.editingId);
                if (index !== -1) {
                    this.transactions[index] = { ...this.transactions[index], ...updatedTransaction };
                    this.saveToLocalStorage();
                }
            }
            
            this.updateSummary();
            this.renderTransactions();
            this.closeEditModal();
            this.showNotification('Kayıt başarıyla güncellendi!', 'success');
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            this.showNotification('Güncelleme hatası!', 'error');
        }
    }

    resetForm() {
        this.form.reset();
        this.setDefaultDate();
    }

    handleFilterChange(e) {
        this.currentFilter = e.target.value;
        this.renderTransactions();
    }

    handleMonthFilterChange(e) {
        this.currentMonthFilter = e.target.value;
        this.renderTransactions();
    }



    handleSearchChange(e) {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderTransactions();
    }

    getFilteredTransactions() {
        let filtered = this.transactions;

        // Tür filtresi
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(t => t.type === this.currentFilter);
        }

        // Ay filtresi
        if (this.currentMonthFilter !== 'all') {
            const selectedMonth = parseInt(this.currentMonthFilter);
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === selectedMonth;
            });
        }

        // Arama filtresi
        if (this.searchTerm) {
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(this.searchTerm) ||
                t.amount.toString().includes(this.searchTerm)
            );
        }

        return filtered;
    }

    updateSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (isNaN(t.amount) ? 0 : t.amount), 0);

        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (isNaN(t.amount) ? 0 : t.amount), 0);

        const profit = income - expense;

        this.totalIncomeElement.textContent = this.formatCurrency(income);
        this.totalExpenseElement.textContent = this.formatCurrency(expense);
        this.totalProfitElement.textContent = this.formatCurrency(profit);

        // Kar durumuna göre renk değiştir
        this.totalProfitElement.className = profit >= 0 ? 'positive' : 'negative';
    }

    renderTransactions() {
        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            this.transactionsBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Henüz kayıt bulunmuyor.</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.transactionsBody.innerHTML = filteredTransactions.map(transaction => {
            // NaN kontrolü
            const amount = isNaN(transaction.amount) ? 0 : transaction.amount;
            const description = transaction.description || 'Açıklama yok';
            
            return `
                <tr class="new-entry">
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>
                        <span class="transaction-type type-${transaction.type}">
                            ${transaction.type === 'income' ? 'Gelen' : 'Giden'}
                        </span>
                    </td>
                    <td>${this.escapeHtml(description)}</td>
                    <td class="amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(amount)}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="muhasebe.editTransaction(${transaction.id})">
                                <i class="fas fa-edit"></i> Düzenle
                            </button>
                            <button class="btn-delete" onclick="muhasebe.deleteTransaction(${transaction.id})">
                                <i class="fas fa-trash"></i> Sil
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }



    showNotification(message, type = 'info') {
        // Mevcut notification'ı kaldır
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Yeni notification oluştur
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // CSS stilleri ekle
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        notification.querySelector('button').style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            margin-left: auto;
        `;

        // CSS animasyonu ekle
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // 5 saniye sonra otomatik kaldır
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Veri dışa aktarma fonksiyonu
    exportData() {
        const data = {
            transactions: this.transactions,
            summary: {
                totalIncome: this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                totalExpense: this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
                totalProfit: this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - 
                            this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
            },
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `muhasebe-verileri-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Veriler başarıyla dışa aktarıldı!', 'success');
    }

    // Veri içe aktarma fonksiyonu
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.transactions && Array.isArray(data.transactions)) {
                    this.transactions = data.transactions;
                    this.saveToLocalStorage();
                    this.updateSummary();
                    this.renderTransactions();
                    this.populateYearSelect(); // Yıl seçeneklerini güncelle
                    this.showNotification('Veriler başarıyla içe aktarıldı!', 'success');
                } else {
                    throw new Error('Geçersiz veri formatı');
                }
            } catch (error) {
                this.showNotification('Veri içe aktarma hatası: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Global değişken
let muhasebe;

// Klavye kısayolları
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                if (muhasebe) muhasebe.exportData();
                break;
            case 'n':
                e.preventDefault();
                if (muhasebe) muhasebe.resetForm();
                break;
        }
    }
});

// Dosya yükleme için gizli input oluştur
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.style.display = 'none';
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        muhasebe.importData(e.target.files[0]);
    }
});
document.body.appendChild(fileInput);

// Global fonksiyonlar (HTML'den erişim için)
window.exportData = () => muhasebe.exportData();
window.importData = () => fileInput.click();

// Uygulamayı başlat
window.muhasebe = new MuhasebeSistemi(); 