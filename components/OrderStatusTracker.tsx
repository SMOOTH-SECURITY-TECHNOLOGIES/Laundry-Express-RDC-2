import React from 'react';
import { OrderStatus } from '../types.ts';
import type { Order } from '../types.ts';
import { Icon } from './Icon.tsx';
import { useAppContext } from '../context/AppContext.tsx';

interface OrderStatusTrackerProps {
  order: Order;
}

const statusLevels = [
  OrderStatus.AWAITING_CONFIRMATION,
  OrderStatus.CONFIRMED,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKUP,
  OrderStatus.PROCESSING,
  OrderStatus.READY_FOR_DELIVERY,
  OrderStatus.DELIVERY,
  OrderStatus.COMPLETED,
];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ order }) => {
  const { t } = useAppContext();
  const isRejected = order.status === OrderStatus.REJECTED;
  const currentStatusIndex = isRejected ? -1 : statusLevels.indexOf(order.status);

  const getStatusTime = (status: OrderStatus) => {
    // Find the last entry for a given status, in case of status changes
    const historyItem = [...order.trackingHistory].reverse().find(h => h.status === status);
    return historyItem ? new Date(historyItem.time).toLocaleString('fr-FR') : '';
  };

  return (
    <div>
      <ol className="relative border-l border-gray-300 ml-4">
        {statusLevels.map((status, index) => {
          if (isRejected && index > 0) return null;
          // Hide CONFIRMED status from the user view as it's an internal step to READY_FOR_PICKUP
          if (status === OrderStatus.CONFIRMED) return null;

          const isActive = !isRejected && index <= currentStatusIndex;
          const isCurrent = !isRejected && index === currentStatusIndex;
          const isFailedStep = isRejected && index === 0;

          return (
            <li key={status} className="mb-10 ml-8">
              <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white ${
                isFailedStep ? 'bg-red-500' : isActive ? 'bg-brand-blue' : 'bg-gray-300'
              }`}>
                {isFailedStep ? (
                    <Icon name="xmark" className="w-5 h-5 text-white" />
                ) : index < currentStatusIndex ? (
                    <Icon name="check" className="w-5 h-5 text-white" />
                ) : (
                    <div className={`w-3 h-3 rounded-full ${isCurrent ? 'bg-white' : 'bg-gray-500'}`}></div>
                )}
              </span>
              <h3 className={`font-semibold ${isFailedStep ? 'text-red-600' : isActive ? 'text-brand-dark' : 'text-gray-500'}`}>
                {t(`orderStatus.${isFailedStep ? order.status : status}`)}
              </h3>
              {(isActive || isFailedStep) && (
                <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                  {getStatusTime(isFailedStep ? order.status : status)}
                </time>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
