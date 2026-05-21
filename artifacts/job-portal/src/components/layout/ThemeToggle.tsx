import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 rounded-lg hover:bg-secondary/80 transition-all duration-300 group"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500 transition-transform group-hover:rotate-45 group-hover:scale-110" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600 transition-transform group-hover:rotate-45 group-hover:scale-110" />
      )}
    </Button>
  )
}
