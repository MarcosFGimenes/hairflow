// src/app/(admin)/dashboard/customers/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
import { 
  getCustomersBySalon,
  createCustomer,
  updateCustomer,
  deleteCustomer 
} from '@/lib/firestoreService';
import { Customer } from '@/lib/types';
import { CustomerForm } from '@/components/admin/CustomerForm';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Buscar clientes
  useEffect(() => {
    const fetchCustomers = async () => {
      if (user?.uid) {
        setIsLoading(true);
        try {
          const customersData = await getCustomersBySalon(user.uid);
          setCustomers(customersData);
          setFilteredCustomers(customersData);
        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os clientes",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCustomers();
  }, [user, toast]);

  // Filtrar clientes
  useEffect(() => {
    let result = [...customers];
    
    if (searchTerm) {
      result = result.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }
    
    if (selectedTag && selectedTag !== '__all__') {
      result = result.filter(customer => 
        customer.tags?.includes(selectedTag)
      );
    }
    
    setFilteredCustomers(result);
  }, [searchTerm, selectedTag, customers]);

  // CRUD Operations
  const handleCreate = async (customerData: Omit<Customer, 'id'>) => {
    try {
      if (!user?.uid) return;
      
      const newCustomerId = await createCustomer(customerData.phone, {
        ...customerData,
        salonId: user.uid
      });
      
      setCustomers(prev => [...prev, { id: newCustomerId, ...customerData }]);
      toast({ title: "Sucesso", description: "Cliente criado com sucesso" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async (id: string, customerData: Partial<Customer>) => {
    try {
      await updateCustomer(id, customerData);
      
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? { ...customer, ...customerData } : customer
        )
      );
      
      toast({ title: "Sucesso", description: "Cliente atualizado com sucesso" });
      setCurrentCustomer(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      toast({ title: "Sucesso", description: "Cliente removido com sucesso" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o cliente",
        variant: "destructive"
      });
    }
  };

  const handleAddTag = (customerId: string, tag: string) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { 
              ...customer, 
              tags: [...(customer.tags || []), tag] 
            } 
          : customer
      )
    );
  };

  const handleRemoveTag = (customerId: string, tag: string) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { 
              ...customer, 
              tags: customer.tags?.filter(t => t !== tag) || [] 
            } 
          : customer
      )
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meus Clientes</h1>
        <Button onClick={() => {
          setCurrentCustomer(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por etiqueta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as etiquetas</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
            <SelectItem value="Frequente">Frequente</SelectItem>
            <SelectItem value="Novo">Novo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Clientes */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>
                      {customer.lastVisit 
                        ? format(new Date(customer.lastVisit as string), 'dd/MM/yyyy') 
                        : 'Nunca visitou'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags?.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {tag}
                            <button 
                              onClick={() => handleRemoveTag(customer.id, tag)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        <button 
                          onClick={() => {
                            const newTag = prompt("Adicionar etiqueta:");
                            if (newTag) handleAddTag(customer.id, newTag);
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Tag className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setCurrentCustomer(customer);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir ${customer.name}?`)) {
                              handleDelete(customer.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de formulário */}
      <CustomerForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customer={currentCustomer}
        onSubmit={currentCustomer ? 
          (data) => handleUpdate(currentCustomer.id, data) : 
          handleCreate
        }
      />
    </div>
  );
}