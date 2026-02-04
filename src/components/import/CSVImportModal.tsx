import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { parseCSV, CSVParseResult, ColumnMapping, ImportResult, ImportValidationError } from '@/lib/csv-parser';
import { cn } from '@/lib/utils';

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
}

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: FieldDefinition[];
  onImport: (data: Record<string, string>[]) => Promise<ImportResult>;
  onComplete?: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'result';

export function CSVImportModal({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onImport,
  onComplete,
}: CSVImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<CSVParseResult | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const reset = useCallback(() => {
    setStep('upload');
    setCsvData(null);
    setMappings({});
    setImportResult(null);
    setProgress(0);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
    if (importResult && importResult.success > 0) {
      onComplete?.();
    }
  }, [reset, onOpenChange, importResult, onComplete]);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setCsvData(parsed);
      
      // Auto-map columns with similar names
      const autoMappings: Record<string, string> = {};
      fields.forEach((field) => {
        const matchingHeader = parsed.headers.find(
          (h) => h.toLowerCase().replace(/[_\s]/g, '') === field.key.toLowerCase().replace(/[_\s]/g, '')
        );
        if (matchingHeader) {
          autoMappings[field.key] = matchingHeader;
        }
      });
      setMappings(autoMappings);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, [fields]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleMappingChange = useCallback((fieldKey: string, csvColumn: string) => {
    setMappings((prev) => ({
      ...prev,
      [fieldKey]: csvColumn === '__none__' ? '' : csvColumn,
    }));
  }, []);

  const canProceedToPreview = useCallback(() => {
    const requiredFields = fields.filter((f) => f.required);
    return requiredFields.every((f) => mappings[f.key]);
  }, [fields, mappings]);

  const getMappedData = useCallback((): Record<string, string>[] => {
    if (!csvData) return [];
    
    return csvData.rows.map((row) => {
      const mappedRow: Record<string, string> = {};
      Object.entries(mappings).forEach(([fieldKey, csvColumn]) => {
        if (csvColumn) {
          mappedRow[fieldKey] = row[csvColumn] || '';
        }
      });
      return mappedRow;
    });
  }, [csvData, mappings]);

  const handleImport = useCallback(async () => {
    setStep('importing');
    setProgress(0);
    
    const data = getMappedData();
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const result = await onImport(data);
      clearInterval(interval);
      setProgress(100);
      setImportResult(result);
      setStep('result');
    } catch (error) {
      clearInterval(interval);
      setImportResult({
        success: 0,
        errors: [{ row: 0, field: '', value: '', message: 'Erro ao importar dados' }],
        total: data.length,
      });
      setStep('result');
    }
  }, [getMappedData, onImport]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Arraste seu arquivo CSV aqui</h3>
            <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </span>
              </Button>
            </Label>
          </div>
        )}

        {step === 'mapping' && csvData && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Encontradas <strong>{csvData.rows.length}</strong> linhas com{' '}
                <strong>{csvData.headers.length}</strong> colunas. Mapeie as colunas abaixo.
              </AlertDescription>
            </Alert>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <Label className="w-40 text-sm">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select
                      value={mappings[field.key] || '__none__'}
                      onValueChange={(value) => handleMappingChange(field.key, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione a coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Não mapear --</SelectItem>
                        {csvData.headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="outline" onClick={reset}>
                Voltar
              </Button>
              <Button onClick={() => setStep('preview')} disabled={!canProceedToPreview()}>
                Pré-visualizar
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && csvData && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Revise os dados antes de importar. Serão importados{' '}
                <strong>{csvData.rows.length}</strong> registros.
              </AlertDescription>
            </Alert>

            <ScrollArea className="h-[300px] border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    {fields.filter((f) => mappings[f.key]).map((field) => (
                      <th key={field.key} className="px-3 py-2 text-left">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getMappedData().slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                      {fields.filter((f) => mappings[f.key]).map((field) => (
                        <td key={field.key} className="px-3 py-2 truncate max-w-[150px]">
                          {row[field.key] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.rows.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... e mais {csvData.rows.length - 10} registros
                </p>
              )}
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Voltar
              </Button>
              <Button onClick={handleImport}>
                Importar Dados
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
            <p className="text-center text-muted-foreground">Importando dados...</p>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              {importResult.success === importResult.total ? (
                <CheckCircle2 className="h-10 w-10 text-success" />
              ) : importResult.success > 0 ? (
                <AlertTriangle className="h-10 w-10 text-warning" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {importResult.success === importResult.total
                    ? 'Importação concluída!'
                    : importResult.success > 0
                    ? 'Importação parcial'
                    : 'Falha na importação'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {importResult.success} de {importResult.total} registros importados com sucesso
                </p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Erros encontrados:</h4>
                <ScrollArea className="h-[200px] border rounded-lg p-3">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm py-1 border-b last:border-0">
                      <span className="text-destructive font-medium">Linha {error.row}:</span>{' '}
                      {error.message}
                      {error.field && (
                        <span className="text-muted-foreground">
                          {' '}(campo: {error.field}, valor: "{error.value}")
                        </span>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
