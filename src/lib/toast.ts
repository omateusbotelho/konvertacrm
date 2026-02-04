import { toast as sonnerToast } from 'sonner';
import { parseErrorMessage, logError } from './errors';

// ========== TOAST TYPES ==========

interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ========== TOAST FUNCTIONS ==========

/**
 * Show a success toast
 */
export function toastSuccess(message: string, options?: ToastOptions): void {
  sonnerToast.success(message, {
    duration: options?.duration || 3000,
    description: options?.description,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
}

/**
 * Show an error toast
 */
export function toastError(
  errorOrMessage: unknown,
  options?: ToastOptions
): void {
  const message = typeof errorOrMessage === 'string' 
    ? errorOrMessage 
    : parseErrorMessage(errorOrMessage);

  // Log the error
  if (typeof errorOrMessage !== 'string') {
    logError(errorOrMessage, 'toast');
  }

  sonnerToast.error(message, {
    duration: options?.duration || 5000,
    description: options?.description,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
}

/**
 * Show an info toast
 */
export function toastInfo(message: string, options?: ToastOptions): void {
  sonnerToast.info(message, {
    duration: options?.duration || 4000,
    description: options?.description,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
}

/**
 * Show a warning toast
 */
export function toastWarning(message: string, options?: ToastOptions): void {
  sonnerToast.warning(message, {
    duration: options?.duration || 4000,
    description: options?.description,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
}

/**
 * Show a loading toast that can be updated
 */
export function toastLoading(message: string): string | number {
  return sonnerToast.loading(message);
}

/**
 * Update an existing toast (typically used after loading)
 */
export function toastUpdate(
  toastId: string | number,
  type: 'success' | 'error' | 'info',
  message: string
): void {
  switch (type) {
    case 'success':
      sonnerToast.success(message, { id: toastId });
      break;
    case 'error':
      sonnerToast.error(message, { id: toastId });
      break;
    case 'info':
      sonnerToast.info(message, { id: toastId });
      break;
  }
}

/**
 * Dismiss a specific toast or all toasts
 */
export function toastDismiss(toastId?: string | number): void {
  if (toastId) {
    sonnerToast.dismiss(toastId);
  } else {
    sonnerToast.dismiss();
  }
}

// ========== ASYNC TOAST HELPER ==========

interface AsyncToastMessages {
  loading: string;
  success: string;
  error?: string;
}

/**
 * Handle async operations with loading, success, and error toasts
 * 
 * @example
 * await toastAsync(
 *   async () => await saveData(),
 *   {
 *     loading: 'Salvando...',
 *     success: 'Salvo com sucesso!',
 *     error: 'Erro ao salvar'
 *   }
 * );
 */
export async function toastAsync<T>(
  promise: Promise<T> | (() => Promise<T>),
  messages: AsyncToastMessages
): Promise<T | undefined> {
  const toastId = toastLoading(messages.loading);
  
  try {
    const result = typeof promise === 'function' ? await promise() : await promise;
    toastUpdate(toastId, 'success', messages.success);
    return result;
  } catch (error) {
    const errorMessage = messages.error || parseErrorMessage(error);
    toastUpdate(toastId, 'error', errorMessage);
    logError(error, 'async-toast');
    return undefined;
  }
}

// ========== COMMON TOAST MESSAGES ==========

export const TOAST_MESSAGES = {
  // CRUD operations
  created: (resource: string) => `${resource} criado(a) com sucesso!`,
  updated: (resource: string) => `${resource} atualizado(a) com sucesso!`,
  deleted: (resource: string) => `${resource} removido(a) com sucesso!`,
  saved: 'Alterações salvas com sucesso!',
  
  // Status changes
  dealMoved: 'Deal movido com sucesso!',
  dealClosed: 'Deal fechado com sucesso!',
  dealLost: 'Deal marcado como perdido',
  statusChanged: 'Status atualizado com sucesso!',
  
  // Actions
  copied: 'Copiado para a área de transferência!',
  exported: 'Exportação realizada com sucesso!',
  imported: 'Importação realizada com sucesso!',
  sent: 'Enviado com sucesso!',
  
  // Errors
  loadError: 'Erro ao carregar dados. Tente novamente.',
  saveError: 'Erro ao salvar. Tente novamente.',
  deleteError: 'Erro ao remover. Tente novamente.',
  networkError: 'Sem conexão. Verifique sua internet.',
  permissionError: 'Você não tem permissão para esta ação.',
  
  // Warnings
  unsavedChanges: 'Você tem alterações não salvas.',
  sessionExpiring: 'Sua sessão está expirando. Salve seu trabalho.',
  
  // Info
  loading: 'Carregando...',
  saving: 'Salvando...',
  processing: 'Processando...',
  pending: 'Ação pendente de aprovação.',
} as const;
