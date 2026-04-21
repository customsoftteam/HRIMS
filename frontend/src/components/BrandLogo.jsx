function BrandLogo({ size = 'md', showText = true, theme = 'dark', className = '' }) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-14',
  }

  const textClasses = theme === 'light'
    ? {
        title: 'text-slate-900',
        subtitle: 'text-slate-500',
      }
    : {
        title: 'text-emerald-100/90',
        subtitle: 'text-slate-200/80',
      }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/HRIMS_Logo.png"
        alt="HRIMS Orbit logo"
        className={`${sizeClasses[size] ?? sizeClasses.md} w-auto object-contain drop-shadow-sm`}
      />
      {showText ? (
        <div className="leading-tight">
          <p className={`text-sm font-bold uppercase tracking-[0.28em] ${textClasses.title}`}>HRIMS Orbit</p>
          <p className={`text-[11px] font-medium ${textClasses.subtitle}`}>People operations platform</p>
        </div>
      ) : null}
    </div>
  )
}

export default BrandLogo
