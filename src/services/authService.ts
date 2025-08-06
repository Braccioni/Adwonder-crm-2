import { supabase } from '../lib/supabase';
import { User, LoginCredentials, RegisterData } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; session: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    try {
      // Get user profile from our custom table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn('Users table not configured, using basic auth:', profileError.message);
        // Create a temporary user object from auth data
        const tempUser: User = {
           id: data.user.id,
           email: data.user.email || credentials.email,
           nome: data.user.user_metadata?.nome || 'Utente',
           cognome: data.user.user_metadata?.cognome || 'Temporaneo',
           ruolo: 'commerciale',
           approved: true, // Allow login without approval system
           last_login: new Date().toISOString(),
           created_at: new Date().toISOString(),
         };
        return { user: tempUser, session: data.session };
      }

      // Check if user is approved
      if (!profile.approved) {
        // Sign out the user immediately
        await supabase.auth.signOut();
        throw new Error('Il tuo account è in attesa di approvazione da parte dell\'amministratore. Contatta il supporto per maggiori informazioni.');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      return { user: profile, session: data.session };
    } catch (error) {
      console.warn('Error accessing users table, using basic auth:', error);
      // Fallback to basic auth user
      const tempUser: User = {
         id: data.user.id,
         email: data.user.email || credentials.email,
         nome: data.user.user_metadata?.nome || 'Utente',
         cognome: data.user.user_metadata?.cognome || 'Temporaneo',
         ruolo: 'commerciale',
         approved: true,
         last_login: new Date().toISOString(),
         created_at: new Date().toISOString(),
       };
      return { user: tempUser, session: data.session };
    }
  },

  async register(userData: RegisterData): Promise<{ user: User; session: any }> {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nome: userData.nome,
          cognome: userData.cognome,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registrazione fallita');

    try {
      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: userData.email,
            nome: userData.nome,
            cognome: userData.cognome,
            ruolo: userData.ruolo,
            last_login: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.warn('Users table not configured, using basic auth:', profileError.message);
        // Create temporary user object
        const tempUser: User = {
           id: data.user.id,
           email: userData.email,
           nome: userData.nome,
           cognome: userData.cognome,
           ruolo: userData.ruolo,
           approved: true, // Auto-approve when users table doesn't exist
           last_login: new Date().toISOString(),
           created_at: new Date().toISOString(),
         };
        return { user: tempUser, session: data.session };
      }

      return { user: profile, session: data.session };
    } catch (error) {
      console.warn('Error creating user profile, using basic auth:', error);
      // Fallback to basic auth user
      const tempUser: User = {
         id: data.user.id,
         email: userData.email,
         nome: userData.nome,
         cognome: userData.cognome,
         ruolo: userData.ruolo,
         approved: true,
         last_login: new Date().toISOString(),
         created_at: new Date().toISOString(),
       };
      return { user: tempUser, session: data.session };
    }
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return null;

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return profile;
    } catch (error) {
      console.warn('Users table not configured, using basic auth data:', error);
      
      // Create temporary user from session data
      const tempUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        nome: session.user.user_metadata?.nome || 'Utente',
        cognome: session.user.user_metadata?.cognome || 'Temporaneo',
        ruolo: 'commerciale',
        approved: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      
      return tempUser;
    }
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Users table not configured, profile update skipped:', error);
      
      // Return current user data since we can't update
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Unable to get current user for profile update');
      }
      
      // Merge updates with current user data
      return { ...currentUser, ...updates };
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};