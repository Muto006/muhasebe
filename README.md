# 📊 Muhasebe Sistemi

Modern, responsive ve Firebase entegreli muhasebe takip sistemi.

## 🚀 Özellikler

- ✅ **Gelir/Gider Takibi**: Detaylı finansal kayıtlar
- 📈 **Grafik Analizi**: Aylık kar/zarar grafikleri
- 📱 **Mobil Uyumlu**: Tüm cihazlarda mükemmel çalışır
- 🔥 **Firebase Entegrasyonu**: Gerçek zamanlı veri senkronizasyonu
- 👤 **Kullanıcı Girişi**: Google ile güvenli giriş
- 💾 **Offline Desteği**: İnternet olmadan da çalışır
- 📊 **Filtreleme**: Tür ve ay bazlı filtreleme
- 📤 **Veri Export/Import**: JSON formatında veri aktarımı

## 🔧 Firebase Kurulumu

### 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. "Yeni Proje Oluştur" butonuna tıklayın
3. Proje adını girin (örn: "muhasebe-sistemi")
4. Google Analytics'i etkinleştirin (opsiyonel)
5. "Proje Oluştur" butonuna tıklayın

### 2. Web Uygulaması Ekleme

1. Firebase Console'da projenizi seçin
2. "Web" simgesine tıklayın
3. Uygulama takma adı girin (örn: "muhasebe-web")
4. "Uygulama Kaydet" butonuna tıklayın
5. Firebase konfigürasyon kodunu kopyalayın

### 3. Konfigürasyon Dosyasını Güncelleme

`firebase-config.js` dosyasını açın ve Firebase Console'dan aldığınız bilgilerle güncelleyin:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Firestore Veritabanı Kurulumu

1. Firebase Console'da "Firestore Database"e gidin
2. "Veritabanı oluştur" butonuna tıklayın
3. "Test modunda başlat" seçeneğini seçin
4. Bölge seçin (örn: "europe-west3")
5. "Bitti" butonuna tıklayın

### 5. Authentication Kurulumu

1. Firebase Console'da "Authentication"e gidin
2. "Sign-in method" sekmesine tıklayın
3. "Google" sağlayıcısını etkinleştirin
4. Proje destek e-postası seçin
5. "Kaydet" butonuna tıklayın

### 6. Güvenlik Kuralları

Firestore Database > Rules sekmesinde aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/transactions/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📁 Dosya Yapısı

```
muhasebe-sistemi/
├── index.html          # Ana sayfa
├── chart.html          # Grafik sayfası
├── style.css           # Stil dosyası
├── script.js           # Ana JavaScript
├── chart.js            # Grafik JavaScript
├── firebase-config.js  # Firebase konfigürasyonu
├── firebase-service.js # Firebase servis sınıfı
└── README.md           # Bu dosya
```

## 🚀 Kullanım

### Yerel Geliştirme

1. Dosyaları bilgisayarınıza indirin
2. Firebase konfigürasyonunu güncelleyin
3. `index.html` dosyasını tarayıcıda açın
4. Google ile giriş yapın
5. Muhasebe kayıtlarınızı yönetmeye başlayın

### GitHub Pages Deployment

1. GitHub'da yeni bir repository oluşturun
2. Dosyaları repository'ye yükleyin
3. Settings > Pages bölümüne gidin
4. Source olarak "main" branch'ini seçin
5. Siteniz yayınlanacak!

## 🔐 Güvenlik

- ✅ Kullanıcı bazlı veri erişimi
- ✅ Google Authentication
- ✅ Firestore güvenlik kuralları
- ✅ HTTPS zorunluluğu

## 📱 Mobil Özellikler

- ✅ Responsive tasarım
- ✅ Touch-friendly butonlar
- ✅ Mobil optimizasyon
- ✅ PWA desteği (gelecek)

## 🔄 Veri Senkronizasyonu

- ✅ Gerçek zamanlı güncelleme
- ✅ Offline desteği
- ✅ Otomatik senkronizasyon
- ✅ Çoklu cihaz desteği

## 🛠️ Teknolojiler

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Deployment**: GitHub Pages

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Firebase Console'da hata mesajlarını kontrol edin
2. Tarayıcı konsolunu kontrol edin (F12)
3. Network bağlantınızı kontrol edin

## 🔄 Güncellemeler

- **v1.0**: Temel muhasebe sistemi
- **v1.1**: Grafik analizi eklendi
- **v1.2**: Firebase entegrasyonu
- **v1.3**: Mobil optimizasyon

---

**Not**: Bu proje eğitim amaçlıdır. Gerçek muhasebe işlemleri için profesyonel yazılımlar kullanmanızı öneririz. 