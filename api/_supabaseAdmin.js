
import { createClient } from "@supabase/supabase-js";
import { Agent, fetch as undiciFetch } from "undici";

const dispatcher = new Agent({
  connect: { autoSelectFamily: true }
});

const customFetch = (url, options) =>
  undiciFetch(url, { ...options, dispatcher });

const options = {
  global: {
    fetch: customFetch
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
};

export const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  options
);

export const anon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  options
);

export async function requireAdmin(req) {
  const token = (req.headers.authorization || "")
    .replace(/^Bearer\s+/i, "");

  if (!token) throw new Error("Faça login novamente.");

  const { data: { user }, error } =
    await admin.auth.getUser(token);

  if (error || !user) {
    console.error("Erro Supabase:", error);
    throw new Error("Sessão inválida: " + (error?.message || "Usuário não encontrado"));
  }

  const { data: profile, error: e } = await admin
    .from("perfis")
    .select("tipo")
    .eq("id", user.id)
    .single();

  if (e || profile?.tipo !== "admin") {
    throw new Error("Apenas o administrador pode realizar esta ação.");
  }

  return user;
}
