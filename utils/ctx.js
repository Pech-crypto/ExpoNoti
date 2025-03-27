import { useContext, createContext } from "react";
import { useStorageState } from "./useStorageState";
import api, { login, getProfile } from "./api";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// Hook para acceder a la sesión
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production" && !value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function SessionProvider({ children }) {
  const [[isLoading, session], setSession] = useStorageState("session_token");

  return (
    <AuthContext.Provider
      value={{
        signIn: async (username, password) => {
          try {
            console.log("📡 Intentando iniciar sesión con:", { username, password });
            const sessionData = await login(username, password);
            if (!sessionData) {
              console.error("❌ Error: No se recibió información del usuario");
              throw new Error("Credenciales incorrectas");
            }
            setSession(sessionData);
            console.log("✅ Sesión guardada:", sessionData);

            // Obtener el perfil (si lo necesitas, opcional)
            const profile = await getProfile();
            console.log("👤 Perfil del usuario:", profile);

            return { success: true };
          } catch (error) {
            console.error("❌ Error en signIn:", error?.message || error);
            return { success: false, message: error?.message || "Error desconocido en el inicio de sesión" };
          }
        },
        signOut: async () => {
          await SecureStore.deleteItemAsync("session_token");
          setSession(null);
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}