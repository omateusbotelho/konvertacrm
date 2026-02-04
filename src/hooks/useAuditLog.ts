import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';
import { Json } from '@/integrations/supabase/types';

type ResourceType = 'contact' | 'company' | 'deal';
type AuditAction = 'view' | 'update' | 'delete';

interface AuditLogData {
  resourceType: ResourceType;
  resourceId: string;
  action: AuditAction;
  changes?: Json;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAccess = useCallback(async (data: AuditLogData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: data.action,
          resource_type: data.resourceType,
          resource_id: data.resourceId,
          changes: data.changes || null,
        });

      if (error) {
        console.error('Failed to log audit entry:', error);
      }
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }, [user]);

  const logView = useCallback((resourceType: ResourceType, resourceId: string, sensitiveFields?: string[]) => {
    return logAccess({
      resourceType,
      resourceId,
      action: 'view',
      changes: sensitiveFields ? { viewed_fields: sensitiveFields } : undefined,
    });
  }, [logAccess]);

  const logSensitiveFieldAccess = useCallback((
    resourceType: ResourceType,
    resourceId: string,
    fieldName: string
  ) => {
    return logAccess({
      resourceType,
      resourceId,
      action: 'view',
      changes: { sensitive_field_accessed: fieldName },
    });
  }, [logAccess]);

  return {
    logAccess,
    logView,
    logSensitiveFieldAccess,
  };
}
