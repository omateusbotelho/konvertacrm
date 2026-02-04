import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type LossReason = 
  | 'price' 
  | 'timing' 
  | 'competitor' 
  | 'no_budget' 
  | 'no_fit' 
  | 'other';

export interface CloseLostData {
  lossReason: LossReason;
  lossNotes?: string;
  lossCompetitor?: string;
}

export interface CloseWonData {
  actualCloseDate: string;
  startRecurring: boolean;
}

interface CloseDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'won' | 'lost';
  dealCompany: string;
  dealValue?: number;
  dealType?: 'retainer' | 'project';
  onConfirm: (data: CloseLostData | CloseWonData) => void;
}

const LOSS_REASONS: { value: LossReason; label: string }[] = [
  { value: 'price', label: 'Preço' },
  { value: 'timing', label: 'Timing' },
  { value: 'competitor', label: 'Concorrente' },
  { value: 'no_budget', label: 'Sem orçamento' },
  { value: 'no_fit', label: 'Sem fit' },
  { value: 'other', label: 'Outro' },
];

export function CloseDealDialog({
  open,
  onOpenChange,
  type,
  dealCompany,
  dealValue,
  dealType,
  onConfirm,
}: CloseDealDialogProps) {
  const [lossReason, setLossReason] = useState<LossReason | ''>('');
  const [lossNotes, setLossNotes] = useState('');
  const [lossCompetitor, setLossCompetitor] = useState('');
  const [actualCloseDate, setActualCloseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [startRecurring, setStartRecurring] = useState(true);

  const handleConfirm = () => {
    if (type === 'lost') {
      if (!lossReason) return;
      onConfirm({
        lossReason,
        lossNotes: lossNotes || undefined,
        lossCompetitor: lossReason === 'competitor' ? lossCompetitor : undefined,
      });
    } else {
      onConfirm({
        actualCloseDate,
        startRecurring: dealType === 'retainer' ? startRecurring : false,
      });
    }
    
    // Reset form
    setLossReason('');
    setLossNotes('');
    setLossCompetitor('');
    setActualCloseDate(new Date().toISOString().split('T')[0]);
    setStartRecurring(true);
    onOpenChange(false);
  };

  const isValid = type === 'lost' 
    ? lossReason !== '' && (lossReason !== 'competitor' || lossCompetitor.trim() !== '')
    : actualCloseDate !== '';

  const formattedValue = dealValue 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dealValue)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'won' ? 'Confirmar Fechamento' : 'Marcar como Perdido'}
          </DialogTitle>
          <DialogDescription>
            {type === 'won'
              ? `Confirme os detalhes do fechamento do deal com ${dealCompany}.`
              : `Informe o motivo da perda do deal com ${dealCompany}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {type === 'won' ? (
            <>
              {formattedValue && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Deal: <span className="font-medium text-foreground">{dealCompany}</span></p>
                  <p className="text-sm text-muted-foreground">Valor: <span className="font-semibold text-foreground">{formattedValue}</span></p>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="closeDate">Data de Fechamento *</Label>
                <Input
                  id="closeDate"
                  type="date"
                  value={actualCloseDate}
                  onChange={(e) => setActualCloseDate(e.target.value)}
                />
              </div>

              {dealType === 'retainer' && (
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="startRecurring"
                    checked={startRecurring}
                    onCheckedChange={(checked) => setStartRecurring(checked as boolean)}
                  />
                  <Label htmlFor="startRecurring" className="cursor-pointer">
                    Iniciar cobrança recorrente
                  </Label>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="lossReason">Motivo da Perda *</Label>
                <Select
                  value={lossReason}
                  onValueChange={(value) => setLossReason(value as LossReason)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOSS_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {lossReason === 'competitor' && (
                <div className="grid gap-2">
                  <Label htmlFor="competitor">Concorrente *</Label>
                  <Input
                    id="competitor"
                    placeholder="Nome do concorrente"
                    value={lossCompetitor}
                    onChange={(e) => setLossCompetitor(e.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Detalhes adicionais sobre a perda..."
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            variant={type === 'won' ? 'default' : 'destructive'}
          >
            {type === 'won' ? 'Confirmar Fechamento' : 'Confirmar Perda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
