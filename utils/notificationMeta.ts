import { NotificationType } from '../types';

/**
 * Visual metadata for each notification type:
 * - icon: Icon name from the Icon component
 * - color: Tailwind text color class
 * - bgColor: Tailwind background color class
 * - label: Human-readable French label
 */
export const NOTIFICATION_META: Record<NotificationType, {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}> = {
  [NotificationType.NEW_ORDER]: {
    icon: 'shoppingBag',
    color: 'text-[#0077B6]',
    bgColor: 'bg-blue-50',
    label: 'Nouvelle commande',
  },
  [NotificationType.ORDER_STATUS_CHANGE]: {
    icon: 'arrow-path',
    color: 'text-[#FF7A00]',
    bgColor: 'bg-orange-50',
    label: 'Statut commande',
  },
  [NotificationType.NEW_CHAT_MESSAGE]: {
    icon: 'chatBubble',
    color: 'text-[#22C55E]',
    bgColor: 'bg-green-50',
    label: 'Nouveau message',
  },
  [NotificationType.PROMOTIONS]: {
    icon: 'gift',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Promotion',
  },
  [NotificationType.GENERAL]: {
    icon: 'bell',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'Information',
  },
};
