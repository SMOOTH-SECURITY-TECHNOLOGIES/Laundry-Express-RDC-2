import {
  User as ClientUser,
  Partner as ClientPartner,
  Order as ClientOrder,
  UserRole,
  AdminSection,
  TeamMemberRole,
  AdminPermissions,
  BackendUser, 
  BackendPartner, 
  BackendOrder
} from '../../types';

// The `constants.tsx` file is for mock data and API functions, not type definitions for other modules.


export class ResponseSanitizer {
  // FIX: Refactored to remove dependency on deprecated flags and correctly handle permissions.
  static sanitizeUser(user: BackendUser): ClientUser {
    const { 
        passwordHash,
        passwordSalt,
        ...rest
    } = user;

    const sanitizedUser: ClientUser = {
      ...rest,
    };

    return sanitizedUser;
  }

  static sanitizePartner(partner: BackendPartner): ClientPartner {
    const {
      apiKey,
      webhookUrl,
      webhookSecret,
      bankAccountDetails,
      taxId,
      commissionRate,
      internalNotes,
      ...sanitized
    } = partner;

    return sanitized as ClientPartner;
  }

  static sanitizeOrder(order: BackendOrder): ClientOrder {
      // Not currently used in mock API but good to have
      const {
        internalNotes,
        platformFee,
        ...sanitized
      } = order;
      
      return sanitized as ClientOrder;
  }

  // FIX: Added helper to convert permissions object to string array for client.
  private static convertPermissions(permissions?: AdminPermissions, role?: UserRole): AdminSection[] | undefined {
    // Superadmins have all permissions implicitly, so we don't send the array.
    if (role === 'superadmin') return undefined; 
    if (!permissions) return [];
    
    return (Object.keys(permissions) as AdminSection[]).filter(key => permissions[key]);
  }
}