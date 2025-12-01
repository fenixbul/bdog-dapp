import { 
  Home,
  BarChart3,
  GraduationCap,
  UserCircle,
  Gamepad2,
  type LucideIcon 
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export const navItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/" },
//   { label: "Analytics", icon: BarChart3, href: "/stats" },
  { label: "Academy", icon: GraduationCap, href: "/academy" },
  { label: "Account", icon: UserCircle, href: "/wallet" },
//   { label: "Play", icon: Gamepad2, href: "/dice-game" },
];

