export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="auth-bg absolute inset-0 -z-20"
        aria-hidden
      />
      {children}
    </div>
  )
}
