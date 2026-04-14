
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('donor', 'volunteer', 'receiver', 'admin');

-- Create food type enum
CREATE TYPE public.food_type AS ENUM ('veg', 'non-veg');

-- Create food category enum
CREATE TYPE public.food_category AS ENUM ('human-consumption', 'animal-feed', 'biogas', 'compost');

-- Create food status enum
CREATE TYPE public.food_status AS ENUM ('submitted', 'categorized', 'assigned', 'picked-up', 'delivered', 'completed');

-- Create distribution status enum
CREATE TYPE public.distribution_status AS ENUM ('pending', 'picked-up', 'in-transit', 'delivered');

-- Create storage condition enum
CREATE TYPE public.storage_condition AS ENUM ('refrigerated', 'room-temp', 'frozen');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Food items table
CREATE TABLE public.food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  donor_name TEXT NOT NULL DEFAULT '',
  food_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  food_type food_type NOT NULL DEFAULT 'veg',
  time_prepared TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_estimate TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  location TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category food_category NOT NULL DEFAULT 'human-consumption',
  status food_status NOT NULL DEFAULT 'submitted',
  safety_score INTEGER NOT NULL DEFAULT 100,
  storage_condition storage_condition NOT NULL DEFAULT 'room-temp',
  temperature NUMERIC NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Food items viewable by authenticated" ON public.food_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Donors can create food items" ON public.food_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can update own food items" ON public.food_items FOR UPDATE TO authenticated USING (auth.uid() = donor_id);
CREATE POLICY "Admins can manage all food items" ON public.food_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Distributions table
CREATE TABLE public.distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_id UUID REFERENCES public.food_items(id) ON DELETE CASCADE NOT NULL,
  volunteer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  volunteer_name TEXT NOT NULL DEFAULT '',
  receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  receiver_name TEXT,
  pickup_time TIMESTAMP WITH TIME ZONE,
  delivery_time TIMESTAMP WITH TIME ZONE,
  status distribution_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Distributions viewable by authenticated" ON public.distributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Volunteers can create distributions" ON public.distributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = volunteer_id);
CREATE POLICY "Volunteers can update own distributions" ON public.distributions FOR UPDATE TO authenticated USING (auth.uid() = volunteer_id);
CREATE POLICY "Admins can manage all distributions" ON public.distributions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON public.food_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_distributions_updated_at BEFORE UPDATE ON public.distributions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
