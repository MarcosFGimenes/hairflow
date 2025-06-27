"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { Customer } from '@/lib/types';
import { useEffect } from 'react';

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSubmit: (data: Omit<Customer, 'id'>) => void;
}

export function CustomerForm({ open, onOpenChange, customer, onSubmit }: CustomerFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<Customer, 'id'>>();

  useEffect(() => {
    reset({
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      tags: customer?.tags || []
    });
  }, [customer, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone', { 
                required: 'Telefone é obrigatório',
                pattern: {
                  value: /^[0-9]{10,11}$/,
                  message: 'Telefone inválido'
                }
              })}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="email">E-mail (Opcional)</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {customer ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
