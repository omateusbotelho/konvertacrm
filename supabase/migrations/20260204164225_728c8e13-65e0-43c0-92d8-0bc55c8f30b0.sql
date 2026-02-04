-- Create function to audit sensitive data changes
CREATE OR REPLACE FUNCTION audit_sensitive_data_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sensitive_fields jsonb := '{}';
  old_values jsonb := '{}';
  new_values jsonb := '{}';
  has_changes boolean := false;
BEGIN
  -- For contacts table
  IF TG_TABLE_NAME = 'contacts' THEN
    IF TG_OP = 'UPDATE' THEN
      -- Check each sensitive field for changes
      IF OLD.email IS DISTINCT FROM NEW.email THEN
        old_values := old_values || jsonb_build_object('email', OLD.email);
        new_values := new_values || jsonb_build_object('email', NEW.email);
        has_changes := true;
      END IF;
      IF OLD.phone IS DISTINCT FROM NEW.phone THEN
        old_values := old_values || jsonb_build_object('phone', OLD.phone);
        new_values := new_values || jsonb_build_object('phone', NEW.phone);
        has_changes := true;
      END IF;
      IF OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url THEN
        old_values := old_values || jsonb_build_object('linkedin_url', OLD.linkedin_url);
        new_values := new_values || jsonb_build_object('linkedin_url', NEW.linkedin_url);
        has_changes := true;
      END IF;
      
      IF has_changes THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
        VALUES (
          auth.uid(),
          'update',
          'contact',
          NEW.id,
          jsonb_build_object('old', old_values, 'new', new_values)
        );
      END IF;
      RETURN NEW;
      
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
      VALUES (
        auth.uid(),
        'delete',
        'contact',
        OLD.id,
        jsonb_build_object(
          'deleted_data',
          jsonb_build_object(
            'full_name', OLD.full_name,
            'email', OLD.email,
            'phone', OLD.phone
          )
        )
      );
      RETURN OLD;
    END IF;
  END IF;

  -- For companies table
  IF TG_TABLE_NAME = 'companies' THEN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.cnpj IS DISTINCT FROM NEW.cnpj THEN
        old_values := old_values || jsonb_build_object('cnpj', OLD.cnpj);
        new_values := new_values || jsonb_build_object('cnpj', NEW.cnpj);
        has_changes := true;
      END IF;
      
      IF has_changes THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
        VALUES (
          auth.uid(),
          'update',
          'company',
          NEW.id,
          jsonb_build_object('old', old_values, 'new', new_values)
        );
      END IF;
      RETURN NEW;
      
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
      VALUES (
        auth.uid(),
        'delete',
        'company',
        OLD.id,
        jsonb_build_object(
          'deleted_data',
          jsonb_build_object(
            'name', OLD.name,
            'cnpj', OLD.cnpj
          )
        )
      );
      RETURN OLD;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for contacts table
DROP TRIGGER IF EXISTS audit_contacts_sensitive_update ON contacts;
CREATE TRIGGER audit_contacts_sensitive_update
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_data_change();

DROP TRIGGER IF EXISTS audit_contacts_sensitive_delete ON contacts;
CREATE TRIGGER audit_contacts_sensitive_delete
  BEFORE DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_data_change();

-- Create triggers for companies table
DROP TRIGGER IF EXISTS audit_companies_sensitive_update ON companies;
CREATE TRIGGER audit_companies_sensitive_update
  AFTER UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_data_change();

DROP TRIGGER IF EXISTS audit_companies_sensitive_delete ON companies;
CREATE TRIGGER audit_companies_sensitive_delete
  BEFORE DELETE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_data_change();