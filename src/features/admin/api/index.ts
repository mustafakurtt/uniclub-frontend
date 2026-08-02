// Admin API yüzeyi — /api/admin (docs/FRONTEND_YONETIM.md §5).
// Dosyalar dokümanın bölümlemesiyle aynı sırada; buradan toplu import edilir.
export * from "./universities"; // §2 yönetim kapsamındaki üniversiteler
export * from "./dashboard"; // tenant panel özeti
export * from "./users"; // §5.1 kullanıcılar
export * from "./applications"; // §5.2 kulüp kurma başvuruları
export * from "./formationProposals"; // §5.2 kuruluş önerileri (T1.1)
export * from "./clubs"; // §5.3 kulüp durum/profil/silme
export * from "./advisors"; // §5.4 danışmanlar
export * from "./moderation"; // §5.5 üye & içerik moderasyonu
export * from "./approvalCommittees"; // onay kurulları + kurul oyu
