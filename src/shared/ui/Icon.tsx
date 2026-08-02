import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Pencil, Trash2, X, Check, Plus, Clock, Archive,
  Landmark, Building2, Target, GraduationCap, BookOpen, Megaphone, Users,
  UserCog, Image, Link2, User, Hash, Calendar, Mail, Inbox,
  House, Compass, Search, SearchX, ArrowRight, ArrowLeft, ChevronRight, ChevronDown, LogOut,
  Ticket, Wrench, Crown, Globe, Lock, Settings,
  MessageCircle, Camera, Gamepad2, Send, AtSign,
  Rocket, Sparkles, PartyPopper, Hand, Handshake, Bell, Frown, RadioTower, Sprout, Palette,
  Music, Bot, Drama, Volleyball, Brain, BookText, Leaf, Mic, FlaskConical,
  Eye, EyeOff, Flame, Trophy, Star, ScrollText, ShieldCheck, Pin,
} from "lucide-react";

/**
 * Merkezi ikon kayıt defteri (core). Uygulamadaki TÜM ikonlar buradan gelir —
 * hiçbir sayfa/bileşen doğrudan `lucide-react`'ten import etmez, hiçbir yerde
 * emoji kullanılmaz. Yeni bir ikon gerektiğinde yalnızca bu tabloya bir satır
 * eklenir; görünüm tek noktadan (stroke, boyut, tema rengi) yönetilir.
 *
 * Anahtarlar uygulama sözlüğüdür (semantik), lucide bileşen adları değil —
 * böylece ikon setini değiştirmek istersek sadece sağ taraf güncellenir.
 */
export const ICONS = {
  // Aksiyonlar
  edit: Pencil,
  delete: Trash2,
  close: X,
  check: Check,
  reject: X,
  add: Plus,

  // Durum
  pending: Clock,
  archive: Archive,

  // Varlıklar
  university: Landmark,
  campus: Building2,
  club: Target,
  faculty: GraduationCap,
  department: BookOpen,
  announcement: Megaphone,
  members: Users,
  advisor: UserCog,
  gallery: Image,
  link: Link2,
  profile: User,
  role: GraduationCap,
  audit: ScrollText,
  moderation: ShieldCheck,
  studentNumber: Hash,
  calendar: Calendar,
  email: Mail,
  inbox: Inbox,

  // Navigasyon
  home: House,
  explore: Compass,
  search: Search,
  notFound: SearchX,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  logout: LogOut,

  // Kulüp rolleri & katılım politikası
  member: Ticket,
  officer: Wrench,
  president: Crown,
  policyOpen: Globe,
  policyApproval: Lock,
  settings: Settings,

  // İletişim platformları
  whatsapp: MessageCircle,
  instagram: Camera,
  discord: Gamepad2,
  telegram: Send,
  twitter: AtSign,
  website: Globe,
  globe: Globe,

  // Pazarlama / durum figürleri
  rocket: Rocket,
  sparkles: Sparkles,
  party: PartyPopper,
  wave: Hand,
  handshake: Handshake,
  bell: Bell,
  lock: Lock,
  error: Frown,
  offline: RadioTower,
  seedling: Sprout,
  palette: Palette,

  // Oyunlaştırma & form yardımcıları
  eye: Eye,
  eyeOff: EyeOff,
  flame: Flame,
  trophy: Trophy,
  star: Star,
  pin: Pin,

  // Landing kategori etiketleri
  music: Music,
  robotics: Bot,
  theatre: Drama,
  sports: Volleyball,
  photography: Camera,
  scan: Camera,
  ai: Brain,
  erasmus: Globe,
  literature: BookText,
  esports: Gamepad2,
  arts: Palette,
  entrepreneurship: Rocket,
  environment: Leaf,
  debate: Mic,
  science: FlaskConical,
  dance: PartyPopper,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
}

/**
 * Tek ikon. Boyut `size` (px) veya className (w-/h- utility) ile; renk `currentColor`
 * üzerinden (metin rengini takip eder). Varsayılan olarak dekoratiftir
 * (`aria-hidden`); anlam taşıyan ikonlarda `aria-label` geçin ve aria-hidden'ı
 * ezin ya da yanına metin koyun.
 */
export function Icon({ name, size = 20, strokeWidth = 2, "aria-hidden": ariaHidden, ...props }: IconProps) {
  const Cmp = ICONS[name];
  const decorative = ariaHidden ?? props["aria-label"] === undefined;
  return <Cmp size={size} strokeWidth={strokeWidth} aria-hidden={decorative} {...props} />;
}
