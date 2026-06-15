import { useCallback, useMemo, useState } from 'react';
import { Service, ServiceItem } from '../types';
import { shopLineTotal, shopLinesToServiceItems } from '../utils/partner-catalog-mappers';

export type PartnerCartLine = {
  service: Service;
  quantity: number;
  weight?: number;
};

export const usePartnerServiceCart = () => {
  const [lines, setLines] = useState<PartnerCartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addService = useCallback((service: Service, amount = 1) => {
    setLines((prev) => {
      const index = prev.findIndex((line) => line.service.id === service.id);
      if (service.priceModel === 'per_kg') {
        if (index >= 0) {
          return prev.map((line, i) => (
            i === index
              ? { ...line, weight: (line.weight || 1) + amount }
              : line
          ));
        }
        return [...prev, { service, quantity: 1, weight: amount }];
      }
      if (index >= 0) {
        return prev.map((line, i) => (
          i === index ? { ...line, quantity: line.quantity + amount } : line
        ));
      }
      return [...prev, { service, quantity: amount }];
    });
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((serviceId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((line) => line.service.id !== serviceId);
      return prev.map((line) => (
        line.service.id === serviceId ? { ...line, quantity } : line
      ));
    });
  }, []);

  const updateWeight = useCallback((serviceId: string, weight: number) => {
    setLines((prev) => {
      if (weight <= 0) return prev.filter((line) => line.service.id !== serviceId);
      return prev.map((line) => (
        line.service.id === serviceId ? { ...line, weight } : line
      ));
    });
  }, []);

  const removeLine = useCallback((serviceId: string) => {
    setLines((prev) => prev.filter((line) => line.service.id !== serviceId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
    setIsOpen(false);
  }, []);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => (
      line.service.priceModel === 'per_kg'
        ? sum + 1
        : sum + line.quantity
    ), 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + shopLineTotal(line.service, line.quantity, line.weight), 0),
    [lines],
  );

  const serviceItems: ServiceItem[] = useMemo(
    () => shopLinesToServiceItems(lines),
    [lines],
  );

  return {
    lines,
    isOpen,
    setIsOpen,
    addService,
    updateQuantity,
    updateWeight,
    removeLine,
    clearCart,
    itemCount,
    subtotal,
    serviceItems,
  };
};
