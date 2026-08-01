// Domain tipleri — kaynak: docs/FRONTEND_AUTH_RBAC.md, docs/FRONTEND_YONETIM.md,
// docs/FRONTEND_CLUBS.md. Backend'in döndüğü şekillerle birebir eşleşir; UI'a özgü
// türetilmiş tipler burada değil, kullanıldıkları yerde tanımlanır.
//
// Bu dosya yalnızca barrel'dır — `@/shared/types` tek giriş noktası olarak kalır.
// Yeni tip eklerken ilgili domain dosyasına yaz.
export type * from "./common"; // API zarfı
export type * from "./user"; // kullanıcı + global rol (Katman A)
export type * from "./university"; // tenant hiyerarşisi
export type * from "./club"; // kulüp + kulüp içi rol (Katman B)
export type * from "./activity"; // etkinlikler + RSVP
export type * from "./rbac"; // yetkiler + yönetim görünümleri
export type * from "./notification"; // gerçek zamanlı bildirimler (WS + REST)
export type * from "./posterQr"; // afiş QR
export type * from "./public"; // kamuya açık DTO
