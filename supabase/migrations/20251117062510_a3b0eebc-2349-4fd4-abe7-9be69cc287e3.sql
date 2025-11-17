-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own warehouses"
ON public.warehouses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own warehouses"
ON public.warehouses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warehouses"
ON public.warehouses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warehouses"
ON public.warehouses FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own suppliers"
ON public.suppliers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers"
ON public.suppliers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers"
ON public.suppliers FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own categories"
ON public.categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
ON public.categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.categories FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create currencies table
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate NUMERIC(15, 6) NOT NULL DEFAULT 1.0,
  is_base BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own currencies"
ON public.currencies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own currencies"
ON public.currencies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own currencies"
ON public.currencies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own currencies"
ON public.currencies FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_currencies_updated_at
BEFORE UPDATE ON public.currencies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();