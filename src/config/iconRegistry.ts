// ─── Icon Registry ────────────────────────────────────────────────────────────
// Maps string keys (used in nodes.json) to lucide-react components.
// To add a new icon: import it here and add an entry to ICON_REGISTRY.

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  FileCheck,
  Handshake,
  Heart,
  Home,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export const ICON_REGISTRY: Record<string, React.ComponentType<LucideProps>> = {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  FileCheck,
  Handshake,
  Heart,
  Home,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  XCircle,
};
