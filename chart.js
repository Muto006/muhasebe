// Grafik Sayfası JavaScript Kodu

class GrafikSayfasi {
    constructor() {
        this.transactions = [];
        this.monthlyChart = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initFirebase();
    }
    
    // Firebase başlatma
    async initFirebase() {
        const checkFirebase = () => {
            if (window.firebaseService) {
                this.loadFirebaseData();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }
    
    // Firebase'den veri yükle
    async loadFirebaseData() {
        try {
            const firebaseTransactions = await window.firebaseService.loadUserData();
            this.transactions = firebaseTransactions;
            this.updateSummary();
            this.initializeChart();
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            // Hata durumunda LocalStorage'dan yükle
            this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            this.updateSummary();
            this.initializeChart();
        }
    }

    initializeElements() {
        this.totalIncomeElement = document.getElementById('totalIncome');
        this.totalExpenseElement = document.getElementById('totalExpense');
        this.totalProfitElement = document.getElementById('totalProfit');
    }

    bindEvents() {
        // Ay seçimi kaldırıldı, event listener'a gerek yok
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

    initializeChart() {
        this.updateChart();
    }

    getMonthlyData() {
        const monthlyData = {
            income: new Array(12).fill(0),
            expense: new Array(12).fill(0),
            profit: new Array(12).fill(0)
        };

        this.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const month = transactionDate.getMonth();
            if (transaction.type === 'income') {
                monthlyData.income[month] += transaction.amount;
            } else {
                monthlyData.expense[month] += transaction.amount;
            }
        });

        // Kar hesapla
        for (let i = 0; i < 12; i++) {
            monthlyData.profit[i] = monthlyData.income[i] - monthlyData.expense[i];
        }

        return monthlyData;
    }

    updateChart() {
        const monthlyData = this.getMonthlyData();
        
        const months = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        // Mevcut grafiği yok et
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        // Debug için veriyi konsola yazdır
        console.log('Monthly Data:', monthlyData);
        console.log('Profit Array:', monthlyData.profit);
        
        // Tüm ayları göster
        const chartData = monthlyData.profit;
        const chartLabels = months;
        const chartColors = monthlyData.profit.map(profit => 
            profit >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'
        );
        
        // Eğer hiç veri yoksa mesaj göster
        if (chartData.every(profit => profit === 0)) {
            this.showEmptyMessage();
            return;
        }

        // Grafiği oluştur
        this.createChart(ctx, chartData, chartLabels, chartColors);
    }

    createChart(ctx, chartData, chartLabels, chartColors) {
        this.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Aylık Kar/Zarar',
                        data: chartData,
                        backgroundColor: chartColors,
                        borderColor: chartColors.map(color => color.replace('0.8', '1')),
                        borderWidth: 2,
                        borderRadius: 4,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Tüm Aylar Kar/Zarar Grafiği',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const profit = context.parsed.y;
                                const month = context.label;
                                
                                return [
                                    `Ay: ${month}`,
                                    `Kar/Zarar: ${new Intl.NumberFormat('tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY',
                                        minimumFractionDigits: 2
                                    }).format(profit)}`,
                                    profit >= 0 ? '✅ Kar' : '❌ Zarar'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('tr-TR', {
                                    style: 'currency',
                                    currency: 'TRY',
                                    minimumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount);
    }

    showEmptyMessage() {
        const chartContainer = document.querySelector('.chart-container');
        
        chartContainer.innerHTML = `
            <div class="empty-chart-message">
                <i class="fas fa-chart-bar"></i>
                <h3>Henüz veri bulunamadı</h3>
                <p>Henüz hiçbir ayda kayıt bulunmuyor. Ana sayfaya dönerek yeni kayıtlar ekleyebilirsiniz.</p>
                <a href="index.html" class="btn-back">
                    <i class="fas fa-arrow-left"></i> Ana Sayfaya Dön
                </a>
            </div>
        `;
    }
}

// Sayfa yüklendiğinde grafik sayfasını başlat
document.addEventListener('DOMContentLoaded', () => {
    new GrafikSayfasi();
}); 
