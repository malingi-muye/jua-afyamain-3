import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  // Fallback to process.env for Netlify-injected variables
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  const geminiKey = env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ""

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    define: {
      // Support VITE_ prefix (standard Vite convention)
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseKey),
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(geminiKey),
      // Also inject NEXT_PUBLIC_ variants for production builds
      "import.meta.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(supabaseKey),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id) return
            // Only split app pages/components, let Vite handle vendor chunking
            if (id.includes('components/PatientList') || id.includes('pages/PatientListPage')) return 'patient-list'
            if (id.includes('components/WhatsAppAgent') || id.includes('pages/WhatsAppAgentPage')) return 'whatsapp-agent'
            if (id.includes('components/Reports') || id.includes('pages/ReportsPage')) return 'reports'
            if (id.includes('components/Profile') || id.includes('pages/ProfilePage')) return 'profile'
          }
        }
      },
      chunkSizeWarningLimit: 800,
    },
    optimizeDeps: {
      include: ['lucide-react', 'react', 'react-dom', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-scroll-area'],
    },
  }
})
